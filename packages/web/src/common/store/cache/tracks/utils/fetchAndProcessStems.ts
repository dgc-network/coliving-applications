import { ID, Kind, StemCategory, Stem, StemAgreementMetadata } from '@coliving/common'
import { call, put } from 'redux-saga/effects'

import * as cacheActions from 'common/store/cache/actions'
import apiClient from 'services/coliving-api-client/ColivingAPIClient'
import { waitForValue } from 'utils/sagaHelpers'

import { getAgreement } from '../selectors'

import { processAndCacheAgreements } from './processAndCacheAgreements'

/**
 * Fetches stems for a parent agreement.
 * Caches the stems as agreements, and updates the parent
 * agreement with a reference to the stems.
 *
 * @param agreementId the parent agreement for which to fetch stems
 */
export function* fetchAndProcessStems(agreementId: ID) {
  const stems: StemAgreementMetadata[] = yield call(
    (args) => apiClient.getStems(args),
    {
      agreementId
    }
  )

  if (stems.length) {
    yield call(processAndCacheAgreements, stems)
  }

  // Don't update the original agreement with stems until it's in the cache
  yield call(waitForValue, getAgreement, { id: agreementId })

  // Create the update
  const stemsUpdate: Stem[] = stems.map((s) => ({
    agreement_id: s.agreement_id,
    category: StemCategory[s.stem_of.category]
  }))

  yield put(
    cacheActions.update(Kind.AGREEMENTS, [
      {
        id: agreementId,
        metadata: {
          _stems: stemsUpdate
        }
      }
    ])
  )
}
