import { ID, Kind, StemCategory, Stem, StemAgreementMetadata } from '@coliving/common'
import { call, put } from 'redux-saga/effects'

import * as cacheActions from 'common/store/cache/actions'
import apiClient from 'services/colivingAPIClient/colivingAPIClient'
import { waitForValue } from 'utils/sagaHelpers'

import { getAgreement } from '../selectors'

import { processAndCacheAgreements } from './processAndCacheAgreements'

/**
 * Fetches stems for a parent digital_content.
 * Caches the stems as agreements, and updates the parent
 * digital_content with a reference to the stems.
 *
 * @param agreementId the parent digital_content for which to fetch stems
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

  // Don't update the original digital_content with stems until it's in the cache
  yield call(waitForValue, getAgreement, { id: agreementId })

  // Create the update
  const stemsUpdate: Stem[] = stems.map((s) => ({
    digital_content_id: s.digital_content_id,
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
