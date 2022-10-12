import { Kind, makeUid, makeUids, Uid } from '@coliving/common'
import {
  all,
  call,
  cancel,
  delay,
  put,
  fork,
  select,
  take,
  takeEvery,
  takeLatest
} from 'redux-saga/effects'

import * as cacheActions from 'common/store/cache/actions'
import { getCollection } from 'common/store/cache/collections/selectors'
import { getDigitalContent, getDigitalContents } from 'common/store/cache/digital_contents/selectors'
import { getUsers } from 'common/store/cache/users/selectors'
import * as baseLineupActions from 'common/store/lineup/actions'
import { getSource, getUid, getPositions } from 'common/store/queue/selectors'
import * as queueActions from 'common/store/queue/slice'
import { getUid as getCurrentPlayerDigitalContentUid } from 'store/player/selectors'
import { getToQueue } from 'store/queue/sagas'
import { isMobile } from 'utils/clientUtil'

const makeCollectionSourceId = (source, contentListId) =>
  `${source}:collection:${contentListId}`
const getEntryId = (entry) => `${entry.kind}:${entry.id}`

const flatten = (list) =>
  list.reduce((a, b) => a.concat(Array.isArray(b) ? flatten(b) : b), [])
function* filterDeletes(digitalContentsMetadata, removeDeleted) {
  const digitalContents = yield select(getDigitalContents)
  const users = yield select(getUsers)
  return digitalContentsMetadata
    .map((metadata) => {
      // If the incoming metadata is null, return null
      // This will be accounted for in `nullCount`
      if (metadata === null) {
        return null
      }
      // If we said to remove deleted digitalContents and it is deleted, remove it
      if (removeDeleted && metadata.is_delete) return null
      // If we said to remove deleted and the digital_content/contentList owner is deactivated, remove it
      else if (removeDeleted && users[metadata.owner_id]?.is_deactivated)
        return null
      else if (
        removeDeleted &&
        users[metadata.content_list_owner_id]?.is_deactivated
      )
        return null
      // If the digital_content was not cached, keep it
      else if (!digitalContents[metadata.digital_content_id]) return metadata
      // If we said to remove deleted and it's marked deleted remove it
      else if (removeDeleted && digitalContents[metadata.digital_content_id]._marked_deleted)
        return null
      return {
        ...metadata,
        // Maintain the marked deleted
        _marked_deleted: !!digitalContents[metadata.digital_content_id]._marked_deleted
      }
    })
    .filter(Boolean)
}

function getDigitalContentCacheables(metadata, uid, digitalContentSubscribers) {
  digitalContentSubscribers.push({ uid: metadata.uid || uid, id: metadata.digital_content_id })
}

function getCollectionCacheables(
  metadata,
  uid,
  collectionsToCache,
  digitalContentSubscriptions,
  digitalContentSubscribers
) {
  collectionsToCache.push({ id: metadata.content_list_id, uid, metadata })

  const digitalContentIds = metadata.content_list_contents.digital_content_ids.map((t) => t.digital_content)
  const digitalContentUids = digitalContentIds.map((id) =>
    makeUid(Kind.AGREEMENTS, id, `collection:${metadata.content_list_id}`)
  )

  digitalContentSubscriptions.push({
    id: metadata.content_list_id,
    kind: Kind.AGREEMENTS,
    uids: digitalContentUids
  })
  metadata.content_list_contents.digital_content_ids =
    metadata.content_list_contents.digital_content_ids.map((t, i) => {
      const digitalContentUid = t.uid || digitalContentUids[i]
      digitalContentSubscribers.push({ uid: digitalContentUid, id: t.digital_content })
      return { uid: digitalContentUid, ...t }
    })
}

