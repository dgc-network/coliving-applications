import { Kind } from '@coliving/common'
import { combineReducers } from 'redux'
import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'

import * as cacheActions from 'common/store/cache/actions'
import * as actions from 'common/store/social/digital_contents/actions'
import ColivingBackend from 'services/colivingBackend'
import { waitForBackendSetup } from 'store/backend/sagas'
import * as sagas from 'store/social/digital_contents/sagas'
import { noopReducer } from 'store/testHelper'

const repostingUser = { repost_count: 0 }

describe('repost', () => {
  it('reposts', async () => {
    await expectSaga(sagas.watchRepostDigitalContent, actions)
      .withReducer(
        combineReducers({
          account: noopReducer(),
          digitalContents: noopReducer(),
          users: noopReducer()
        }),
        {
          account: {
            userId: 1
          },
          digitalContents: {
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
      .dispatch(actions.repostDigitalContent(1))
      .call(sagas.confirmRepostDigitalContent, 1, repostingUser)
      .put(
        cacheActions.update(Kind.DIGITAL_CONTENTS, [
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
    await expectSaga(sagas.watchUndoRepostDigitalContent, actions)
      .withReducer(
        combineReducers({
          account: noopReducer(),
          digitalContents: noopReducer(),
          users: noopReducer()
        }),
        {
          account: {
            userId: 1
          },
          digitalContents: {
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
      .dispatch(actions.undoRepostDigitalContent(1))
      .call(sagas.confirmUndoRepostDigitalContent, 1, repostingUser)
      .put(
        cacheActions.update(Kind.DIGITAL_CONTENTS, [
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
    await expectSaga(sagas.watchSaveDigitalContent, actions)
      .withReducer(
        combineReducers({
          account: noopReducer(),
          digitalContents: noopReducer()
        }),
        {
          account: {
            userId: 1
          },
          digitalContents: {
            entries: {
              1: { metadata: { save_count: 5 } }
            }
          }
        }
      )
      .provide([[matchers.call.fn(waitForBackendSetup), true]])
      .dispatch(actions.saveDigitalContent(1))
      .call(sagas.confirmSaveDigitalContent, 1)
      .put(
        cacheActions.update(Kind.DIGITAL_CONTENTS, [
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
    await expectSaga(sagas.watchUnsaveDigitalContent, actions)
      .withReducer(
        combineReducers({
          account: noopReducer(),
          digitalContents: noopReducer()
        }),
        {
          account: {
            userId: 1
          },
          digitalContents: {
            entries: {
              1: { metadata: { save_count: 5 } }
            }
          }
        }
      )
      .provide([[matchers.call.fn(waitForBackendSetup), true]])
      .dispatch(actions.unsaveDigitalContent(1))
      .call(sagas.confirmUnsaveDigitalContent, 1)
      .put(
        cacheActions.update(Kind.DIGITAL_CONTENTS, [
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
          digitalContents: noopReducer()
        }),
        {
          account: {
            userId: 1
          },
          digitalContents: {
            entries: {
              1: { metadata: { owner_id: 2, _listen_count: 11 } }
            }
          }
        }
      )
      .provide([[matchers.call.fn(ColivingBackend.recordDigitalContentListen), true]])
      .dispatch(actions.recordListen(1))
      .call(ColivingBackend.recordDigitalContentListen, 1)
      .silentRun()
  })
  it('limits listens on own account', async () => {
    await expectSaga(sagas.watchRecordListen, actions)
      .withReducer(
        combineReducers({
          account: noopReducer(),
          digitalContents: noopReducer()
        }),
        {
          account: {
            userId: 1
          },
          digitalContents: {
            entries: {
              // Listens > 10 not counted
              1: { metadata: { owner_id: 1, _listen_count: 11 } }
            }
          }
        }
      )
      .provide([[matchers.call.fn(ColivingBackend.recordDigitalContentListen), true]])
      .dispatch(actions.recordListen(1))
      .not.call.fn(ColivingBackend.recordDigitalContentListen, 1)
      .silentRun()
  })
})
