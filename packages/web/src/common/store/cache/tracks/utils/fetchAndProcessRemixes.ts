import { ID, Kind, UserAgreementMetadata, removeNullable } from '@coliving/common'
import { select, call, put } from 'typed-redux-saga/macro'

import { getUserId } from 'common/store/account/selectors'
import * as cacheActions from 'common/store/cache/actions'
import apiClient from 'services/coliving-api-client/ColivingAPIClient'
import { waitForValue } from 'utils/sagaHelpers'

import { getAgreement } from '../selectors'

import { processAndCacheAgreements } from './processAndCacheAgreements'

const INITIAL_FETCH_LIMIT = 6

/**
 * Fetches remixes for a parent agreement.
 * Caches the remixes as agreements, and updates the parent
 * agreement with a reference to the remixes.
 *
 * @param agreementId the parent agreement for which to fetch remixes
 */
export function* fetchAndProcessRemixes(agreementId: ID) {
  const currentUserId = yield* select(getUserId)
  const {
    agreements: remixes,
    count
  }: { agreements: UserAgreementMetadata[]; count: number } = yield* call(
    [apiClient, 'getRemixes'],
    {
      agreementId,
      offset: 0,
      limit: INITIAL_FETCH_LIMIT,
      currentUserId
    }
  )

  if (!remixes) return

  if (remixes.length) {
    yield* call(processAndCacheAgreements, remixes)
  }

  // Create the update
  // Note: This update is made eagerly (potentially before the parent agreement is cached).
  // This is OK because the cache action will not overwrite this data, and it's important
  // that we can recognize ASAP that the agreement has remixes.
  // The agreement will still go through it's normal lifecycle of status (loading => success/error)
  // and the availability of these fields give a hint to the skeleton layout.
  const remixesUpdate = remixes.map((r) => ({
    agreement_id: r.agreement_id
  }))

  yield* put(
    cacheActions.update(Kind.AGREEMENTS, [
      {
        id: agreementId,
        metadata: {
          _remixes: remixesUpdate,
          _remixes_count: count
        }
      }
    ])
  )
}

/**
 * Fetches parents for a remixed agreement.
 * Caches the parents as agreements, and updates the remixed agreement
 * with a reference to the parent.
 *
 * @param agreementId the agreement for which to fetch remix parents
 */
export function* fetchAndProcessRemixParents(agreementId: ID) {
  const currentUserId = yield* select(getUserId)
  const remixParents = (yield* call([apiClient, 'getRemixing'], {
    agreementId,
    limit: 1,
    offset: 0,
    currentUserId
  })).filter(removeNullable)

  if (!remixParents) return

  if (remixParents.length) {
    yield* call(processAndCacheAgreements, remixParents)
  }

  // Don't update the original agreement with parents until it's in the cache
  yield* call(waitForValue, getAgreement, { id: agreementId })

  // Create the update
  const remixParentsUpdate = remixParents.map((s) => ({
    agreement_id: s.agreement_id
  }))

  yield* put(
    cacheActions.update(Kind.AGREEMENTS, [
      {
        id: agreementId,
        metadata: {
          _remix_parents: remixParentsUpdate
        }
      }
    ])
  )
}
