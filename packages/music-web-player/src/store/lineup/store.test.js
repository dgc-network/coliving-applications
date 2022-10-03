import { Kind } from '@coliving/common'
import { combineReducers } from 'redux'
import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import { all } from 'redux-saga/effects'

import { asCache, initialCacheState } from 'common/store/cache/reducer'
import cacheSagas from 'common/store/cache/sagas'
import { fetchUsers } from 'common/store/cache/users/sagas'
import { LineupActions } from 'common/store/lineup/actions'
import { asLineup, initialLineupState } from 'common/store/lineup/reducer'
import queueReducer, {
  initialState as initialQueueState
} from 'common/store/queue/slice'
import { waitForBackendSetup } from 'store/backend/sagas'
import { initialState as initialConfirmerState } from 'store/confirmer/reducer'
import { LineupSagas } from 'store/lineup/sagas'
import playerReducer, {
  initialState as initialPlayerState
} from 'store/player/slice'
import { noopReducer, allSagas } from 'store/testHelper'

const PREFIX = 'agreements'
const MOCK_TIMESTAMP = 1479427200000

function* getAgreements() {
  const agreements = yield all([
    {
      agreement_id: 1,
      owner_id: 1,
      keep_in_lineup: 11
    },
    {
      agreement_id: 2,
      owner_id: 1,
      keep_in_lineup: 22
    },
    {
      agreement_id: 3,
      owner_id: 2,
      keep_in_lineup: 33
    },
    {
      agreement_id: 4,
      owner_id: 2,
      keep_in_lineup: 44
    }
  ])
  return agreements
}

class Actions extends LineupActions {
  constructor() {
    super(PREFIX)
  }
}
const actions = new Actions()

class Sagas extends LineupSagas {
  constructor() {
    super(
      PREFIX,
      actions,
      // Selector to fetch the lineup.
      (state) => state.lineup,
      // Query to fetch remote agreements (e.g. from BE).
      getAgreements,
      // Selector of what to keep in the lineup.
      (agreement) => ({
        id: agreement.agreement_id,
        keepInLineup: agreement.keep_in_lineup
      }),
      /* removeDeleted */ false
    )
  }
}
const sagas = new Sagas()

beforeAll(() => {
  jest.spyOn(Date, 'now').mockImplementation(() => MOCK_TIMESTAMP)
})

describe('fetch', () => {
  it('fetches and add agreements to the lineup', async () => {
    const { storeState } = await expectSaga(
      allSagas(sagas.getSagas().concat(cacheSagas())),
      actions
    )
      .withReducer(
        combineReducers({
          lineup: asLineup(PREFIX, noopReducer()),
          queue: queueReducer,
          agreements: asCache(noopReducer(), Kind.AGREEMENTS),
          users: asCache(noopReducer(), Kind.USERS),
          collections: asCache(noopReducer(), Kind.COLECTIONS),
          confirmer: noopReducer()
        }),
        {
          lineup: {
            ...initialLineupState
          },
          queue: {
            ...initialQueueState
          },
          agreements: {
            ...initialCacheState
          },
          users: {
            ...initialCacheState
          },
          collections: {
            ...initialCacheState
          },
          confirmer: {
            ...initialConfirmerState
          }
        }
      )
      .provide([
        [matchers.call.fn(waitForBackendSetup), true],
        [matchers.call.fn(fetchUsers), []]
      ])
      .dispatch(actions.fetchLineupMetadatas())
      .silentRun()
    expect(storeState.lineup.entries).toEqual([
      {
        id: 1,
        uid: 'kind:AGREEMENTS-id:1-count:1',
        keepInLineup: 11
      },
      {
        id: 2,
        uid: 'kind:AGREEMENTS-id:2-count:2',
        keepInLineup: 22
      },
      {
        id: 3,
        uid: 'kind:AGREEMENTS-id:3-count:3',
        keepInLineup: 33
      },
      {
        id: 4,
        uid: 'kind:AGREEMENTS-id:4-count:4',
        keepInLineup: 44
      }
    ])
    expect(storeState.agreements).toEqual({
      ...initialCacheState,
      uids: {
        'kind:AGREEMENTS-id:1-count:1': 1,
        'kind:AGREEMENTS-id:2-count:2': 2,
        'kind:AGREEMENTS-id:3-count:3': 3,
        'kind:AGREEMENTS-id:4-count:4': 4
      },
      subscribers: {
        1: new Set(['kind:AGREEMENTS-id:1-count:1']),
        2: new Set(['kind:AGREEMENTS-id:2-count:2']),
        3: new Set(['kind:AGREEMENTS-id:3-count:3']),
        4: new Set(['kind:AGREEMENTS-id:4-count:4'])
      }
    })
  })
})

