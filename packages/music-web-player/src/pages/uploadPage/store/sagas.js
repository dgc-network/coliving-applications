import { Kind, Name, Status, makeUid } from '@coliving/common'
import { push as pushRoute } from 'connected-react-router'
import { range } from 'lodash'
import { channel, buffers } from 'redux-saga'
import {
  call,
  put,
  select,
  take,
  takeLatest,
  fork,
  cancel,
  all,
  race
} from 'redux-saga/effects'

import * as accountActions from 'common/store/account/reducer'
import {
  getAccountUser,
  getUserHandle,
  getUserId
} from 'common/store/account/selectors'
import * as cacheActions from 'common/store/cache/actions'
import { reformat } from 'common/store/cache/collections/utils'
import * as digitalContentsActions from 'common/store/cache/digital_contents/actions'
import { digitalContentNewRemixEvent } from 'common/store/cache/digital_contents/sagas'
import { getUser } from 'common/store/cache/users/selectors'
import { formatUrlName } from 'common/utils/formatUtil'
import {
  getSelectedServices,
  getStatus
} from 'components/serviceSelection/store/selectors'
import { fetchServicesFailed } from 'components/serviceSelection/store/slice'
import UploadType from 'pages/uploadPage/components/uploadType'
import { getStems } from 'pages/uploadPage/store/selectors'
import { updateAndFlattenStems } from 'pages/uploadPage/store/utils/stems'
import ColivingBackend from 'services/colivingBackend'
import apiClient from 'services/colivingAPIClient/colivingAPIClient'
import { make } from 'store/analytics/actions'
import { waitForBackendSetup } from 'store/backend/sagas'
import * as confirmerActions from 'store/confirmer/actions'
import { confirmTransaction } from 'store/confirmer/sagas'
import { ERROR_PAGE } from 'utils/route'
import { actionChannelDispatcher, waitForValue } from 'utils/sagaHelpers'

import * as uploadActions from './actions'
import { watchUploadErrors } from './errorSagas'
import { ProgressStatus } from './types'
import { reportSuccessAndFailureEvents } from './utils/sagaHelpers'

const MAX_CONCURRENT_UPLOADS = 4
const MAX_CONCURRENT_REGISTRATIONS = 4
const MAX_CONCURRENT_DIGITAL_CONTENT_SIZE_BYTES = 40 /* MB */ * 1024 * 1024
const UPLOAD_TIMEOUT_MILLIS =
  2 /* hour */ * 60 /* min */ * 60 /* sec */ * 1000 /* ms */

/**
 * Combines the metadata for a digital_content and a collection (contentList or album),
 * taking the metadata from the contentList when the digital_content is missing it.
 * @param {object} digitalContentMetadata
 * @param {object} collectionMetadata
 */
const combineMetadata = (digitalContentMetadata, collectionMetadata) => {
  const metadata = digitalContentMetadata

  metadata.cover_art_sizes = collectionMetadata.cover_art_sizes
  metadata.artwork = collectionMetadata.artwork

  if (!metadata.genre) metadata.genre = collectionMetadata.genre
  if (!metadata.mood) metadata.mood = collectionMetadata.mood

  if (collectionMetadata.tags) {
    if (!metadata.tags) {
      // Take collection tags
      metadata.tags = collectionMetadata.tags
    } else {
      // Combine tags and dedupe
      metadata.tags = [
        ...new Set([
          ...metadata.tags.split(','),
          ...collectionMetadata.tags.split(',')
        ])
      ].join(',')
    }
  }
  return digitalContentMetadata
}

const getNumWorkers = (digitalContentFiles) => {
  const largestFileSize = Math.max(...digitalContentFiles.map((t) => t.size))

  // Divide it out so that we never hit > MAX_CONCURRENT_DIGITAL_CONTENT_SIZE_BYTES in flight.
  // e.g. so if we have 40 MB max upload and max digital_content size of 15MB,
  // floor(40/15) => 2 workers
  const numWorkers = Math.floor(
    MAX_CONCURRENT_DIGITAL_CONTENT_SIZE_BYTES / largestFileSize
  )
  const maxWorkers = Math.min(MAX_CONCURRENT_UPLOADS, digitalContentFiles.length)

  // Clamp between 1 and `maxWorkers`
  return Math.min(Math.max(numWorkers, 1), maxWorkers)
}

