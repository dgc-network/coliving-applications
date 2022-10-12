import { DigitalContentMetadata } from '@coliving/common'
import { takeLatest, call, put } from 'redux-saga/effects'

import {
  retrieveDigitalContentByHandleAndSlug,
  retrieveDigitalContents
} from 'common/store/cache/digital_contents/utils/retrieveDigitalContents'
import { parseDigitalContentRoute } from 'utils/route/digitalContentRouteParser'

import { fetchDigitalContent, fetchDigitalContentSucceeded, fetchDigitalContentFailed } from './slice'

const getHandleAndSlug = (url: string) => {
  // Get just the pathname part from the url
  try {
    const digitalContentUrl = new URL(url)
    // Decode the extracted pathname so we don't end up
    // double encoding it later on
    const pathname = decodeURIComponent(digitalContentUrl.pathname)
    if (
      digitalContentUrl.hostname !== process.env.REACT_APP_PUBLIC_HOSTNAME &&
      digitalContentUrl.hostname !== window.location.hostname
    ) {
      return null
    }
    return parseDigitalContentRoute(pathname)
  } catch (err) {
    return null
  }
}

function* watchFetchDigitalContent() {
  yield takeLatest(
    fetchDigitalContent.type,
    function* (action: ReturnType<typeof fetchDigitalContent>) {
      const { url } = action.payload
      const params = getHandleAndSlug(url)
      if (params) {
        const { handle, slug, digitalContentId } = params
        let digital_content: DigitalContentMetadata | null = null
        if (handle && slug) {
          digital_content = yield call(retrieveDigitalContentByHandleAndSlug, {
            handle,
            slug
          })
        } else if (digitalContentId) {
          digital_content = yield call(retrieveDigitalContents, { digitalContentIds: [digitalContentId] })
        }
        if (digital_content) {
          yield put(fetchDigitalContentSucceeded({ digitalContentId: digital_content.digital_content_id }))
          return
        }
      }
      yield put(fetchDigitalContentFailed())
    }
  )
}

export default function sagas() {
  return [watchFetchDigitalContent]
}
