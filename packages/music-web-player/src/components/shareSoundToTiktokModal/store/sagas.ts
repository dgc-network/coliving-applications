import { Name } from '@coliving/common'
import { takeEvery, put, call, select } from 'typed-redux-saga/macro'

import { getAgreement } from 'common/store/cache/agreements/selectors'
import { setVisibility } from 'common/store/ui/modals/slice'
import {
  getAccessToken,
  getIsAuthenticated,
  getOpenId,
  getAgreement as getAgreementToShare
} from 'common/store/ui/shareSoundToTiktokModal/selectors'
import {
  authenticated,
  open,
  requestOpen,
  setIsAuthenticated,
  setStatus,
  share,
  upload
} from 'common/store/ui/shareSoundToTiktokModal/slice'
import { Status } from 'common/store/ui/shareSoundToTiktokModal/types'
import { show as showConfetti } from 'components/musicConfetti/store/slice'
import apiClient from 'services/colivingAPIClient/colivingAPIClient'
import { make } from 'store/analytics/actions'
import { AppState } from 'store/types'
import { getErrorMessage } from 'utils/error'
import { encodeHashId } from 'utils/route/hashIds'

const TIKTOK_SHARE_SOUND_ENDPOINT =
  'https://open-api.tiktok.com/share/sound/upload/'

// Because the digital_content blob cannot digitalcoin in an action (not a POJO),
// we are creating a singleton here to store it
let agreementBlob: Blob | null = null

function* handleRequestOpen(action: ReturnType<typeof requestOpen>) {
  const digital_content = yield* select((state: AppState) =>
    getAgreement(state, { id: action.payload.id })
  )
  if (!digital_content) return

  yield* put(
    open({
      digital_content: {
        id: digital_content.digital_content_id,
        title: digital_content.title,
        duration: digital_content.duration
      }
    })
  )
  yield* put(setVisibility({ modal: 'ShareSoundToTikTok', visible: true }))
}

async function* handleShare() {
  yield* put(make(Name.TIKTOK_START_SHARE_SOUND, {}))

  yield* put(setStatus({ status: Status.SHARE_STARTED }))

  const digital_content = yield* select(getAgreementToShare)
  if (!digital_content) return
  const { id } = digital_content

  try {
    // Fetch the digital_content blob
    const encodedAgreementId = encodeHashId(id)

    const response = yield* call(
      window.fetch,
      apiClient.makeUrl(`/agreements/${encodedAgreementId}/stream`)
    )

    if (!response.ok) {
      throw new Error('TikTok Share sound request unsuccessful')
    }

    agreementBlob = await response.blob()

    // If already authed with TikTok, start the upload
    const authenticated = yield* select(getIsAuthenticated)
    if (authenticated) {
      yield* put(upload())
    }
  } catch (error) {
    const errorMessage = getErrorMessage(error)
    console.log(errorMessage)
    yield* put(make(Name.TIKTOK_SHARE_SOUND_ERROR, { error: errorMessage }))
    yield* put(setStatus({ status: Status.SHARE_ERROR }))
  }
}

function* handleAuthenticated(action: ReturnType<typeof authenticated>) {
  yield* put(setIsAuthenticated())

  // If digital_content blob already downloaded, start the upload
  if (agreementBlob) {
    yield* put(upload())
  }
}

function* handleUpload() {
  // Upload the digital_content blob to TikTok api
  const formData = new FormData()
  formData.append('sound_file', agreementBlob as Blob)

  const openId = yield* select(getOpenId)
  const accessToken = yield* select(getAccessToken)

  try {
    const response = yield* call(
      window.fetch,
      `${TIKTOK_SHARE_SOUND_ENDPOINT}?open_id=${openId}&access_token=${accessToken}`,
      {
        method: 'POST',
        mode: 'cors',
        body: formData
      }
    )

    if (!response.ok) {
      throw new Error('TikTok Share sound request unsuccessful')
    }

    yield* put(make(Name.TIKTOK_COMPLETE_SHARE_SOUND, {}))
    yield* put(setStatus({ status: Status.SHARE_SUCCESS }))
    yield* put(showConfetti())
  } catch (error) {
    const errorMessage = getErrorMessage(error)
    console.log(errorMessage)
    yield* put(make(Name.TIKTOK_SHARE_SOUND_ERROR, { error: errorMessage }))
    yield* put(setStatus({ status: Status.SHARE_ERROR }))
  } finally {
    agreementBlob = null
  }
}

function* watchHandleRequestOpen() {
  yield* takeEvery(requestOpen, handleRequestOpen)
}

function* watchHandleShare() {
  yield* takeEvery(share, handleShare)
}

function* watchHandleAuthenticated() {
  yield* takeEvery(authenticated, handleAuthenticated)
}

function* watchHandleUpload() {
  yield* takeEvery(upload, handleUpload)
}

export default function sagas() {
  return [
    watchHandleRequestOpen,
    watchHandleShare,
    watchHandleAuthenticated,
    watchHandleUpload
  ]
}