// Worker to handle individual digital_content upload requests.
// Crucially, the worker will block on receiving more requests
// until its current request has finished processing.
//
// Workers can either be send a request that looks like:
// {
//   digital_content: ...,
//   metadata: ...,
//   id: ...,
//   index: ...
//   artwork?: ...,
//   isCollection: boolean
//   updateProgress: boolean
// }
//
// or to signal to the worker that it should shut down:
// { done: true }
//
// Workers respond differently depending on whether the request was
// a collection or not.
// For a collection:
// {
//    originalId: ...
//    metadataMultihash: ...
//    metadataFileUUID: ...
// }
//
// For individual digitalContents:
//  {
//    originalId: ...,
//    newId: ...
//  }
//
// And if the worker encountered an error:
//  {
//    originalId: ...
//    error: true
//  }
//
function* uploadWorker(requestChan, respChan, progressChan) {
  // Use this channel to know when confirmer has finished,
  // so we can unblock this worker to accept more requests.
  const uploadDoneChan = yield call(channel)

  const makeOnProgress = (index) => {
    // DigitalContents can retry now, so that means
    // the loaded value may actually retreat. We don't want to show
    // this to the user, so only feed increasing vals of loaded into
    // progressChan
    let maxLoaded = 0

    return (loaded, total) => {
      maxLoaded = Math.max(maxLoaded, loaded)
      try {
        progressChan.put(
          uploadActions.updateProgress(index, {
            loaded: maxLoaded,
            total,
            status:
              loaded !== total
                ? ProgressStatus.UPLOADING
                : ProgressStatus.PROCESSING
          })
        )
      } catch {
        // Sometimes this can fail repeatedly in quick succession (root cause TBD)
        // it doesn't seem to affect the CX so catch to avoid spamming sentry
      }
    }
  }

  // If it's not a collection (e.g. we're just uploading multiple digitalContents)
  // we can call uploadDigitalContent, which uploads to content node and then writes to chain.
  const makeConfirmerCall = (
    digital_content,
    metadata,
    artwork,
    index,
    id,
    updateProgress
  ) => {
    return function* () {
      console.debug(
        `Beginning non-collection upload for digital_content: ${metadata.title}`
      )
      const { blockHash, blockNumber, digitalContentId, error, phase } = yield call(
        ColivingBackend.uploadDigitalContent,
        digital_content.file,
        artwork,
        metadata,
        updateProgress ? makeOnProgress(index) : (loaded, total) => {}
      )

      // b/c we can't pass extra info (phase) into the confirmer fail call, we need to clean up here.
      // (not great)
      if (error) {
        // If we failed, signal to the parent saga
        yield put(respChan, {
          originalId: id,
          error: true,
          timeout: false,
          message: error,
          phase
        })

        // Just to prevent success call from running
        throw new Error('')
      }

      console.debug(`Got new ID ${digitalContentId} for digital_content ${metadata.title}}`)

      const confirmed = yield call(confirmTransaction, blockHash, blockNumber)
      if (!confirmed) {
        throw new Error(
          `Could not confirm digital_content upload for digital_content id ${digitalContentId}`
        )
      }
      return digitalContentId
    }
  }

  // If it is a collection, we should just upload to content node.
  const makeConfirmerCallForCollection = (digital_content, metadata, artwork, index) => {
    return function* () {
      console.debug(`Beginning collection upload for digital_content: ${metadata.title}`)
      return yield call(
        ColivingBackend.uploadDigitalContentToContentNode,
        digital_content.file,
        artwork,
        metadata,
        makeOnProgress(index)
      )
    }
  }

  const makeConfirmerSuccess = (id, index, updateProgress) => {
    return function* (newDigitalContentId) {
      if (updateProgress) {
        yield put(
          progressChan,
          uploadActions.updateProgress(index, {
            status: ProgressStatus.COMPLETE
          })
        )
      }

      // Now we need to tell the response channel that we finished
      const resp = { originalId: id, newId: newDigitalContentId }
      console.debug(`Finished digital_content upload of id: ${newDigitalContentId}`)
      yield put(respChan, resp)

      // Finally, unblock this worker
      yield put(uploadDoneChan, {})
    }
  }

  const makeConfirmerSuccessForCollection = (id, index) => {
    return function* ({
      metadataMultihash,
      metadataFileUUID,
      transcodedDigitalContentCID,
      transcodedDigitalContentUUID
    }) {
      console.debug({
        metadataMultihash,
        metadataFileUUID,
        transcodedDigitalContentCID,
        transcodedDigitalContentUUID
      })

      // Don't tell the progress channel we're done yet, because we need
      // to still call to chain.
      // Now we need to tell the response channel that we finished
      const resp = {
        originalId: id,
        metadataMultihash,
        metadataFileUUID,
        transcodedDigitalContentCID,
        transcodedDigitalContentUUID
      }

      console.debug(`Finished content node upload of: ${JSON.stringify(resp)}`)
      yield put(respChan, resp)

      // Finally, unblock this worker
      yield put(uploadDoneChan, {})
    }
  }

  function* confirmerFailure() {
    // unblock this worker
    yield put(uploadDoneChan, {})
  }

  const makeConfirmerFailureCollection = (originalId) => {
    return function* ({ timeout, message }) {
      console.error(`Upload failed for id: ${originalId}`)
      // If we failed, signal to the parent saga
      yield put(respChan, {
        originalId,
        error: true,
        timeout,
        message
      })

      // Now unblock this worker
      yield put(uploadDoneChan, {})
    }
  }

  // worker runloop
  while (true) {
    const request = yield take(requestChan)
    const {
      digital_content,
      metadata,
      id,
      index,
      artwork,
      isCollection,
      updateProgress
    } = request

    yield put(
      confirmerActions.requestConfirmation(
        id,
        (isCollection ? makeConfirmerCallForCollection : makeConfirmerCall)(
          digital_content,
          metadata,
          artwork,
          index,
          id,
          updateProgress
        ),
        (isCollection
          ? makeConfirmerSuccessForCollection
          : makeConfirmerSuccess)(id, index, updateProgress),
        isCollection ? makeConfirmerFailureCollection(id) : confirmerFailure,
        () => {},
        UPLOAD_TIMEOUT_MILLIS
      )
    )

    yield take(uploadDoneChan)
  }
}

