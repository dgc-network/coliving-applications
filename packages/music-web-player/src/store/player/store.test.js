import { combineReducers } from 'redux'
import { expectSaga } from 'redux-saga-test-plan'

import * as sagas from 'store/player/sagas'
import reducer from 'store/player/slice'
import * as actions from 'store/player/slice'
import { noopReducer } from 'store/testHelper'

const initialAgreements = {
  entries: {
    1: { metadata: { owner_id: 1, digital_content_segments: {} } }
  },
  uids: {
    123: 1
  }
}

const initialUsers = {
  entries: {
    1: { metadata: { handle: 'ganondorf' } }
  }
}

const makeInitialPlayer = (playing) => ({
  digitalcoin: {
    load: jest.fn(),
    play: jest.fn(),
    pause: jest.fn(),
    stop: jest.fn(),
    seek: jest.fn()
  },
  playing
})

describe('watchPlay', () => {
  it('plays uid', async () => {
    const initialPlayer = makeInitialPlayer(false)
    const { storeState } = await expectSaga(sagas.watchPlay, actions)
      .withReducer(
        combineReducers({
          agreements: noopReducer(initialAgreements),
          users: noopReducer(initialUsers),
          player: reducer
        }),
        {
          agreements: initialAgreements,
          users: initialUsers,
          player: initialPlayer
        }
      )
      .dispatch(actions.play({ uid: '123', agreementId: 1, onEnd: () => {} }))
      .silentRun()
    expect(storeState.player).toMatchObject({
      playing: true
    })
    expect(initialPlayer.digitalcoin.load).toBeCalled()
    expect(initialPlayer.digitalcoin.play).toBeCalled()
  })

  it('plays by resuming', async () => {
    const initialPlayer = makeInitialPlayer(true)
    const { storeState } = await expectSaga(sagas.watchPlay, actions)
      .withReducer(
        combineReducers({
          agreements: noopReducer(initialAgreements),
          users: noopReducer(initialUsers),
          player: reducer
        }),
        {
          agreements: initialAgreements,
          users: initialUsers,
          player: initialPlayer
        }
      )
      .dispatch(actions.play({}))
      .silentRun()
    expect(storeState.player).toMatchObject({
      playing: true
    })
    expect(initialPlayer.digitalcoin.play).toBeCalled()
  })
})

describe('watchPause', () => {
  it('pauses', async () => {
    const initialPlayer = makeInitialPlayer(false)
    const { storeState } = await expectSaga(sagas.watchPause, actions)
      .withReducer(
        combineReducers({
          agreements: noopReducer(initialAgreements),
          player: reducer
        }),
        {
          agreements: initialAgreements,
          player: initialPlayer
        }
      )
      .dispatch(actions.pause({}))
      .silentRun()
    expect(storeState.player).toMatchObject({
      playing: false
    })
    expect(initialPlayer.digitalcoin.pause).toBeCalled()
  })
})

describe('watchStop', () => {
  it('stops', async () => {
    const initialPlayer = makeInitialPlayer(false)
    const { storeState } = await expectSaga(sagas.watchStop, actions)
      .withReducer(
        combineReducers({
          agreements: noopReducer(initialAgreements),
          player: reducer
        }),
        {
          agreements: initialAgreements,
          player: initialPlayer
        }
      )
      .dispatch(actions.stop({}))
      .silentRun()
    expect(storeState.player).toMatchObject({
      playing: false
    })
    expect(initialPlayer.digitalcoin.stop).toBeCalled()
  })
})

describe('watchSeek', () => {
  it('seeks', async () => {
    const initialPlayer = makeInitialPlayer(true)
    const { storeState } = await expectSaga(sagas.watchSeek, actions)
      .withReducer(
        combineReducers({
          agreements: noopReducer(initialAgreements),
          player: reducer
        }),
        {
          agreements: initialAgreements,
          player: initialPlayer
        }
      )
      .dispatch(actions.seek({ seconds: 30 }))
      .silentRun()
    expect(storeState.player).toMatchObject({
      playing: true
    })
    expect(initialPlayer.digitalcoin.seek).toBeCalledWith(30)
  })
})
