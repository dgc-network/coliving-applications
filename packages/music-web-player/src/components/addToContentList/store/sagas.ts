import { takeEvery, put } from 'redux-saga/effects'

import { fetchSavedContentLists } from 'common/store/account/reducer'
import * as actions from 'common/store/ui/addToContentList/actions'
import { setVisibility } from 'common/store/ui/modals/slice'
import { requiresAccount } from 'utils/sagaHelpers'

function* handleRequestOpen(action: ReturnType<typeof actions.requestOpen>) {
  yield put(fetchSavedContentLists())
  yield put(actions.open(action.digitalContentId, action.digitalContentTitle))
  yield put(setVisibility({ modal: 'AddToContentList', visible: true }))
}

function* watchHandleRequestOpen() {
  yield takeEvery(actions.REQUEST_OPEN, requiresAccount(handleRequestOpen))
}

export default function sagas() {
  return [watchHandleRequestOpen]
}
