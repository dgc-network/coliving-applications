import { Kind } from '@coliving/common'
import { combineReducers } from 'redux'
import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'

import * as cacheActions from 'common/store/cache/actions'
import * as actions from 'common/store/social/agreements/actions'
import ColivingBackend from 'services/ColivingBackend'
import { waitForBackendSetup } from 'store/backend/sagas'
import * as sagas from 'store/social/agreements/sagas'
import { noopReducer } from 'store/testHelper'

const repostingUser = { repost_count: 0 }

describe('repost', () => {
  it('reposts', async () => {
    await expectSaga(sagas.watchRepostAgreement, actions)
      .withReducer(
        combineReducers({
          account: noopReducer(),
          agreements: noopReducer(),
          users: noopReducer()
        }),
        {
          account: {
            userId: 1
          },
          agreements: {
            entries: {
              1: { metadata: { repost_count: 5 } }
            }
          },
          users: {
            entries: {
              1: { metadata: repostingUser }
            }
          }
        }
      )
      .provide([[matchers.call.fn(waitForBackendSetup), true]])
      .dispatch(actions.repostAgreement(1))
      .call(sagas.confirmRepostAgreement, 1, repostingUser)
      .put(
        cacheActions.update(Kind.AGREEMENTS, [
          {
            id: 1,
            metadata: {
              has_current_user_reposted: true,
              repost_count: 6
            }
          }
        ])
      )
      .silentRun()
  })

  it('undoes repost', async () => {
    await expectSaga(sagas.watchUndoRepostAgreement, actions)
      .withReducer(
        combineReducers({
          account: noopReducer(),
          agreements: noopReducer(),
          users: noopReducer()
        }),
        {
          account: {
            userId: 1
          },
          agreements: {
            entries: {
              1: { metadata: { repost_count: 5 } }
            }
          },
          users: {
            entries: {
              1: { metadata: repostingUser }
            }
          }
        }
      )
      .provide([[matchers.call.fn(waitForBackendSetup), true]])
      .dispatch(actions.undoRepostAgreement(1))
      .call(sagas.confirmUndoRepostAgreement, 1, repostingUser)
      .put(
        cacheActions.update(Kind.AGREEMENTS, [
          {
            id: 1,
            metadata: {
              has_current_user_reposted: false,
              repost_count: 4
            }
          }
        ])
      )
      .silentRun()
  })
})

describe('save', () => {
  it('saves', async () => {
    await expectSaga(sagas.watchSaveAgreement, actions)
      .withReducer(
        combineReducers({
          account: noopReducer(),
          agreements: noopReducer()
        }),
        {
          account: {
            userId: 1
          },
          agreements: {
            entries: {
              1: { metadata: { save_count: 5 } }
            }
          }
        }
      )
      .provide([[matchers.call.fn(waitForBackendSetup), true]])
      .dispatch(actions.saveAgreement(1))
      .call(sagas.confirmSaveAgreement, 1)
      .put(
        cacheActions.update(Kind.AGREEMENTS, [
          {
            id: 1,
            metadata: {
              has_current_user_saved: true,
              save_count: 6
            }
          }
        ])
      )
      .silentRun()
  })

  it('unsaves', async () => {
    await expectSaga(sagas.watchUnsaveAgreement, actions)
      .withReducer(
        combineReducers({
          account: noopReducer(),
          agreements: noopReducer()
        }),
        {
          account: {
            userId: 1
          },
          agreements: {
            entries: {
              1: { metadata: { save_count: 5 } }
            }
          }
        }
      )
      .provide([[matchers.call.fn(waitForBackendSetup), true]])
      .dispatch(actions.unsaveAgreement(1))
      .call(sagas.confirmUnsaveAgreement, 1)
      .put(
        cacheActions.update(Kind.AGREEMENTS, [
          {
            id: 1,
            metadata: {
              has_current_user_saved: false,
              save_count: 4
            }
          }
        ])
      )
      .silentRun()
  })
})

describe('recordListen', () => {
  it('dispatches a listen for another account', async () => {
    await expectSaga(sagas.watchRecordListen, actions)
      .withReducer(
        combineReducers({
          account: noopReducer(),
          agreements: noopReducer()
        }),
        {
          account: {
            userId: 1
          },
          agreements: {
            entries: {
              1: { metadata: { owner_id: 2, _listen_count: 11 } }
            }
          }
        }
      )
      .provide([[matchers.call.fn(ColivingBackend.recordAgreementListen), true]])
      .dispatch(actions.recordListen(1))
      .call(ColivingBackend.recordAgreementListen, 1)
      .silentRun()
  })
  it('limits listens on own account', async () => {
    await expectSaga(sagas.watchRecordListen, actions)
      .withReducer(
        combineReducers({
          account: noopReducer(),
          agreements: noopReducer()
        }),
        {
          account: {
            userId: 1
          },
          agreements: {
            entries: {
              // Listens > 10 not counted
              1: { metadata: { owner_id: 1, _listen_count: 11 } }
            }
          }
        }
      )
      .provide([[matchers.call.fn(ColivingBackend.recordAgreementListen), true]])
      .dispatch(actions.recordListen(1))
      .not.call.fn(ColivingBackend.recordAgreementListen, 1)
      .silentRun()
  })
})
