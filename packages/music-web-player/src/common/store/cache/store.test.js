/* eslint-disable no-import-assign */
import { Kind, makeKindId, Status } from '@coliving/common'
import { combineReducers } from 'redux'
import { expectSaga } from 'redux-saga-test-plan'

import * as actions from 'common/store/cache/actions'
import * as config from 'common/store/cache/config'
import { asCache, initialCacheState } from 'common/store/cache/reducer'
import sagas from 'common/store/cache/sagas'
import { initialState as initialConfirmerState } from 'store/confirmer/reducer'
import {
  allSagas,
  noopReducer,
  takeEverySaga,
  takeSaga
} from 'store/testHelper'

const MOCK_TIMESTAMP = 1479427200000

beforeAll(() => {
  config.CACHE_PRUNE_MIN = 1
  jest.spyOn(Date, 'now').mockImplementation(() => MOCK_TIMESTAMP)
})

describe('add', () => {
  it('can add one', async () => {
    const { storeState } = await expectSaga(allSagas(sagas()), actions)
      .withReducer(
        combineReducers({
          digitalContents: asCache(noopReducer(), Kind.DIGITAL_CONTENTS),
          confirmer: noopReducer()
        }),
        {
          digitalContents: { ...initialCacheState },
          confirmer: { ...initialConfirmerState }
        }
      )
      .dispatch(
        actions.add(Kind.DIGITAL_CONTENTS, [
          {
            id: 1,
            uid: '111',
            metadata: { data: 10 }
          }
        ])
      )
      .put(
        actions.addSucceeded(Kind.DIGITAL_CONTENTS, [
          {
            id: 1,
            uid: '111',
            metadata: { data: 10 }
          }
        ])
      )
      .silentRun()
    expect(storeState.digitalContents.entries).toEqual({
      1: { metadata: { data: 10 }, _timestamp: MOCK_TIMESTAMP }
    })
    expect(storeState.digitalContents.uids).toEqual({
      111: 1
    })
    expect(storeState.digitalContents.subscribers).toEqual({
      1: new Set(['111'])
    })
  })

  it('does not add if confirming', async () => {
    const { storeState } = await expectSaga(allSagas(sagas()), actions)
      .withReducer(
        combineReducers({
          digitalContents: asCache(noopReducer(), Kind.DIGITAL_CONTENTS),
          confirmer: noopReducer()
        }),
        {
          digitalContents: {
            ...initialCacheState,
            entries: {
              1: { metadata: { data: 10 } }
            }
          },
          confirmer: {
            ...initialConfirmerState,
            confirm: {
              [makeKindId(Kind.DIGITAL_CONTENTS, 1)]: () => {}
            }
          }
        }
      )
      .dispatch(
        actions.add(Kind.DIGITAL_CONTENTS, [
          {
            id: 1,
            uid: '111',
            metadata: { data: 10 }
          }
        ])
      )
      .put(
        actions.subscribe(Kind.DIGITAL_CONTENTS, [
          {
            id: 1,
            uid: '111'
          }
        ])
      )
      .silentRun()
    expect(storeState.digitalContents.entries).toEqual({
      ...initialCacheState.entries,
      1: { metadata: { data: 10 } }
    })
    expect(storeState.digitalContents.uids).toEqual({
      111: 1
    })
    expect(storeState.digitalContents.subscribers).toEqual({
      1: new Set(['111'])
    })
  })

  it('can add multiple', async () => {
    const { storeState } = await expectSaga(allSagas(sagas()), actions)
      .withReducer(
        combineReducers({
          digitalContents: asCache(noopReducer(), Kind.DIGITAL_CONTENTS),
          confirmer: noopReducer()
        }),
        {
          digitalContents: { ...initialCacheState },
          confirmer: { ...initialConfirmerState }
        }
      )
      .dispatch(
        actions.add(Kind.DIGITAL_CONTENTS, [
          {
            id: 1,
            uid: '111',
            metadata: { data: 10 }
          },
          {
            id: 2,
            uid: '222',
            metadata: { data: 20 }
          }
        ])
      )
      .put(
        actions.addSucceeded(Kind.DIGITAL_CONTENTS, [
          {
            id: 1,
            uid: '111',
            metadata: { data: 10 }
          },
          {
            id: 2,
            uid: '222',
            metadata: { data: 20 }
          }
        ])
      )
      .dispatch(
        actions.add(Kind.DIGITAL_CONTENTS, [
          {
            id: 3,
            uid: '333',
            metadata: { data: 30 }
          }
        ])
      )
      .silentRun()
    expect(storeState.digitalContents.entries).toEqual({
      1: { metadata: { data: 10 }, _timestamp: MOCK_TIMESTAMP },
      2: { metadata: { data: 20 }, _timestamp: MOCK_TIMESTAMP },
      3: { metadata: { data: 30 }, _timestamp: MOCK_TIMESTAMP }
    })
    expect(storeState.digitalContents.uids).toEqual({
      111: 1,
      222: 2,
      333: 3
    })
    expect(storeState.digitalContents.subscribers).toEqual({
      1: new Set(['111']),
      2: new Set(['222']),
      3: new Set(['333'])
    })
  })

  it('does not replace when unless explicitly told', async () => {
    const { storeState } = await expectSaga(allSagas(sagas()), actions)
      .withReducer(
        combineReducers({
          digitalContents: asCache(noopReducer(), Kind.DIGITAL_CONTENTS),
          confirmer: noopReducer()
        }),
        {
          digitalContents: { ...initialCacheState },
          confirmer: { ...initialConfirmerState }
        }
      )
      .dispatch(
        actions.add(Kind.DIGITAL_CONTENTS, [
          {
            id: 1,
            uid: '111',
            metadata: { oldValue: 10 }
          }
        ])
      )
      .dispatch(
        actions.add(Kind.DIGITAL_CONTENTS, [
          {
            id: 1,
            uid: '222',
            metadata: { newValue: 20 }
          }
        ])
      )
      .silentRun()
    expect(storeState.digitalContents.entries).toEqual({
      1: {
        metadata: { oldValue: 10, newValue: 20 },
        _timestamp: MOCK_TIMESTAMP
      }
    })
    expect(storeState.digitalContents.uids).toEqual({
      111: 1,
      222: 1
    })
    expect(storeState.digitalContents.subscribers).toEqual({
      1: new Set(['111', '222'])
    })
  })

  it('does replace when explicitly told', async () => {
    const { storeState } = await expectSaga(allSagas(sagas()), actions)
      .withReducer(
        combineReducers({
          digitalContents: asCache(noopReducer(), Kind.DIGITAL_CONTENTS),
          confirmer: noopReducer()
        }),
        {
          digitalContents: { ...initialCacheState },
          confirmer: { ...initialConfirmerState }
        }
      )
      .dispatch(
        actions.add(Kind.DIGITAL_CONTENTS, [
          {
            id: 1,
            uid: '111',
            metadata: { oldValue: 10 }
          }
        ])
      )
      .dispatch(
        actions.add(
          Kind.DIGITAL_CONTENTS,
          [
            {
              id: 1,
              uid: '222',
              metadata: { newValue: 20 }
            }
          ],
          true
        )
      )
      .silentRun()
    expect(storeState.digitalContents.entries).toEqual({
      1: { metadata: { newValue: 20 }, _timestamp: MOCK_TIMESTAMP }
    })
    expect(storeState.digitalContents.uids).toEqual({
      111: 1,
      222: 1
    })
    expect(storeState.digitalContents.subscribers).toEqual({
      1: new Set(['111', '222'])
    })
  })
})