/*
 * handleUploads spins up to MAX_CONCURRENT_UPLOADS workers to handle individual uploads.
 *
 * digitalContents is of type [{ digital_content: ..., metadata: ... }]
 */
export function* handleUploads({
  digitalContents,
  isCollection,
  isStem = false,
  isAlbum = false
}) {
  const numWorkers = getNumWorkers(digitalContents.map((t) => t.digital_content.file))

  // Map of shape {[digitalContentId]: { digital_content: digital_content, metadata: object, artwork?: file, index: number }}
  const idToDigitalContentMap = digitalContents.reduce((prev, cur, idx) => {
    const newId = `${cur.metadata.title}_${idx}`
    prev[newId] = {
      digital_content: cur.digital_content,
      metadata: cur.metadata,
      index: idx,
      artwork: cur.metadata.artwork.file
    }
    return prev
  }, {})

  // `progressChan` is used to dispatch
  // redux actions so the UI knows what's going on.
  const progressChan = yield call(channel)
  const actionDispatcherTask = yield fork(actionChannelDispatcher, progressChan)

  // `requestChan` is used to communicate
  // requests to workers from this main process
  const requestChan = yield call(channel, buffers.expanding(10))

  // `respChan` is used to communicate
  // when a worker has finished it's job
  // It will see result like { originalId: id, newId: digitalContentInfo.newId }
  const respChan = yield call(channel)

  // Spawn up our workers
  console.debug(`Spinning up ${numWorkers} workers`)
  const workerTasks = yield all(
    range(numWorkers).map((_) =>
      fork(uploadWorker, requestChan, respChan, progressChan)
    )
  )

  // Give our workers jobs to do
  const ids = Object.keys(idToDigitalContentMap)
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i]
    const value = idToDigitalContentMap[id]
    const request = {
      id,
      digital_content: value.digital_content,
      metadata: value.metadata,
      index: value.index,
      artwork: isCollection ? null : value.artwork,
      isCollection,
      updateProgress: !isStem
    }
    yield put(requestChan, request)
    yield put(
      make(Name.DIGITAL_CONTENT_UPLOAD_DIGITAL_CONTENT_UPLOADING, {
        artworkSource: value.metadata.artwork.source,
        genre: value.metadata.genre,
        mood: value.metadata.mood,
        downloadable:
          value.metadata.download && value.metadata.download.is_downloadable
            ? value.metadata.download.requires_follow
              ? 'follow'
              : 'yes'
            : 'no'
      })
    )
  }

  // Set some sensible progress values
  if (!isStem) {
    for (let i = 0; i < ids.length; i++) {
      const digitalContentFile = digitalContents[i].digital_content.file
      yield put(
        progressChan,
        uploadActions.updateProgress(i, {
          loaded: 0,
          total: digitalContentFile.size,
          status: ProgressStatus.UPLOADING
        })
      )
    }
  }

  // Now wait for our workers to finish or error
  console.debug('Awaiting workers')
  let numOutstandingRequests = digitalContents.length
  let numSuccessRequests = 0 // Technically not needed, but adding defensively
  const digitalContentIds = []
  const contentNodeMetadata = []
  const failedRequests = [] // Array of shape [{ id, timeout, message }]

  // We should only stop the whole upload if a request fails
  // in the collection upload case.
  const stopDueToFailure = () => failedRequests.length > 0 && isCollection

  while (!stopDueToFailure() && numOutstandingRequests !== 0) {
    const {
      error,
      phase,
      timeout,
      message,
      originalId,
      newId,
      metadataMultihash,
      metadataFileUUID,
      transcodedDigitalContentCID,
      transcodedDigitalContentUUID
    } = yield take(respChan)

    if (error) {
      console.error('Worker errored')
      const index = idToDigitalContentMap[originalId].index

      if (!isStem) {
        yield put(uploadActions.uploadSingleDigitalContentFailed(index))
      }

      // Save this out to the failedRequests array
      failedRequests.push({ originalId, timeout, message, phase })
      numOutstandingRequests -= 1
      continue
    }

    // Logic here depends on whether it's a collection or not.
    // If it's not a collection, rejoice because we have the digitalContentId already.
    // Otherwise, save our metadata and continue on.
    if (isCollection) {
      contentNodeMetadata.push({
        metadataMultihash,
        metadataFileUUID,
        transcodedDigitalContentCID,
        transcodedDigitalContentUUID,
        originalId
      })
    } else {
      const digitalContentObj = idToDigitalContentMap[originalId]
      digitalContentIds[digitalContentObj.index] = newId
    }

    // Finally, decrement the request count and increase success count
    numOutstandingRequests -= 1
    numSuccessRequests += 1
  }

  // Regardless of whether we stopped due to finishing
  // all requests or from an error,  now we spin down.
  console.debug('Spinning down workers')
  yield all(workerTasks.map((t) => cancel(t)))

  let returnVal = { digitalContentIds }

  // Report success + failure events
  const uploadType = isCollection
    ? isAlbum
      ? 'album'
      : 'contentList'
    : 'multi_digital_content'
  yield reportSuccessAndFailureEvents({
    // Don't report non-uploaded digitalContents due to contentList upload abort
    numSuccess: numSuccessRequests,
    numFailure: failedRequests.length,
    errors: failedRequests.map((r) => r.message),
    uploadType
  })

  if (isCollection) {
    // If this was a collection and we didn't error,
    // now we go write all this out to chain
    if (failedRequests.length === 0) {
      // First, re-sort the CNODE metadata
      // to match what was originally sent by the user.
      const sortedMetadata = []
      contentNodeMetadata.forEach((m) => {
        const originalIndex = idToDigitalContentMap[m.originalId].index
        sortedMetadata[originalIndex] = m
      })

      console.debug(
        `Attempting to register digitalContents: ${JSON.stringify(sortedMetadata)}`
      )

      // Send the digitalContents off to chain to get our digitalContentIDs
      //
      // We want to limit the number of concurrent requests to chain here, as tons and tons of
      // digitalContents lead to a lot of metadata being colocated on the same block and discovery nodes
      // can have a hard time keeping up. [see AUD-462]. So, chunk the registration into "rounds."
      //
      // Multi-digital-content upload does not have the same issue because we write to chain immediately
      // after each upload succeeds and those fire on a rolling window.
      // Realistically, with a higher throughput system, this should be a non-issue.
      let digitalContentIds = []
      let error = null
      for (
        let i = 0;
        i < sortedMetadata.length;
        i += MAX_CONCURRENT_REGISTRATIONS
      ) {
        const concurrentMetadata = sortedMetadata.slice(
          i,
          i + MAX_CONCURRENT_REGISTRATIONS
        )
        const { digitalContentIds: roundDigitalContentIds, error: roundHadError } =
          yield ColivingBackend.registerUploadedDigitalContents(concurrentMetadata)

        digitalContentIds = digitalContentIds.concat(roundDigitalContentIds)
        console.debug(
          `Finished registering: ${roundDigitalContentIds}, Registered so far: ${digitalContentIds}`
        )

        // Any errors should break out, but we need to record the associated digitalContents first
        // so that we can delete the orphaned ones.
        if (roundHadError) {
          error = roundHadError
          break
        }
      }

      if (error) {
        console.error('Something went wrong registering digitalContents!')

        // Delete digitalContents if necessary
        if (digitalContentIds.length > 0) {
          // If there were digitalContents, that means we wrote to chain
          // but our call to associate failed.
          // First log this error, but don't navigate away
          // bc we need them to keep the page open to delete digitalContents
          yield put(uploadActions.associateDigitalContentsError(error))
          console.debug(`Deleting orphaned digitalContents: ${JSON.stringify(digitalContentIds)}`)
          try {
            yield all(digitalContentIds.map((id) => ColivingBackend.deleteDigitalContent(id)))
            console.debug('Successfully deleted orphaned digitalContents')
          } catch {
            console.debug('Something went wrong deleting orphaned digitalContents')
          }
          // Now navigate them to something went wrong
          yield put(pushRoute(ERROR_PAGE))
        } else {
          yield put(uploadActions.addDigitalContentToChainError(error))
        }

        returnVal = { error: true }
      } else {
        console.debug('DigitalContents registered successfully')
        // Update all the progress
        if (!isStem) {
          yield all(
            range(digitalContents.length).map((i) =>
              put(
                progressChan,
                uploadActions.updateProgress(i, {
                  status: ProgressStatus.COMPLETE
                })
              )
            )
          )
        }
        returnVal = { digitalContentIds }
      }
    } else {
      // Because it's a collection we stopped for just 1
      // failed request
      const { timeout, message } = failedRequests[0]
      if (timeout) {
        yield put(uploadActions.contentNodeTimeoutError())
      } else {
        yield put(uploadActions.contentNodeUploadError(message))
      }
      returnVal = { error: true }
    }
  } else if (!isCollection && failedRequests.length > 0) {
    // If some requests failed for multidigitalContent, log em
    yield all(
      failedRequests.map((r) => {
        if (r.timeout) {
          return put(uploadActions.multiDigitalContentTimeoutError())
        } else {
          return put(
            uploadActions.multiDigitalContentUploadError(
              r.message,
              r.phase,
              digitalContents.length,
              isStem
            )
          )
        }
      })
    )
  }

  console.debug('Finished upload')

  yield call(progressChan.close)
  yield cancel(actionDispatcherTask)
  return returnVal
}

