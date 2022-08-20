import { ID, UserCollectionMetadata, Kind, makeUid } from '@coliving/common'
import { put, call } from 'redux-saga/effects'

import * as cacheActions from 'common/store/cache/actions'

import { addAgreementsFromCollections } from './addAgreementsFromCollections'
import { addUsersFromCollections } from './addUsersFromCollections'
import { reformat } from './reformat'
import { retrieveAgreementsForCollections } from './retrieveCollections'

/**
 * Processes and caches a collection
 * @param {Collection} collections collections to cache
 * @param {boolean} shouldRetrieveAgreements whether or not to retrieve the agreements inside the collection (we don't need
 *  to do this for displaying collection cards)
 * @param {Array<ID>} excludedAgreementIds optional agreement ids to exclude from retrieve
 */
export function* processAndCacheCollections(
  collections: UserCollectionMetadata[],
  shouldRetrieveAgreements = true,
  excludedAgreementIds: ID[] = []
) {
  yield addUsersFromCollections(collections)
  yield addAgreementsFromCollections(collections)

  let reformattedCollections = collections.map((c) => reformat(c))

  if (shouldRetrieveAgreements) {
    // Retrieve the agreements
    const excludedSet = new Set(excludedAgreementIds)
    reformattedCollections = yield call(
      retrieveAgreementsForCollections,
      reformattedCollections,
      excludedSet
    )
  }

  yield put(
    cacheActions.add(
      Kind.COLLECTIONS,
      reformattedCollections.map((c) => ({
        id: c.content list_id,
        uid: makeUid(Kind.COLLECTIONS, c.content list_id),
        metadata: c
      })),
      false,
      true
    )
  )

  return reformattedCollections
}