describe('update', () => {
  it('can update', async () => {
    const { storeState } = await expectSaga(
      takeEverySaga(actions.UPDATE),
      actions
    )
      .withReducer(
        combineReducers({
          digitalContents: asCache(noopReducer(), Kind.DIGITAL_CONTENTS)
        }),
        {
          digitalContents: {
            ...initialCacheState,
            entries: {
              1: { metadata: { data: 10 } },
              2: { metadata: { data: 20 } }
            },
            uids: {
              111: 1,
              112: 1,
              222: 2
            },
            subscribers: {
              1: new Set(['111', '112']),
              2: new Set(['222'])
            }
          }
        }
      )
      .dispatch(
        actions.update(Kind.DIGITAL_CONTENTS, [
          {
            id: 1,
            metadata: { data: 11 }
          }
        ])
      )
      .dispatch(
        actions.update(Kind.DIGITAL_CONTENTS, [
          {
            id: 2,
            metadata: { data: 21 }
          }
        ])
      )
      .silentRun()
    expect(storeState.digitalContents.entries).toEqual({
      1: { metadata: { data: 11 }, _timestamp: MOCK_TIMESTAMP },
      2: { metadata: { data: 21 }, _timestamp: MOCK_TIMESTAMP }
    })
    expect(storeState.digitalContents.uids).toEqual({
      111: 1,
      112: 1,
      222: 2
    })
    expect(storeState.digitalContents.subscribers).toEqual({
      1: new Set(['111', '112']),
      2: new Set(['222'])
    })
  })

  it('can transitively subscribe', async () => {
    const { storeState } = await expectSaga(takeSaga(actions.UPDATE), actions)
      .withReducer(
        combineReducers({
          digitalContents: asCache(noopReducer(), Kind.DIGITAL_CONTENTS),
          collections: asCache(noopReducer(), Kind.COLLECTIONS)
        }),
        {
          digitalContents: {
            ...initialCacheState,
            entries: {
              1: { metadata: { data: 10 } },
              2: { metadata: { data: 20 } }
            },
            uids: {
              111: 1,
              112: 1,
              222: 2
            },
            subscribers: {
              1: new Set(['111', '112']),
              2: new Set(['222'])
            }
          },
          collections: {
            ...initialCacheState,
            entries: {
              1: { digitalContents: [1, 2] }
            }
          }
        }
      )
      // id 2 subscribes to id 1
      .dispatch(
        actions.update(
          Kind.COLLECTIONS,
          [],
          [
            {
              id: 1,
              kind: Kind.DIGITAL_CONTENTS,
              uids: ['111', '222']
            }
          ]
        )
      )
      .silentRun()
    expect(storeState.collections.subscriptions).toEqual({
      1: new Set([
        { kind: Kind.DIGITAL_CONTENTS, uid: '111' },
        { kind: Kind.DIGITAL_CONTENTS, uid: '222' }
      ])
    })
  })
})

