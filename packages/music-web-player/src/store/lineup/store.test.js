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

const PREFIX = 'digitalContents'
const MOCK_TIMESTAMP = 1479427200000

function* getDigitalContents() {
  const digitalContents = yield all([
    {
      digital_content_id: 1,
      owner_id: 1,
      keep_in_lineup: 11
    },
    {
      digital_content_id: 2,
      owner_id: 1,
      keep_in_lineup: 22
    },
    {
      digital_content_id: 3,
      owner_id: 2,
      keep_in_lineup: 33
    },
    {
      digital_content_id: 4,
      owner_id: 2,
      keep_in_lineup: 44
    }
  ])
  return digitalContents
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
      // Query to fetch remote digitalContents (e.g. from BE).
      getDigitalContents,
      // Selector of what to keep in the lineup.
      (digital_content) => ({
        id: digital_content.digital_content_id,
        keepInLineup: digital_content.keep_in_lineup
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
  it('fetches and add digitalContents to the lineup', async () => {
    const { storeState } = await expectSaga(
      allSagas(sagas.getSagas().concat(cacheSagas())),
      actions
    )
      .withReducer(
        combineReducers({
          lineup: asLineup(PREFIX, noopReducer()),
          queue: queueReducer,
          digitalContents: asCache(noopReducer(), Kind.DIGITAL_CONTENTS),
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
          digitalContents: {
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
        uid: 'kind:DIGITAL_CONTENTS-id:1-count:1',
        keepInLineup: 11
      },
      {
        id: 2,
        uid: 'kind:DIGITAL_CONTENTS-id:2-count:2',
        keepInLineup: 22
      },
      {
        id: 3,
        uid: 'kind:DIGITAL_CONTENTS-id:3-count:3',
        keepInLineup: 33
      },
      {
        id: 4,
        uid: 'kind:DIGITAL_CONTENTS-id:4-count:4',
        keepInLineup: 44
      }
    ])
    expect(storeState.digitalContents).toEqual({
      ...initialCacheState,
      uids: {
        'kind:DIGITAL_CONTENTS-id:1-count:1': 1,
        'kind:DIGITAL_CONTENTS-id:2-count:2': 2,
        'kind:DIGITAL_CONTENTS-id:3-count:3': 3,
        'kind:DIGITAL_CONTENTS-id:4-count:4': 4
      },
      subscribers: {
        1: new Set(['kind:DIGITAL_CONTENTS-id:1-count:1']),
        2: new Set(['kind:DIGITAL_CONTENTS-id:2-count:2']),
        3: new Set(['kind:DIGITAL_CONTENTS-id:3-count:3']),
        4: new Set(['kind:DIGITAL_CONTENTS-id:4-count:4'])
      }
    })
  })
})

describe('play', () => {
  it('adds all digitalContents to the queue', async () => {
    const { storeState } = await expectSaga(allSagas(sagas.getSagas()), actions)
      .withReducer(
        combineReducers({
          lineup: asLineup(PREFIX, noopReducer()),
          digitalContents: noopReducer(),
          queue: queueReducer,
          player: playerReducer
        }),
        {
          lineup: {
            ...initialLineupState,
            entries: [
              { id: 1, uid: 'kind:DIGITAL_CONTENTS-id:1-count:1', kind: Kind.DIGITAL_CONTENTS },
              { id: 2, uid: 'kind:DIGITAL_CONTENTS-id:2-count:2', kind: Kind.DIGITAL_CONTENTS },
              { id: 3, uid: 'kind:DIGITAL_CONTENTS-id:3-count:3', kind: Kind.DIGITAL_CONTENTS },
              { id: 4, uid: 'kind:DIGITAL_CONTENTS-id:4-count:4', kind: Kind.DIGITAL_CONTENTS }
            ],
            order: {
              'kind:DIGITAL_CONTENTS-id:1-count:1': 0,
              'kind:DIGITAL_CONTENTS-id:2-count:2': 1,
              'kind:DIGITAL_CONTENTS-id:3-count:3': 2,
              'kind:DIGITAL_CONTENTS-id:4-count:4': 3
            },
            prefix: PREFIX
          },
          digitalContents: {
            ...initialCacheState,
            entries: {
              1: { metadata: { digital_content_id: 1, keep_in_lineup: 11 } },
              2: { metadata: { digital_content_id: 2, keep_in_lineup: 22 } },
              3: { metadata: { digital_content_id: 3, keep_in_lineup: 33 } },
              4: { metadata: { digital_content_id: 4, keep_in_lineup: 44 } }
            },
            uids: {
              'kind:DIGITAL_CONTENTS-id:1-count:1': 1,
              'kind:DIGITAL_CONTENTS-id:2-count:2': 2,
              'kind:DIGITAL_CONTENTS-id:3-count:3': 3,
              'kind:DIGITAL_CONTENTS-id:4-count:4': 4
            },
            subscribers: {
              1: new Set(['kind:DIGITAL_CONTENTS-id:1-count:1']),
              2: new Set(['kind:DIGITAL_CONTENTS-id:2-count:2']),
              3: new Set(['kind:DIGITAL_CONTENTS-id:3-count:3']),
              4: new Set(['kind:DIGITAL_CONTENTS-id:4-count:4'])
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
      .dispatch(actions.play('kind:DIGITAL_CONTENTS-id:2-count:2'))
      .silentRun()
    expect(storeState.queue.order).toEqual([
      { id: 1, uid: 'kind:DIGITAL_CONTENTS-id:1-count:1', source: PREFIX },
      { id: 2, uid: 'kind:DIGITAL_CONTENTS-id:2-count:2', source: PREFIX },
      { id: 3, uid: 'kind:DIGITAL_CONTENTS-id:3-count:3', source: PREFIX },
      { id: 4, uid: 'kind:DIGITAL_CONTENTS-id:4-count:4', source: PREFIX }
    ])
    expect(storeState.queue.index).toEqual(1)
  })
})