function* uploadCollection(digitalContents, userId, collectionMetadata, isAlbum) {
  // First upload album art
  const coverArtResp = yield call(
    ColivingBackend.uploadImage,
    collectionMetadata.artwork.file
  )
  collectionMetadata.cover_art_sizes = coverArtResp.dirCID

  // Then upload digitalContents
  const digitalContentsWithMetadata = digitalContents.map((digital_content) => {
    const metadata = combineMetadata(digital_content.metadata, collectionMetadata)
    return {
      digital_content,
      metadata
    }
  })
  const { digitalContentIds, error } = yield call(handleUploads, {
    digitalContents: digitalContentsWithMetadata,
    isCollection: true,
    isAlbum
  })

  // If we errored, return early
  if (error) {
    console.debug('Saw an error, not going to create a contentList.')
    return
  }

  // Finally, create the contentList
  yield put(
    confirmerActions.requestConfirmation(
      `${collectionMetadata.content_list_name}_${Date.now()}`,
      function* () {
        console.debug('Creating contentList')
        // Uploaded collections are always public
        const isPrivate = false
        const { blockHash, blockNumber, contentListId, error } = yield call(
          ColivingBackend.createContentList,
          userId,
          collectionMetadata,
          isAlbum,
          digitalContentIds,
          isPrivate
        )

        if (error) {
          console.debug('Caught an error creating contentList')
          if (contentListId) {
            yield put(uploadActions.createContentListErrorIDExists(error))
            console.debug('Deleting contentList')
            // If we got a contentList ID back, that means we
            // created the contentList but adding digitalContents to it failed. So we must delete the contentList
            yield call(ColivingBackend.deleteContentList, contentListId)
            console.debug('ContentList deleted successfully')
          } else {
            // I think this is what we want
            yield put(uploadActions.createContentListErrorNoId(error))
          }
          // Throw to trigger the fail callback
          throw new Error('ContentList creation error')
        }

        const confirmed = yield call(confirmTransaction, blockHash, blockNumber)
        if (!confirmed) {
          throw new Error(
            `Could not confirm contentList creation for contentList id ${contentListId}`
          )
        }
        return (yield call(ColivingBackend.getContentLists, userId, [contentListId]))[0]
      },
      function* (confirmedContentList) {
        yield put(
          uploadActions.uploadDigitalContentsSucceeded(confirmedContentList.content_list_id)
        )
        const user = yield select(getUser, { id: userId })
        yield put(
          cacheActions.update(Kind.USERS, [
            {
              id: userId,
              metadata: {
                _collectionIds: (user._collectionIds || []).concat(
                  confirmedContentList.content_list_id
                )
              }
            }
          ])
        )

        // Add images to the collection since we're not loading it the traditional way with
        // the `fetchCollections` saga
        confirmedContentList = yield call(reformat, confirmedContentList)
        const uid = yield makeUid(
          Kind.COLLECTIONS,
          confirmedContentList.content_list_id,
          'account'
        )
        // Create a cache entry and add it to the account so the contentList shows in the left nav
        yield put(
          cacheActions.add(
            Kind.COLLECTIONS,
            [
              {
                id: confirmedContentList.content_list_id,
                uid,
                metadata: confirmedContentList
              }
            ],
            /* replace= */ true // forces cache update
          )
        )
        yield put(
          accountActions.addAccountContentList({
            id: confirmedContentList.content_list_id,
            name: confirmedContentList.content_list_name,
            is_album: confirmedContentList.is_album,
            user: {
              id: user.user_id,
              handle: user.handle
            }
          })
        )
        yield put(
          make(Name.DIGITAL_CONTENT_UPLOAD_COMPLETE_UPLOAD, {
            count: digitalContentIds.length,
            kind: isAlbum ? 'album' : 'contentList'
          })
        )
        yield put(cacheActions.setExpired(Kind.USERS, userId))
      },
      function* ({ timeout }) {
        // All other non-timeout errors have
        // been accounted for at this point
        if (timeout) {
          yield put(uploadActions.createContentListPollingTimeout())
        }

        console.error(
          `Create contentList call failed, deleting digitalContents: ${JSON.stringify(
            digitalContentIds
          )}`
        )
        try {
          yield all(digitalContentIds.map((id) => ColivingBackend.deleteDigitalContent(id)))
          console.debug('Deleted digitalContents.')
        } catch (err) {
          console.debug(`Could not delete all digitalContents: ${err}`)
        }
        yield put(pushRoute(ERROR_PAGE))
      }
    )
  )
}