describe('setStatus', () => {
  it('sets status', async () => {
    const { storeState } = await expectSaga(
      takeSaga(actions.SET_STATUS),
      actions
    )
      .withReducer(
        combineReducers({
          digitalContents: asCache(noopReducer(), Kind.DIGITAL_CONTENTS)
        }),
        {
          digitalContents: {
            ...initialCacheState,
            entries: {
              1: { metadata: { data: 10 } }
            },
            statuses: {
              1: Status.LOADING
            },
            uids: {
              111: 1,
              222: 1
            },
            subscribers: {
              1: new Set(['111', '222'])
            }
          }
        }
      )
      .dispatch(
        actions.setStatus(Kind.DIGITAL_CONTENTS, [
          {
            id: 1,
            status: Status.SUCCESS
          }
        ])
      )
      .silentRun()
    expect(storeState.digitalContents.statuses).toEqual({
      1: Status.SUCCESS
    })
  })
})

describe('remove', () => {
  it('can remove one', async () => {
    const initialTestState = {
      ...initialCacheState,
      entries: {
        1: { metadata: { data: 10 } }
      },
      statuses: {
        1: Status.SUCCESS
      },
      uids: {
        111: 1,
        222: 1
      },
      subscribers: {
        1: new Set(['111', '222'])
      }
    }

    const { storeState } = await expectSaga(allSagas(sagas()), actions)
      .withReducer(
        combineReducers({
          digitalContents: asCache(noopReducer(), Kind.DIGITAL_CONTENTS)
        }),
        {
          digitalContents: initialTestState
        }
      )
      .dispatch(actions.remove(Kind.DIGITAL_CONTENTS, [1]))
      .silentRun()
    expect(storeState.digitalContents).toEqual({
      ...initialCacheState
    })
  })
})

describe('remove with pruning', () => {
  beforeAll(() => {
    config.CACHE_PRUNE_MIN = 2
  })
  afterAll(() => {
    config.CACHE_PRUNE_MIN = 1
  })

  it('can mark to be pruned', async () => {
    const initialTestState = {
      ...initialCacheState,
      entries: {
        1: { metadata: { data: 10 } }
      },
      statuses: {
        1: Status.SUCCESS
      },
      uids: {
        111: 1,
        222: 1
      },
      subscribers: {
        1: new Set(['111', '222'])
      }
    }

    const { storeState } = await expectSaga(allSagas(sagas()), actions)
      .withReducer(
        combineReducers({
          digitalContents: asCache(noopReducer(), Kind.DIGITAL_CONTENTS)
        }),
        {
          digitalContents: initialTestState
        }
      )
      .dispatch(actions.remove(Kind.DIGITAL_CONTENTS, [1]))
      .silentRun()
    expect(storeState.digitalContents).toEqual({
      ...initialTestState,
      idsToPrune: new Set([1])
    })
  })
})

describe('subscribe', () => {
  it('can add a subscription', async () => {
    const { storeState } = await expectSaga(
      takeEverySaga(actions.SUBSCRIBE),
      actions
    )
      .withReducer(
        combineReducers({
          digitalContents: asCache(noopReducer(), Kind.DIGITAL_CONTENTS)
        }),
        {
          digitalContents: {
            ...initialCacheState,
            entries: {
              1: { metadata: { data: 10 } },
              2: { metadata: { data: 20 } }
            },
            uids: {
              111: 1,
              222: 1
            },
            subscribers: {
              1: new Set(['111', '222'])
            }
          }
        }
      )
      .dispatch(actions.subscribe(Kind.DIGITAL_CONTENTS, [{ uid: '333', id: 1 }]))
      .dispatch(actions.subscribe(Kind.DIGITAL_CONTENTS, [{ uid: '444', id: 2 }]))
      .silentRun()
    expect(storeState.digitalContents.uids).toEqual({
      111: 1,
      222: 1,
      333: 1,
      444: 2
    })
    expect(storeState.digitalContents.subscribers).toEqual({
      1: new Set(['111', '222', '333']),
      2: new Set(['444'])
    })
  })
})

