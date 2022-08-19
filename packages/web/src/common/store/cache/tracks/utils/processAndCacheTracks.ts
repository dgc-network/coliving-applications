import { Kind, Agreement, AgreementMetadata, makeUid } from '@coliving/common'
import { put, call } from 'redux-saga/effects'

import * as cacheActions from 'common/store/cache/actions'

import { setAgreementsIsBlocked } from './blocklist'
import { addUsersFromAgreements } from './helpers'
import { reformat } from './reformat'

/**
 * Processes agreements, adding users and calling `reformat`, before
 * caching the agreements.
 * @param agreements
 */
export function* processAndCacheAgreements<T extends AgreementMetadata>(
  agreements: T[]
): Generator<any, Agreement[], any> {
  // Add users
  yield addUsersFromAgreements(agreements)

  const checkedAgreements: T[] = yield call(setAgreementsIsBlocked, agreements)

  // Remove users, add images
  const reformattedAgreements = checkedAgreements.map(reformat)

  // insert agreements into cache
  yield put(
    cacheActions.add(
      Kind.AGREEMENTS,
      reformattedAgreements.map((t) => ({
        id: t.agreement_id,
        uid: makeUid(Kind.AGREEMENTS, t.agreement_id),
        metadata: t
      })),
      false,
      true
    )
  )

  return reformattedAgreements
}