describe('play', () => {
  it('adds all agreements to the queue', async () => {
    const { storeState } = await expectSaga(allSagas(sagas.getSagas()), actions)
      .withReducer(
        combineReducers({
          lineup: asLineup(PREFIX, noopReducer()),
          agreements: noopReducer(),
          queue: queueReducer,
          player: playerReducer
        }),
        {
          lineup: {
            ...initialLineupState,
            entries: [
              { id: 1, uid: 'kind:AGREEMENTS-id:1-count:1', kind: Kind.AGREEMENTS },
              { id: 2, uid: 'kind:AGREEMENTS-id:2-count:2', kind: Kind.AGREEMENTS },
              { id: 3, uid: 'kind:AGREEMENTS-id:3-count:3', kind: Kind.AGREEMENTS },
              { id: 4, uid: 'kind:AGREEMENTS-id:4-count:4', kind: Kind.AGREEMENTS }
            ],
            order: {
              'kind:AGREEMENTS-id:1-count:1': 0,
              'kind:AGREEMENTS-id:2-count:2': 1,
              'kind:AGREEMENTS-id:3-count:3': 2,
              'kind:AGREEMENTS-id:4-count:4': 3
            },
            prefix: PREFIX
          },
          agreements: {
            ...initialCacheState,
            entries: {
              1: { metadata: { agreement_id: 1, keep_in_lineup: 11 } },
              2: { metadata: { agreement_id: 2, keep_in_lineup: 22 } },
              3: { metadata: { agreement_id: 3, keep_in_lineup: 33 } },
              4: { metadata: { agreement_id: 4, keep_in_lineup: 44 } }
            },
            uids: {
              'kind:AGREEMENTS-id:1-count:1': 1,
              'kind:AGREEMENTS-id:2-count:2': 2,
              'kind:AGREEMENTS-id:3-count:3': 3,
              'kind:AGREEMENTS-id:4-count:4': 4
            },
            subscribers: {
              1: new Set(['kind:AGREEMENTS-id:1-count:1']),
              2: new Set(['kind:AGREEMENTS-id:2-count:2']),
              3: new Set(['kind:AGREEMENTS-id:3-count:3']),
              4: new Set(['kind:AGREEMENTS-id:4-count:4'])
            }
          },
          queue: {
            ...initialQueueState
          },
          player: {
            ...initialPlayerState
          }
        }
      )
      .dispatch(actions.play('kind:AGREEMENTS-id:2-count:2'))
      .silentRun()
    expect(storeState.queue.order).toEqual([
      { id: 1, uid: 'kind:AGREEMENTS-id:1-count:1', source: PREFIX },
      { id: 2, uid: 'kind:AGREEMENTS-id:2-count:2', source: PREFIX },
      { id: 3, uid: 'kind:AGREEMENTS-id:3-count:3', source: PREFIX },
      { id: 4, uid: 'kind:AGREEMENTS-id:4-count:4', source: PREFIX }
    ])
    expect(storeState.queue.index).toEqual(1)
  })
})
