import { ID, Kind, StemCategory, Stem, StemDigitalContentMetadata } from '@coliving/common'
import { call, put } from 'redux-saga/effects'

import * as cacheActions from 'common/store/cache/actions'
import apiClient from 'services/colivingAPIClient/colivingAPIClient'
import { waitForValue } from 'utils/sagaHelpers'

import { getDigitalContent } from '../selectors'

import { processAndCacheDigitalContents } from './processAndCacheDigitalContents'

/**
 * Fetches stems for a parent digital_content.
 * Caches the stems as digitalContents, and updates the parent
 * digital_content with a reference to the stems.
 *
 * @param digitalContentId the parent digital_content for which to fetch stems
 */
export function* fetchAndProcessStems(digitalContentId: ID) {
  const stems: StemDigitalContentMetadata[] = yield call(
    (args) => apiClient.getStems(args),
    {
      digitalContentId
    }
  )

  if (stems.length) {
    yield call(processAndCacheDigitalContents, stems)
  }

  // Don't update the original digital_content with stems until it's in the cache
  yield call(waitForValue, getDigitalContent, { id: digitalContentId })

  // Create the update
  const stemsUpdate: Stem[] = stems.map((s) => ({
    digital_content_id: s.digital_content_id,
    category: StemCategory[s.stem_of.category]
  }))

  yield put(
    cacheActions.update(Kind.DIGITAL_CONTENTS, [
      {
        id: digitalContentId,
        metadata: {
          _stems: stemsUpdate
        }
      }
    ])
  )
}