function* fetchLineupMetadatasAsync(
  lineupActions,
  lineupMetadatasCall,
  lineupSelector,
  retainSelector,
  lineupPrefix,
  removeDeleted,
  sourceSelector,
  action
) {
  const initLineup = yield select(lineupSelector)
  const initSource = sourceSelector
    ? yield select(sourceSelector)
    : initLineup.prefix

  const task = yield fork(function* () {
    try {
      yield put(
        lineupActions.fetchLineupMetadatasRequested(
          action.offset,
          action.limit,
          action.overwrite,
          action.payload
        )
      )

      // Let page animations on mobile have time to breathe
      // TODO: Get rid of this once we figure out how to make loading better
      if (isMobile()) {
        yield delay(100)
      }

      const lineupMetadatasResponse = yield call(lineupMetadatasCall, {
        offset: action.offset,
        limit: action.limit,
        payload: action.payload
      })

      if (lineupMetadatasResponse === null) return
      const lineup = yield select(lineupSelector)
      const source = sourceSelector
        ? yield select(sourceSelector)
        : lineup.prefix

      const queueUids = Object.keys(yield select(getPositions)).map((uid) =>
        Uid.fromString(uid)
      )
      // Get every UID in the queue whose source references this lineup
      // in the form of { id: [uid1, uid2] }
      const uidForSource = queueUids
        .filter((uid) => uid.source === source)
        .reduce((mapping, uid) => {
          if (uid.id in mapping) {
            mapping[uid.id].push(uid.toString())
          } else {
            mapping[uid.id] = [uid.toString()]
          }
          return mapping
        }, {})

      // Filter out deletes
      const responseFilteredDeletes = yield call(
        filterDeletes,
        lineupMetadatasResponse,
        removeDeleted
      )

      const nullCount = lineupMetadatasResponse.reduce(
        (result, current) => (current === null ? result + 1 : result),
        0
      )

      const allMetadatas = responseFilteredDeletes.map((item) => {
        const id = item.digital_content_id
        if (id && uidForSource[id] && uidForSource[id].length > 0) {
          item.uid = uidForSource[id].shift()
        }
        return item
      })

      const kinds = allMetadatas.map((metadata) =>
        metadata.digital_content_id ? Kind.AGREEMENTS : Kind.COLLECTIONS
      )
      const ids = allMetadatas.map(
        (metadata) => metadata.digital_content_id || metadata.content_list_id
      )
      const uids = makeUids(kinds, ids, source)

      // Cache digitalContents and collections.
      const collectionsToCache = []

      const digitalContentSubscriptions = []
      let digitalContentSubscribers = []

      allMetadatas.forEach((metadata, i) => {
        // Need to update the UIDs on the contentList digitalContents
        if (metadata.content_list_id) {
          getCollectionCacheables(
            metadata,
            uids[i],
            collectionsToCache,
            digitalContentSubscriptions,
            digitalContentSubscribers
          )
        } else if (metadata.digital_content_id) {
          getDigitalContentCacheables(metadata, uids[i], digitalContentSubscribers)
        }
      })

      const lineupCollections = allMetadatas.filter(
        (item) => !!item.content_list_id
      )

      lineupCollections.forEach((metadata) => {
        const digitalContentUids = metadata.content_list_contents.digital_content_ids.map(
          (digital_content, idx) => {
            const id = digital_content.digital_content
            const uid = new Uid(
              Kind.AGREEMENTS,
              id,
              makeCollectionSourceId(source, metadata.content_list_id),
              idx
            )
            return { id, uid: uid.toString() }
          }
        )
        digitalContentSubscribers = digitalContentSubscribers.concat(digitalContentUids)
      })

      // We rewrote the contentList digitalContents with new UIDs, so we need to update them
      // in the cache.
      if (collectionsToCache.length > 0) {
        yield put(cacheActions.update(Kind.COLLECTIONS, collectionsToCache))
      }
      if (digitalContentSubscriptions.length > 0) {
        yield put(cacheActions.update(Kind.COLLECTIONS, [], digitalContentSubscriptions))
      }
      if (digitalContentSubscribers.length > 0) {
        yield put(cacheActions.subscribe(Kind.AGREEMENTS, digitalContentSubscribers))
      }
      // Retain specified info in the lineup itself and resolve with success.
      const lineupEntries = allMetadatas
        .map(retainSelector)
        .map((m, i) => {
          const lineupEntry = allMetadatas[i]
          // Use metadata.uid, entry.uid, computed new uid in that order of precedence
          return { ...m, uid: m.uid || lineupEntry.uid || uids[i] }
        })
        .filter((metadata, idx) => {
          if (lineup.dedupe && lineup.entryIds) {
            const entryId = getEntryId(metadata)
            if (lineup.entryIds.has(entryId)) return false
            lineup.entryIds.add(entryId)
          }
          return true
        })

      const deletedCount = action.limit - lineupEntries.length - nullCount
      yield put(
        lineupActions.fetchLineupMetadatasSucceeded(
          lineupEntries,
          action.offset,
          action.limit,
          deletedCount,
          nullCount
        )
      )

      // Add additional items to the queue if need be.
      yield fork(updateQueueLineup, lineupPrefix, source, lineupEntries)
    } catch (err) {
      console.error(err)
      yield put(lineupActions.fetchLineupMetadatasFailed())
    }
  })
  const { source: resetSource } = yield take(
    baseLineupActions.addPrefix(lineupPrefix, baseLineupActions.RESET)
  )
  // If a source is specified in the reset action, make sure it matches the lineup source
  // If not specified, cancel the fetchDigitalContentMetdatas
  if (!resetSource || resetSource === initSource) {
    yield cancel(task)
  }
}

