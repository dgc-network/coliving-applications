import { put, call, take } from 'typed-redux-saga'

import { setFeePayer } from 'common/store/solana/slice'
import ColivingBackend from 'services/colivingBackend'
import * as backendActions from 'store/backend/actions'

function* watchForFeePayer() {
  yield take(backendActions.SETUP_BACKEND_SUCCEEDED)
  const { feePayer, error } = yield* call(
    ColivingBackend.getRandomFeePayer as () => Promise<
      | {
          feePayer: string
          error: undefined
        }
      | { feePayer: undefined; error: boolean }
    >
  )
  if (error) {
    console.error('Could not get fee payer.')
  } else {
    yield put(setFeePayer({ feePayer: feePayer as string }))
  }
}

const sagas = () => {
  return [watchForFeePayer]
}

export default sagas
