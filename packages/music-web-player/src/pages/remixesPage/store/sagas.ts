import { DigitalContentMetadata } from '@coliving/common'
import { takeEvery, call, put } from 'redux-saga/effects'

import { retrieveDigitalContentByHandleAndSlug } from 'common/store/cache/digital_contents/utils/retrieveDigitalContents'
import {
  fetchDigitalContent,
  fetchDigitalContentSucceeded
} from 'common/store/pages/remixes/slice'
import { waitForBackendSetup } from 'store/backend/sagas'

import digitalContentsSagas from './lineups/digital_contents/sagas'

function* watchFetch() {
  yield takeEvery(
    fetchDigitalContent.type,
    function* (action: ReturnType<typeof fetchDigitalContent>) {
      yield call(waitForBackendSetup)
      const { handle, slug } = action.payload

      const digital_content: DigitalContentMetadata = yield call(retrieveDigitalContentByHandleAndSlug, {
        handle,
        slug
      })

      yield put(fetchDigitalContentSucceeded({ digitalContentId: digital_content.digital_content_id }))
    }
  )
}

export default function sagas() {
  return [...digitalContentsSagas(), watchFetch]
}
