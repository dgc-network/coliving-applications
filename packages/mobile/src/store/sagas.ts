import remoteConfig from '@coliving/web/src/common/store/remote-config/sagas'
import { all, fork } from 'redux-saga/effects'

import { remoteConfigInstance } from 'app/services/remote-config/remoteConfigInstance'

import initKeyboardEvents from './keyboard/sagas'
import oauthSagas from './oauth/sagas'

export default function* rootSaga() {
  const sagas = [
    initKeyboardEvents,
    ...remoteConfig(remoteConfigInstance),
    ...oauthSagas()
  ]
  yield all(sagas.map(fork))
}