function* updateQueueLineup(lineupPrefix, source, lineupEntries) {
  const queueSource = yield select(getSource)
  const uid = yield select(getUid)
  const currentUidSource = uid && Uid.fromString(uid).source
  if (
    queueSource === lineupPrefix &&
    (!source || source === currentUidSource)
  ) {
    const toQueue = yield all(
      lineupEntries.map((e) => call(getToQueue, lineupPrefix, e))
    )
    const flattenedQueue = flatten(toQueue)
    yield put(queueActions.add({ entries: flattenedQueue }))
  }
}

function* play(lineupActions, lineupSelector, prefix, action) {
  const lineup = yield select(lineupSelector)
  const requestedPlayDigitalContent = yield select(getDigitalContent, { uid: action.uid })

  if (action.uid) {
    const source = yield select(getSource)
    const currentPlayerDigitalContentUid = yield select(getCurrentPlayerDigitalContentUid)
    if (
      !currentPlayerDigitalContentUid ||
      action.uid !== currentPlayerDigitalContentUid ||
      source !== lineup.prefix
    ) {
      const toQueue = yield all(
        lineup.entries.map((e) => call(getToQueue, lineup.prefix, e))
      )
      const flattenedQueue = flatten(toQueue)
      yield put(queueActions.clear({}))
      yield put(queueActions.add({ entries: flattenedQueue }))
    }
  }
  yield put(
    queueActions.play({
      uid: action.uid,
      digitalContentId: requestedPlayDigitalContent && requestedPlayDigitalContent.digital_content_id,
      source: prefix
    })
  )
}

function* pause(action) {
  yield put(queueActions.pause({}))
}

function* reset(
  lineupActions,
  lineupPrefix,
  lineupSelector,
  sourceSelector,
  action
) {
  const lineup = yield select(lineupSelector)
  // Remove this lineup as a subscriber from all of its digitalContents and collections.
  const subscriptionsToRemove = {} // keyed by kind
  const source = sourceSelector ? yield select(sourceSelector) : lineupPrefix

  for (const entry of lineup.entries) {
    const { kind, uid } = entry
    if (!subscriptionsToRemove[kind]) {
      subscriptionsToRemove[kind] = [{ uid }]
    } else {
      subscriptionsToRemove[kind].push({ uid })
    }
    if (entry.kind === Kind.COLLECTIONS) {
      const collection = yield select(getCollection, { uid: entry.uid })
      const removeDigitalContentIds = collection.content_list_contents.digital_content_ids.map(
        ({ digital_content: digitalContentId }, idx) => {
          const digitalContentUid = new Uid(
            Kind.AGREEMENTS,
            digitalContentId,
            makeCollectionSourceId(source, collection.content_list_id),
            idx
          )
          return { UID: digitalContentUid.toString() }
        }
      )
      subscriptionsToRemove[Kind.AGREEMENTS] = (
        subscriptionsToRemove[Kind.AGREEMENTS] || []
      ).concat(removeDigitalContentIds)
    }
  }
  yield all(
    Object.keys(subscriptionsToRemove).map((kind) =>
      put(cacheActions.unsubscribe(kind, subscriptionsToRemove[kind]))
    )
  )

  yield put(lineupActions.resetSucceeded(action))
}

function* add(action) {
  if (action.entry && action.id) {
    const { kind, uid } = action.entry
    yield put(cacheActions.subscribe(kind, [{ uid, id: action.id }]))
  }
}

function* remove(action) {
  if (action.kind && action.uid) {
    yield put(cacheActions.unsubscribe(action.kind, [{ uid: action.uid }]))
  }
}

function* updateLineupOrder(lineupPrefix, sourceSelector, action) {
  // TODO: Investigate a better way to handle reordering of the lineup and transitively
  // reordering the queue. This implementation is slightly buggy in that the source may not
  // be set on the queue item when reordering and the next digital_content won't resume correctly.
  const queueSource = yield select(getSource)
  const source = yield select(sourceSelector)
  const uid = yield select(getUid)
  const currentUidSource = uid && Uid.fromString(uid).source
  if (
    queueSource === lineupPrefix &&
    (!source || source === currentUidSource)
  ) {
    yield put(queueActions.reorder({ orderedUids: action.orderedIds }))
  }
}

function* refreshInView(lineupActions, lineupSelector, action) {
  const lineup = yield select(lineupSelector)
  if (lineup.inView) {
    yield put(
      lineupActions.fetchLineupMetadatas(
        0,
        action.limit || lineup.total,
        false,
        action.payload
      )
    )
  }
}

