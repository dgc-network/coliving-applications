import {
  ID,
  Collection,
  CollectionMetadata,
  UserCollectionMetadata,
  Kind,
  DigitalContent,
  makeUid
} from '@coliving/common'
import { call, select } from 'redux-saga/effects'

import { CommonState } from 'common/store'
import { getUserId } from 'common/store/account/selectors'
import { getCollections } from 'common/store/cache/collections/selectors'
import { retrieve } from 'common/store/cache/sagas'
import { getEntryTimestamp } from 'common/store/cache/selectors'
import { retrieveDigitalContents } from 'common/store/cache/digital_contents/utils'
import ColivingBackend from 'services/colivingBackend'
import apiClient from 'services/colivingAPIClient/colivingAPIClient'

import { addDigitalContentsFromCollections } from './addDigitalContentsFromCollections'
import { addUsersFromCollections } from './addUsersFromCollections'
import { reformat } from './reformat'

function* markCollectionDeleted(
  collectionMetadatas: CollectionMetadata[]
): Generator<any, CollectionMetadata[], any> {
  const collections = yield select(getCollections, {
    ids: collectionMetadatas.map((c) => c.content_list_id)
  })
  return collectionMetadatas.map((metadata) => {
    if (!(metadata.content_list_id in collections)) return metadata
    return {
      ...metadata,
      _marked_deleted: !!collections[metadata.content_list_id]._marked_deleted
    }
  })
}

export function* retrieveDigitalContentsForCollections(
  collections: CollectionMetadata[],
  excludedDigitalContentIdSet: Set<ID>
) {
  const allDigitalContentIds = collections.reduce((acc, cur) => {
    const digitalContentIds = cur.content_list_contents.digital_content_ids.map((t) => t.digital_content)
    return [...acc, ...digitalContentIds]
  }, [] as ID[])
  const filteredDigitalContentIds = [
    ...new Set(allDigitalContentIds.filter((id) => !excludedDigitalContentIdSet.has(id)))
  ]
  const digitalContents: DigitalContent[] = yield call(retrieveDigitalContents, {
    digitalContentIds: filteredDigitalContentIds
  })

  // If any digitalContents failed to be retrieved for some reason,
  // remove them from their collection.
  const unfetchedIdSet = new Set()
  for (let i = 0; i < digitalContents.length; i++) {
    if (!digitalContents[i]) {
      unfetchedIdSet.add(filteredDigitalContentIds[i])
    }
  }

  return collections.map((c) => {
    // Filter out unfetched digitalContents
    const filteredIds = c.content_list_contents.digital_content_ids.filter(
      (t) => !unfetchedIdSet.has(t.digital_content)
    )
    // Add UIDs
    const withUids = filteredIds.map((t) => ({
      ...t,
      // Make a new UID if one doesn't already exist
      uid: t.uid || makeUid(Kind.DIGITAL_CONTENTS, t.digital_content, `collection:${c.content_list_id}`)
    }))

    return {
      ...c,
      content_list_contents: {
        digital_content_ids: withUids
      }
    }
  })
}

/**
 * Retrieves a single collection via API client
 * @param contentListId
 */
export function* retrieveCollection(contentListId: ID) {
  const userId: ReturnType<typeof getUserId> = yield select(getUserId)
  const contentLists: UserCollectionMetadata[] = yield apiClient.getContentList({
    contentListId,
    currentUserId: userId
  })
  return contentLists
}

/**
 * Retrieves collections from the cache or from source
 * @param userId optional owner of collections to fetch (TODO: to be removed)
 * @param collectionIds ids to retrieve
 * @param fetchDigitalContents whether or not to fetch the digitalContents inside the contentList
 * @param requiresAllDigitalContents whether or not fetching this collection requires it to have all its digitalContents.
 * In the case where a collection is already cached with partial digitalContents, use this flag to refetch from source.
 * @returns
 */
export function* retrieveCollections(
  userId: ID | null,
  collectionIds: ID[],
  fetchDigitalContents = false,
  requiresAllDigitalContents = false
) {
  // @ts-ignore retrieve should be refactored to ts first
  const { entries, uids } = yield call(retrieve, {
    ids: collectionIds,
    selectFromCache: function* (ids: ID[]) {
      const res: {
        [id: number]: Collection
      } = yield select(getCollections, { ids })
      if (requiresAllDigitalContents) {
        const keys = Object.keys(res) as any
        keys.forEach((collectionId: number) => {
          const fullDigitalContentCount = res[collectionId].digital_content_count
          const currentDigitalContentCount = res[collectionId].digitalContents?.length ?? 0
          if (currentDigitalContentCount < fullDigitalContentCount) {
            // Remove the collection from the res so retrieve knows to get it from source
            delete res[collectionId]
          }
        })
      }
      return res
    },
    getEntriesTimestamp: function* (ids: ID[]) {
      const selector = (state: CommonState, ids: ID[]) =>
        ids.reduce((acc, id) => {
          acc[id] = getEntryTimestamp(state, { kind: Kind.COLLECTIONS, id })
          return acc
        }, {} as { [id: number]: number | null })
      const selected: ReturnType<typeof selector> = yield select(selector, ids)
      return selected
    },
    retrieveFromSource: function* (ids: ID[]) {
      let metadatas: UserCollectionMetadata[]

      if (ids.length === 1) {
        metadatas = yield call(retrieveCollection, ids[0])
      } else {
        // TODO: Remove this branch when we have batched endpoints in new V1 api.
        metadatas = yield call(ColivingBackend.getContentLists, userId, ids)
      }

      // Process any local deletions on the client
      const metadatasWithDeleted: UserCollectionMetadata[] = yield call(
        markCollectionDeleted,
        metadatas
      )

      return metadatasWithDeleted
    },
    onBeforeAddToCache: function* (metadatas: UserCollectionMetadata[]) {
      yield addUsersFromCollections(metadatas)
      yield addDigitalContentsFromCollections(metadatas)

      if (fetchDigitalContents) {
        yield call(retrieveDigitalContentsForCollections, metadatas, new Set())
      }

      const reformattedCollections = metadatas.map((c) => reformat(c))

      return reformattedCollections
    },
    kind: Kind.COLLECTIONS,
    idField: 'content_list_id',
    forceRetrieveFromSource: false,
    shouldSetLoading: true,
    deleteExistingEntry: false
  })

  return { collections: entries, uids }
}
