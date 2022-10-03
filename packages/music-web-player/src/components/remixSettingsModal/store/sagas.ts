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
        let agreement: AgreementMetadata | null = null
        if (handle && slug) {
          agreement = yield call(retrieveAgreementByHandleAndSlug, {
            handle,
            slug
          })
        } else if (agreementId) {
          agreement = yield call(retrieveAgreements, { agreementIds: [agreementId] })
        }
        if (agreement) {
          yield put(fetchAgreementSucceeded({ agreementId: agreement.agreement_id }))
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
