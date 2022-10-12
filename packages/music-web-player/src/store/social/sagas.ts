import collectionsSagas from './collections/sagas'
import digitalContentsSagas from './digital_contents/sagas'
import usersSagas from './users/sagas'

export default function sagas() {
  return [...digitalContentsSagas(), ...collectionsSagas(), ...usersSagas()]
}