describe('unsubscribe', () => {
  it('can remove a subscription', async () => {
    const { storeState } = await expectSaga(allSagas(sagas()), actions)
      .withReducer(
        combineReducers({
          digitalContents: asCache(noopReducer(), Kind.DIGITAL_CONTENTS)
        }),
        {
          digitalContents: {
            ...initialCacheState,
            entries: {
              1: { metadata: { data: 10 } }
            },
            uids: {
              111: 1,
              222: 1
            },
            subscribers: {
              1: new Set(['111', '222'])
            }
          }
        }
      )
      .dispatch(actions.unsubscribe(Kind.DIGITAL_CONTENTS, [{ uid: '222', id: 1 }]))
      .put(actions.unsubscribeSucceeded(Kind.DIGITAL_CONTENTS, [{ uid: '222', id: 1 }]))
      .silentRun()
    expect(storeState.digitalContents.uids).toEqual({
      111: 1
    })
    expect(storeState.digitalContents.subscribers).toEqual({
      1: new Set(['111'])
    })
  })

  it('transitively unsubscribes', async () => {
    const { storeState } = await expectSaga(allSagas(sagas()), actions)
      .withReducer(
        combineReducers({
          digitalContents: asCache(noopReducer(), Kind.DIGITAL_CONTENTS),
          collections: asCache(noopReducer(), Kind.COLLECTIONS)
        }),
        {
          digitalContents: {
            ...initialCacheState,
            entries: {
              1: { metadata: { data: 10 } },
              2: { metadata: { data: 20 } }
            },
            uids: {
              111: 1,
              222: 1,
              333: 2
            },
            subscribers: {
              1: new Set(['111', '222']),
              2: new Set(['333'])
            }
          },
          collections: {
            ...initialCacheState,
            entries: {
              1: { digitalContents: [1, 2] }
            },
            uids: {
              444: 1
            },
            subscribers: {
              1: new Set(['444'])
            },
            subscriptions: {
              1: new Set([{ kind: Kind.DIGITAL_CONTENTS, uid: '222' }])
            }
          }
        }
      )
      .dispatch(actions.unsubscribe(Kind.COLLECTIONS, [{ uid: '444', id: 1 }]))
      .put(actions.unsubscribe(Kind.DIGITAL_CONTENTS, [{ uid: '222' }]))
      .put(
        actions.unsubscribeSucceeded(Kind.COLLECTIONS, [{ uid: '444', id: 1 }])
      )
      .put(actions.unsubscribeSucceeded(Kind.DIGITAL_CONTENTS, [{ uid: '222' }]))
      .silentRun()
    expect(storeState.digitalContents.uids).toEqual({
      111: 1,
      333: 2
    })
    expect(storeState.digitalContents.subscribers).toEqual({
      1: new Set(['111']),
      2: new Set(['333'])
    })
    expect(storeState.collections).toEqual(initialCacheState)
  })

  it('removes entries with no subscribers', async () => {
    const { storeState } = await expectSaga(allSagas(sagas()), actions)
      .withReducer(
        combineReducers({
          digitalContents: asCache(noopReducer(), Kind.DIGITAL_CONTENTS)
        }),
        {
          digitalContents: {
            ...initialCacheState,
            entries: {
              1: { metadata: { data: 10 } }
            },
            uids: {
              111: 1,
              222: 1
            },
            subscribers: {
              1: new Set(['111', '222'])
            }
          }
        }
      )
      .dispatch(actions.unsubscribe(Kind.DIGITAL_CONTENTS, [{ uid: '111', id: 1 }]))
      .put(actions.unsubscribeSucceeded(Kind.DIGITAL_CONTENTS, [{ uid: '111', id: 1 }]))
      .dispatch(actions.unsubscribe(Kind.DIGITAL_CONTENTS, [{ uid: '222', id: 1 }]))
      .put(actions.unsubscribeSucceeded(Kind.DIGITAL_CONTENTS, [{ uid: '222', id: 1 }]))
      .put(actions.remove(Kind.DIGITAL_CONTENTS, [1]))
      .silentRun()
    expect(storeState.digitalContents).toEqual(initialCacheState)
  })
})
