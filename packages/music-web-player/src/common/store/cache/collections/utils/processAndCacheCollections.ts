import { ID, UserCollectionMetadata, Kind, makeUid } from '@coliving/common'
import { put, call } from 'redux-saga/effects'

import * as cacheActions from 'common/store/cache/actions'

import { addDigitalContentsFromCollections } from './addDigitalContentsFromCollections'
import { addUsersFromCollections } from './addUsersFromCollections'
import { reformat } from './reformat'
import { retrieveDigitalContentsForCollections } from './retrieveCollections'

/**
 * Processes and caches a collection
 * @param {Collection} collections collections to cache
 * @param {boolean} shouldRetrieveDigitalContents whether or not to retrieve the digitalContents inside the collection (we don't need
 *  to do this for displaying collection cards)
 * @param {Array<ID>} excludedDigitalContentIds optional digital_content ids to exclude from retrieve
 */
export function* processAndCacheCollections(
  collections: UserCollectionMetadata[],
  shouldRetrieveDigitalContents = true,
  excludedDigitalContentIds: ID[] = []
) {
  yield addUsersFromCollections(collections)
  yield addDigitalContentsFromCollections(collections)

  let reformattedCollections = collections.map((c) => reformat(c))

  if (shouldRetrieveDigitalContents) {
    // Retrieve the digitalContents
    const excludedSet = new Set(excludedDigitalContentIds)
    reformattedCollections = yield call(
      retrieveDigitalContentsForCollections,
      reformattedCollections,
      excludedSet
    )
  }

  yield put(
    cacheActions.add(
      Kind.COLLECTIONS,
      reformattedCollections.map((c) => ({
        id: c.content_list_id,
        uid: makeUid(Kind.COLLECTIONS, c.content_list_id),
        metadata: c
      })),
      false,
      true
    )
  )

  return reformattedCollections
}