function* uploadSingleDigitalContent(digital_content) {
  // Need an object to hold phase error info that
  // can get captured by confirmer closure
  // while remaining mutable.
  const phaseContainer = { phase: null }
  const progressChan = yield call(channel)

  // When the upload finishes, it should return
  // either a { digital_content_id } or { error } object,
  // which is then used to upload stems if they exist.
  const responseChan = yield call(channel)

  const dispatcher = yield fork(actionChannelDispatcher, progressChan)
  const recordEvent = make(Name.DIGITAL_CONTENT_UPLOAD_DIGITAL_CONTENT_UPLOADING, {
    artworkSource: digital_content.metadata.artwork.source,
    genre: digital_content.metadata.genre,
    mood: digital_content.metadata.mood,
    downloadable:
      digital_content.metadata.download && digital_content.metadata.download.is_downloadable
        ? digital_content.metadata.download.requires_follow
          ? 'follow'
          : 'yes'
        : 'no'
  })
  yield put(recordEvent)

  yield put(
    confirmerActions.requestConfirmation(
      `${digital_content.metadata.title}`,
      function* () {
        const { blockHash, blockNumber, digitalContentId, error, phase } = yield call(
          ColivingBackend.uploadDigitalContent,
          digital_content.file,
          digital_content.metadata.artwork.file,
          digital_content.metadata,
          (loaded, total) => {
            progressChan.put(
              uploadActions.updateProgress(0, {
                loaded,
                total,
                status:
                  loaded !== total
                    ? ProgressStatus.UPLOADING
                    : ProgressStatus.PROCESSING
              })
            )
          }
        )

        if (error) {
          phaseContainer.phase = phase
          throw new Error(error)
        }

        const userId = yield select(getUserId)
        const handle = yield select(getUserHandle)
        const confirmed = yield call(confirmTransaction, blockHash, blockNumber)
        if (!confirmed) {
          throw new Error(`Could not confirm upload single digital_content ${digitalContentId}`)
        }

        return yield apiClient.getDigitalContent({
          id: digitalContentId,
          currentUserId: userId,
          unlistedArgs: {
            urlTitle: formatUrlName(digital_content.metadata.title),
            handle
          }
        })
      },
      function* (confirmedDigitalContent) {
        yield call(responseChan.put, { confirmedDigitalContent })
      },
      function* ({ timeout, message }) {
        yield put(uploadActions.uploadDigitalContentFailed())

        if (timeout) {
          yield put(uploadActions.singleDigitalContentTimeoutError())
        } else {
          yield put(
            uploadActions.singleDigitalContentUploadError(
              message,
              phaseContainer.phase,
              digital_content.file.size
            )
          )
        }
        yield cancel(dispatcher)
        yield call(responseChan.put, { error: message })
      },
      () => {},
      UPLOAD_TIMEOUT_MILLIS
    )
  )

  const { confirmedDigitalContent, error } = yield take(responseChan)

  yield reportSuccessAndFailureEvents({
    numSuccess: error ? 0 : 1,
    numFailure: error ? 1 : 0,
    uploadType: 'single_digital_content',
    errors: error ? [error] : []
  })

  if (error) {
    return
  }

  const stems = yield select(getStems)
  if (stems.length) {
    yield call(uploadStems, {
      parentDigitalContentIds: [confirmedDigitalContent.digital_content_id],
      stems
    })
  }

  // Finish up the upload
  progressChan.put(
    uploadActions.updateProgress(0, { status: ProgressStatus.COMPLETE })
  )
  yield put(
    uploadActions.uploadDigitalContentsSucceeded(confirmedDigitalContent.digital_content_id, [
      confirmedDigitalContent
    ])
  )
  yield put(
    make(Name.DIGITAL_CONTENT_UPLOAD_COMPLETE_UPLOAD, {
      count: 1,
      kind: 'digitalContents'
    })
  )
  const account = yield select(getAccountUser)
  yield put(cacheActions.setExpired(Kind.USERS, account.user_id))

  if (confirmedDigitalContent.download && confirmedDigitalContent.download.is_downloadable) {
    yield put(digitalContentsActions.checkIsDownloadable(confirmedDigitalContent.digital_content_id))
  }

  // If the hide remixes is turned on, send analytics event
  if (
    confirmedDigitalContent.field_visibility &&
    !confirmedDigitalContent.field_visibility.remixes
  ) {
    yield put(
      make(Name.REMIX_HIDE, {
        id: confirmedDigitalContent.digital_content_id,
        handle: account.handle
      })
    )
  }

  if (
    confirmedDigitalContent.remix_of &&
    Array.isArray(confirmedDigitalContent.remix_of.digitalContents) &&
    confirmedDigitalContent.remix_of.digitalContents.length > 0
  ) {
    yield call(digitalContentNewRemixEvent, confirmedDigitalContent)
  }

  yield cancel(dispatcher)
}

