import { AgreementMetadata } from '@coliving/common'
import { takeLatest, call, put } from 'redux-saga/effects'

import {
  retrieveAgreementByHandleAndSlug,
  retrieveAgreements
} from 'common/store/cache/agreements/utils/retrieveAgreements'
import { parseAgreementRoute } from 'utils/route/agreementRouteParser'

import { fetchAgreement, fetchAgreementSucceeded, fetchAgreementFailed } from './slice'

const getHandleAndSlug = (url: string) => {
  // Get just the pathname part from the url
  try {
    const agreementUrl = new URL(url)
    // Decode the extracted pathname so we don't end up
    // double encoding it later on
    const pathname = decodeURIComponent(agreementUrl.pathname)
    if (
      agreementUrl.hostname !== process.env.REACT_APP_PUBLIC_HOSTNAME &&
      agreementUrl.hostname !== window.location.hostname
    ) {
      return null
    }
    return parseAgreementRoute(pathname)
  } catch (err) {
    return null
  }
}

function* watchFetchAgreement() {
  yield takeLatest(
    fetchAgreement.type,
    function* (action: ReturnType<typeof fetchAgreement>) {
      const { url } = action.payload
      const params = getHandleAndSlug(url)
      if (params) {
        const { handle, slug, agreementId } = params
        let digital_content: AgreementMetadata | null = null
        if (handle && slug) {
          digital_content = yield call(retrieveAgreementByHandleAndSlug, {
            handle,
            slug
          })
        } else if (agreementId) {
          digital_content = yield call(retrieveAgreements, { agreementIds: [agreementId] })
        }
        if (digital_content) {
          yield put(fetchAgreementSucceeded({ agreementId: digital_content.digital_content_id }))
          return
        }
      }
      yield put(fetchAgreementFailed())
    }
  )
}

export default function sagas() {
  return [watchFetchAgreement]
}
