import collectionsSagas from './collections/sagas'
import agreementsSagas from './agreements/sagas'
import usersSagas from './users/sagas'

export default function sagas() {
  return [...agreementsSagas(), ...collectionsSagas(), ...usersSagas()]
}