export function* uploadStems({ parentDigitalContentIds, stems }) {
  const updatedStems = updateAndFlattenStems(stems, parentDigitalContentIds)

  const uploadedDigitalContents = yield call(handleUploads, {
    digitalContents: updatedStems,
    isCollection: false,
    isStem: true
  })
  if (uploadedDigitalContents.digitalContentIds) {
    for (let i = 0; i < uploadedDigitalContents.digitalContentIds.length; i += 1) {
      const digitalContentId = uploadedDigitalContents.digitalContentIds[i]
      const parentDigitalContentId = updatedStems[i].metadata.stem_of.parent_digital_content_id
      const category = updatedStems[i].metadata.stem_of.category
      const recordEvent = make(Name.STEM_COMPLETE_UPLOAD, {
        id: digitalContentId,
        parent_digital_content_id: parentDigitalContentId,
        category
      })
      yield put(recordEvent)
    }
  }
}

function* uploadMultipleDigitalContents(digitalContents) {
  const digitalContentsWithMetadata = digitalContents.map((digital_content) => ({
    digital_content,
    metadata: digital_content.metadata
  }))

  const { digitalContentIds } = yield call(handleUploads, {
    digitalContents: digitalContentsWithMetadata,
    isCollection: false
  })
  const stems = yield select(getStems)
  if (stems.length) {
    yield call(uploadStems, {
      parentDigitalContentIds: digitalContentIds,
      stems
    })
  }

  yield put(uploadActions.uploadDigitalContentsSucceeded())
  yield put(
    make(Name.DIGITAL_CONTENT_UPLOAD_COMPLETE_UPLOAD, {
      count: digitalContentsWithMetadata.length,
      kind: 'digitalContents'
    })
  )
  const account = yield select(getAccountUser)

  // If the hide remixes is turned on, send analytics event
  for (let i = 0; i < digitalContents.length; i += 1) {
    const digital_content = digitalContents[i]
    const digitalContentId = digitalContentIds[i]
    if (digital_content.metadata?.field_visibility?.remixes === false) {
      yield put(
        make(Name.REMIX_HIDE, {
          id: digitalContentId,
          handle: account.handle
        })
      )
    }
  }

  const remixDigitalContents = digitalContents
    .map((t, i) => ({ digital_content_id: digitalContentIds[i], ...t.metadata }))
    .filter((t) => !!t.remix_of)
  if (remixDigitalContents.length > 0) {
    for (const remixDigitalContent of remixDigitalContents) {
      if (
        Array.isArray(remixDigitalContent.remix_of.digitalContents) &&
        remixDigitalContent.remix_of.digitalContents.length > 0
      ) {
        yield call(digitalContentNewRemixEvent, remixDigitalContent)
      }
    }
  }

  yield put(cacheActions.setExpired(Kind.USERS, account.user_id))
}