const keepUidAndKind = (entry) => ({
  uid: entry.uid,
  kind: entry.digital_content_id ? Kind.AGREEMENTS : Kind.COLLECTIONS,
  id: entry.digital_content_id || entry.content_list_id
})

/**
 * A generic class of common Lineup Sagas for fetching, loading and
 * simple playback.
 * @example
 *  // contentList.js
 *  // Creates an exports and array of all sagas to be combined in the
 *  // root saga.
 *  class ContentListSagas extends LineupSagas {
 *    constructor() {
 *      const selector = store => store.contentList
 *      super("CONTENT_LIST", contentListActions, selector, Backend.getContentList)
 *    }
 *  }
 *  export default function sagas () {
 *    return new ContentListSagas().getSagas()
 *  }
 */
export class LineupSagas {
  /**
   * @param {string} prefix the prefix for the lineup, e.g. FEED
   * @param {object} actions the actions class instance for the lineup
   * @param {function} selector the selector for the lineup, e.g. state => state.feed
   * @param {function * | async function} lineupMetadatasCall
   *   the backend call to make to fetch the digitalContents metadatas for the lineup
   * @param {?function} retainSelector a selector used to retain various metadata inside the lineup state
   *   otherwise, the lineup will only retain the digital_content id indexing into the cache
   * @param {?boolean} removeDeleted whether or not to prune deleted digitalContents
   * @param {?function} sourceSelector optional selector that sets the UID source for entries
   */
  constructor(
    prefix,
    actions,
    selector,
    lineupMetadatasCall,
    retainSelector = keepUidAndKind,
    removeDeleted = true,
    sourceSelector = null
  ) {
    this.prefix = prefix
    this.actions = actions
    this.selector = selector
    this.lineupMetadatasCall = lineupMetadatasCall
    this.retainSelector = retainSelector
    this.removeDeleted = removeDeleted
    this.sourceSelector = sourceSelector
  }

  watchFetchLineupMetadata = () => {
    const instance = this
    return function* () {
      yield takeLatest(
        baseLineupActions.addPrefix(
          instance.prefix,
          baseLineupActions.FETCH_LINEUP_METADATAS
        ),
        fetchLineupMetadatasAsync,
        instance.actions,
        instance.lineupMetadatasCall,
        instance.selector,
        instance.retainSelector,
        instance.prefix,
        instance.removeDeleted,
        instance.sourceSelector
      )
    }
  }

  watchPlay = () => {
    const instance = this
    return function* () {
      yield takeLatest(
        baseLineupActions.addPrefix(instance.prefix, baseLineupActions.PLAY),
        play,
        instance.actions,
        instance.selector,
        instance.prefix
      )
    }
  }

  watchPauseDigitalContent = () => {
    const instance = this
    return function* () {
      yield takeLatest(
        baseLineupActions.addPrefix(instance.prefix, baseLineupActions.PAUSE),
        pause
      )
    }
  }

  watchReset = () => {
    const instance = this
    return function* () {
      yield takeLatest(
        baseLineupActions.addPrefix(instance.prefix, baseLineupActions.RESET),
        reset,
        instance.actions,
        instance.prefix,
        instance.selector,
        instance.sourceSelector
      )
    }
  }

  watchAdd = () => {
    const instance = this
    return function* () {
      yield takeEvery(
        baseLineupActions.addPrefix(instance.prefix, baseLineupActions.ADD),
        add
      )
    }
  }

  watchRemove = () => {
    const instance = this
    return function* () {
      yield takeEvery(
        baseLineupActions.addPrefix(instance.prefix, baseLineupActions.REMOVE),
        remove
      )
    }
  }

  watchUpdateLineupOrder = () => {
    const instance = this
    return function* () {
      yield takeLatest(
        baseLineupActions.addPrefix(
          instance.prefix,
          baseLineupActions.UPDATE_LINEUP_ORDER
        ),
        updateLineupOrder,
        instance.prefix,
        instance.sourceSelector
      )
    }
  }

  watchRefreshInView = () => {
    const instance = this
    return function* () {
      yield takeLatest(
        baseLineupActions.addPrefix(
          instance.prefix,
          baseLineupActions.REFRESH_IN_VIEW
        ),
        refreshInView,
        instance.actions,
        instance.selector
      )
    }
  }

  getSagas() {
    return [
      this.watchFetchLineupMetadata(),
      this.watchPlay(),
      this.watchPauseDigitalContent(),
      this.watchReset(),
      this.watchAdd(),
      this.watchRemove(),
      this.watchUpdateLineupOrder(),
      this.watchRefreshInView()
    ]
  }
}