function* uploadDigitalContentsAsync(action) {
  yield call(waitForBackendSetup)
  const user = yield select(getAccountUser)
  yield put(
    uploadActions.uploadDigitalContentsRequested(
      action.digitalContents,
      action.metadata,
      action.uploadType,
      action.stems
    )
  )

  // If user already has content_node_endpoint, do not reselect replica set
  let newEndpoint = user.content_node_endpoint || ''
  if (!newEndpoint) {
    const serviceSelectionStatus = yield select(getStatus)
    if (serviceSelectionStatus === Status.ERROR) {
      yield put(uploadActions.uploadDigitalContentFailed())
      yield put(
        uploadActions.upgradeToCreatorError(
          'Failed to find content nodes to upload to'
        )
      )
      return
    }
    // Wait for service selection to finish
    const { selectedServices } = yield race({
      selectedServices: call(
        waitForValue,
        getSelectedServices,
        {},
        (val) => val.length > 0
      ),
      failure: take(fetchServicesFailed.type)
    })
    if (!selectedServices) {
      yield put(uploadActions.uploadDigitalContentFailed())
      yield put(
        uploadActions.upgradeToCreatorError(
          'Failed to find content nodes to upload to, after taking a long time'
        )
      )
      return
    }
    newEndpoint = selectedServices.join(',')
  }

  yield put(
    cacheActions.update(Kind.USERS, [
      {
        id: user.user_id,
        metadata: {
          content_node_endpoint: newEndpoint
        }
      }
    ])
  )

  const uploadType = (() => {
    switch (action.uploadType) {
      case UploadType.CONTENT_LIST:
        return 'contentList'
      case UploadType.ALBUM:
        return 'album'
      case UploadType.INDIVIDUAL_DIGITAL_CONTENT:
      case UploadType.INDIVIDUAL_DIGITAL_CONTENTS:
      default:
        return 'digitalContents'
    }
  })()

  const recordEvent = make(Name.DIGITAL_CONTENT_UPLOAD_START_UPLOADING, {
    count: action.digitalContents.length,
    kind: uploadType
  })
  yield put(recordEvent)

  // Upload content.
  if (
    action.uploadType === UploadType.CONTENT_LIST ||
    action.uploadType === UploadType.ALBUM
  ) {
    const isAlbum = action.uploadType === UploadType.ALBUM
    yield call(
      uploadCollection,
      action.digitalContents,
      user.user_id,
      action.metadata,
      isAlbum
    )
  } else {
    if (action.digitalContents.length === 1) {
      yield call(uploadSingleDigitalContent, action.digitalContents[0])
    } else {
      yield call(uploadMultipleDigitalContents, action.digitalContents)
    }
  }
}

function* watchUploadDigitalContents() {
  yield takeLatest(uploadActions.UPLOAD_DIGITAL_CONTENTS, uploadDigitalContentsAsync)
}

export default function sagas() {
  return [watchUploadDigitalContents, watchUploadErrors]
}
