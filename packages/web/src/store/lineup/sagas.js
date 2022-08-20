import { Kind, makeUid, makeUids, Uid } from '@coliving/common'
import {
  all,
  call,
  cancel,
  delay,
  put,
  fork,
  select,
  take,
  takeEvery,
  takeLatest
} from 'redux-saga/effects'

import * as cacheActions from 'common/store/cache/actions'
import { getCollection } from 'common/store/cache/collections/selectors'
import { getAgreement, getAgreements } from 'common/store/cache/agreements/selectors'
import { getUsers } from 'common/store/cache/users/selectors'
import * as baseLineupActions from 'common/store/lineup/actions'
import { getSource, getUid, getPositions } from 'common/store/queue/selectors'
import * as queueActions from 'common/store/queue/slice'
import { getUid as getCurrentPlayerAgreementUid } from 'store/player/selectors'
import { getToQueue } from 'store/queue/sagas'
import { isMobile } from 'utils/clientUtil'

const makeCollectionSourceId = (source, content listId) =>
  `${source}:collection:${content listId}`
const getEntryId = (entry) => `${entry.kind}:${entry.id}`

const flatten = (list) =>
  list.reduce((a, b) => a.concat(Array.isArray(b) ? flatten(b) : b), [])
function* filterDeletes(agreementsMetadata, removeDeleted) {
  const agreements = yield select(getAgreements)
  const users = yield select(getUsers)
  return agreementsMetadata
    .map((metadata) => {
      // If the incoming metadata is null, return null
      // This will be accounted for in `nullCount`
      if (metadata === null) {
        return null
      }
      // If we said to remove deleted agreements and it is deleted, remove it
      if (removeDeleted && metadata.is_delete) return null
      // If we said to remove deleted and the agreement/content list owner is deactivated, remove it
      else if (removeDeleted && users[metadata.owner_id]?.is_deactivated)
        return null
      else if (
        removeDeleted &&
        users[metadata.content list_owner_id]?.is_deactivated
      )
        return null
      // If the agreement was not cached, keep it
      else if (!agreements[metadata.agreement_id]) return metadata
      // If we said to remove deleted and it's marked deleted remove it
      else if (removeDeleted && agreements[metadata.agreement_id]._marked_deleted)
        return null
      return {
        ...metadata,
        // Maintain the marked deleted
        _marked_deleted: !!agreements[metadata.agreement_id]._marked_deleted
      }
    })
    .filter(Boolean)
}

function getAgreementCacheables(metadata, uid, agreementSubscribers) {
  agreementSubscribers.push({ uid: metadata.uid || uid, id: metadata.agreement_id })
}

function getCollectionCacheables(
  metadata,
  uid,
  collectionsToCache,
  agreementSubscriptions,
  agreementSubscribers
) {
  collectionsToCache.push({ id: metadata.content list_id, uid, metadata })

  const agreementIds = metadata.content list_contents.agreement_ids.map((t) => t.agreement)
  const agreementUids = agreementIds.map((id) =>
    makeUid(Kind.AGREEMENTS, id, `collection:${metadata.content list_id}`)
  )

  agreementSubscriptions.push({
    id: metadata.content list_id,
    kind: Kind.AGREEMENTS,
    uids: agreementUids
  })
  metadata.content list_contents.agreement_ids =
    metadata.content list_contents.agreement_ids.map((t, i) => {
      const agreementUid = t.uid || agreementUids[i]
      agreementSubscribers.push({ uid: agreementUid, id: t.agreement })
      return { uid: agreementUid, ...t }
    })
}

function* fetchLineupMetadatasAsync(
  lineupActions,
  lineupMetadatasCall,
  lineupSelector,
  retainSelector,
  lineupPrefix,
  removeDeleted,
  sourceSelector,
  action
) {
  const initLineup = yield select(lineupSelector)
  const initSource = sourceSelector
    ? yield select(sourceSelector)
    : initLineup.prefix

  const task = yield fork(function* () {
    try {
      yield put(
        lineupActions.fetchLineupMetadatasRequested(
          action.offset,
          action.limit,
          action.overwrite,
          action.payload
        )
      )

      // Let page animations on mobile have time to breathe
      // TODO: Get rid of this once we figure out how to make loading better
      if (isMobile()) {
        yield delay(100)
      }

      const lineupMetadatasResponse = yield call(lineupMetadatasCall, {
        offset: action.offset,
        limit: action.limit,
        payload: action.payload
      })

      if (lineupMetadatasResponse === null) return
      const lineup = yield select(lineupSelector)
      const source = sourceSelector
        ? yield select(sourceSelector)
        : lineup.prefix

      const queueUids = Object.keys(yield select(getPositions)).map((uid) =>
        Uid.fromString(uid)
      )
      // Get every UID in the queue whose source references this lineup
      // in the form of { id: [uid1, uid2] }
      const uidForSource = queueUids
        .filter((uid) => uid.source === source)
        .reduce((mapping, uid) => {
          if (uid.id in mapping) {
            mapping[uid.id].push(uid.toString())
          } else {
            mapping[uid.id] = [uid.toString()]
          }
          return mapping
        }, {})

      // Filter out deletes
      const responseFilteredDeletes = yield call(
        filterDeletes,
        lineupMetadatasResponse,
        removeDeleted
      )

      const nullCount = lineupMetadatasResponse.reduce(
        (result, current) => (current === null ? result + 1 : result),
        0
      )

      const allMetadatas = responseFilteredDeletes.map((item) => {
        const id = item.agreement_id
        if (id && uidForSource[id] && uidForSource[id].length > 0) {
          item.uid = uidForSource[id].shift()
        }
        return item
      })

      const kinds = allMetadatas.map((metadata) =>
        metadata.agreement_id ? Kind.AGREEMENTS : Kind.COLLECTIONS
      )
      const ids = allMetadatas.map(
        (metadata) => metadata.agreement_id || metadata.content list_id
      )
      const uids = makeUids(kinds, ids, source)

      // Cache agreements and collections.
      const collectionsToCache = []

      const agreementSubscriptions = []
      let agreementSubscribers = []

      allMetadatas.forEach((metadata, i) => {
        // Need to update the UIDs on the content list agreements
        if (metadata.content list_id) {
          getCollectionCacheables(
            metadata,
            uids[i],
            collectionsToCache,
            agreementSubscriptions,
            agreementSubscribers
          )
        } else if (metadata.agreement_id) {
          getAgreementCacheables(metadata, uids[i], agreementSubscribers)
        }
      })

      const lineupCollections = allMetadatas.filter(
        (item) => !!item.content list_id
      )

      lineupCollections.forEach((metadata) => {
        const agreementUids = metadata.content list_contents.agreement_ids.map(
          (agreement, idx) => {
            const id = agreement.agreement
            const uid = new Uid(
              Kind.AGREEMENTS,
              id,
              makeCollectionSourceId(source, metadata.content list_id),
              idx
            )
            return { id, uid: uid.toString() }
          }
        )
        agreementSubscribers = agreementSubscribers.concat(agreementUids)
      })

      // We rewrote the content list agreements with new UIDs, so we need to update them
      // in the cache.
      if (collectionsToCache.length > 0) {
        yield put(cacheActions.update(Kind.COLLECTIONS, collectionsToCache))
      }
      if (agreementSubscriptions.length > 0) {
        yield put(cacheActions.update(Kind.COLLECTIONS, [], agreementSubscriptions))
      }
      if (agreementSubscribers.length > 0) {
        yield put(cacheActions.subscribe(Kind.AGREEMENTS, agreementSubscribers))
      }
      // Retain specified info in the lineup itself and resolve with success.
      const lineupEntries = allMetadatas
        .map(retainSelector)
        .map((m, i) => {
          const lineupEntry = allMetadatas[i]
          // Use metadata.uid, entry.uid, computed new uid in that order of precedence
          return { ...m, uid: m.uid || lineupEntry.uid || uids[i] }
        })
        .filter((metadata, idx) => {
          if (lineup.dedupe && lineup.entryIds) {
            const entryId = getEntryId(metadata)
            if (lineup.entryIds.has(entryId)) return false
            lineup.entryIds.add(entryId)
          }
          return true
        })

      const deletedCount = action.limit - lineupEntries.length - nullCount
      yield put(
        lineupActions.fetchLineupMetadatasSucceeded(
          lineupEntries,
          action.offset,
          action.limit,
          deletedCount,
          nullCount
        )
      )

      // Add additional items to the queue if need be.
      yield fork(updateQueueLineup, lineupPrefix, source, lineupEntries)
    } catch (err) {
      console.error(err)
      yield put(lineupActions.fetchLineupMetadatasFailed())
    }
  })
  const { source: resetSource } = yield take(
    baseLineupActions.addPrefix(lineupPrefix, baseLineupActions.RESET)
  )
  // If a source is specified in the reset action, make sure it matches the lineup source
  // If not specified, cancel the fetchAgreementMetdatas
  if (!resetSource || resetSource === initSource) {
    yield cancel(task)
  }
}

function* updateQueueLineup(lineupPrefix, source, lineupEntries) {
  const queueSource = yield select(getSource)
  const uid = yield select(getUid)
  const currentUidSource = uid && Uid.fromString(uid).source
  if (
    queueSource === lineupPrefix &&
    (!source || source === currentUidSource)
  ) {
    const toQueue = yield all(
      lineupEntries.map((e) => call(getToQueue, lineupPrefix, e))
    )
    const flattenedQueue = flatten(toQueue)
    yield put(queueActions.add({ entries: flattenedQueue }))
  }
}

function* play(lineupActions, lineupSelector, prefix, action) {
  const lineup = yield select(lineupSelector)
  const requestedPlayAgreement = yield select(getAgreement, { uid: action.uid })

  if (action.uid) {
    const source = yield select(getSource)
    const currentPlayerAgreementUid = yield select(getCurrentPlayerAgreementUid)
    if (
      !currentPlayerAgreementUid ||
      action.uid !== currentPlayerAgreementUid ||
      source !== lineup.prefix
    ) {
      const toQueue = yield all(
        lineup.entries.map((e) => call(getToQueue, lineup.prefix, e))
      )
      const flattenedQueue = flatten(toQueue)
      yield put(queueActions.clear({}))
      yield put(queueActions.add({ entries: flattenedQueue }))
    }
  }
  yield put(
    queueActions.play({
      uid: action.uid,
      agreementId: requestedPlayAgreement && requestedPlayAgreement.agreement_id,
      source: prefix
    })
  )
}

function* pause(action) {
  yield put(queueActions.pause({}))
}

function* reset(
  lineupActions,
  lineupPrefix,
  lineupSelector,
  sourceSelector,
  action
) {
  const lineup = yield select(lineupSelector)
  // Remove this lineup as a subscriber from all of its agreements and collections.
  const subscriptionsToRemove = {} // keyed by kind
  const source = sourceSelector ? yield select(sourceSelector) : lineupPrefix

  for (const entry of lineup.entries) {
    const { kind, uid } = entry
    if (!subscriptionsToRemove[kind]) {
      subscriptionsToRemove[kind] = [{ uid }]
    } else {
      subscriptionsToRemove[kind].push({ uid })
    }
    if (entry.kind === Kind.COLLECTIONS) {
      const collection = yield select(getCollection, { uid: entry.uid })
      const removeAgreementIds = collection.content list_contents.agreement_ids.map(
        ({ agreement: agreementId }, idx) => {
          const agreementUid = new Uid(
            Kind.AGREEMENTS,
            agreementId,
            makeCollectionSourceId(source, collection.content list_id),
            idx
          )
          return { UID: agreementUid.toString() }
        }
      )
      subscriptionsToRemove[Kind.AGREEMENTS] = (
        subscriptionsToRemove[Kind.AGREEMENTS] || []
      ).concat(removeAgreementIds)
    }
  }
  yield all(
    Object.keys(subscriptionsToRemove).map((kind) =>
      put(cacheActions.unsubscribe(kind, subscriptionsToRemove[kind]))
    )
  )

  yield put(lineupActions.resetSucceeded(action))
}

function* add(action) {
  if (action.entry && action.id) {
    const { kind, uid } = action.entry
    yield put(cacheActions.subscribe(kind, [{ uid, id: action.id }]))
  }
}

function* remove(action) {
  if (action.kind && action.uid) {
    yield put(cacheActions.unsubscribe(action.kind, [{ uid: action.uid }]))
  }
}

function* updateLineupOrder(lineupPrefix, sourceSelector, action) {
  // TODO: Investigate a better way to handle reordering of the lineup and transitively
  // reordering the queue. This implementation is slightly buggy in that the source may not
  // be set on the queue item when reordering and the next agreement won't resume correctly.
  const queueSource = yield select(getSource)
  const source = yield select(sourceSelector)
  const uid = yield select(getUid)
  const currentUidSource = uid && Uid.fromString(uid).source
  if (
    queueSource === lineupPrefix &&
    (!source || source === currentUidSource)
  ) {
    yield put(queueActions.reorder({ orderedUids: action.orderedIds }))
  }
}

function* refreshInView(lineupActions, lineupSelector, action) {
  const lineup = yield select(lineupSelector)
  if (lineup.inView) {
    yield put(
      lineupActions.fetchLineupMetadatas(
        0,
        action.limit || lineup.total,
        false,
        action.payload
      )
    )
  }
}

const keepUidAndKind = (entry) => ({
  uid: entry.uid,
  kind: entry.agreement_id ? Kind.AGREEMENTS : Kind.COLLECTIONS,
  id: entry.agreement_id || entry.content list_id
})

/**
 * A generic class of common Lineup Sagas for fetching, loading and
 * simple playback.
 * @example
 *  // contentList.js
 *  // Creates an exports and array of all sagas to be combined in the
 *  // root saga.
 *  class PlaylistSagas extends LineupSagas {
 *    constructor() {
 *      const selector = store => store.content list
 *      super("CONTENT_LIST", content listActions, selector, Backend.getPlaylist)
 *    }
 *  }
 *  export default function sagas () {
 *    return new PlaylistSagas().getSagas()
 *  }
 */
export class LineupSagas {
  /**
   * @param {string} prefix the prefix for the lineup, e.g. FEED
   * @param {object} actions the actions class instance for the lineup
   * @param {function} selector the selector for the lineup, e.g. state => state.feed
   * @param {function * | async function} lineupMetadatasCall
   *   the backend call to make to fetch the agreements metadatas for the lineup
   * @param {?function} retainSelector a selector used to retain various metadata inside the lineup state
   *   otherwise, the lineup will only retain the agreement id indexing into the cache
   * @param {?boolean} removeDeleted whether or not to prune deleted agreements
   * @param {?function} sourceSelector optional selector that sets the UID source for entries
   */
  constructor(
    prefix,
    actions,
    selector,
    lineupMetadatasCall,
    retainSelector = keepUidAndKind,
    removeDeleted = true,
    sourceSelector = null
  ) {
    this.prefix = prefix
    this.actions = actions
    this.selector = selector
    this.lineupMetadatasCall = lineupMetadatasCall
    this.retainSelector = retainSelector
    this.removeDeleted = removeDeleted
    this.sourceSelector = sourceSelector
  }

  watchFetchLineupMetadata = () => {
    const instance = this
    return function* () {
      yield takeLatest(
        baseLineupActions.addPrefix(
          instance.prefix,
          baseLineupActions.FETCH_LINEUP_METADATAS
        ),
        fetchLineupMetadatasAsync,
        instance.actions,
        instance.lineupMetadatasCall,
        instance.selector,
        instance.retainSelector,
        instance.prefix,
        instance.removeDeleted,
        instance.sourceSelector
      )
    }
  }

  watchPlay = () => {
    const instance = this
    return function* () {
      yield takeLatest(
        baseLineupActions.addPrefix(instance.prefix, baseLineupActions.PLAY),
        play,
        instance.actions,
        instance.selector,
        instance.prefix
      )
    }
  }

  watchPauseAgreement = () => {
    const instance = this
    return function* () {
      yield takeLatest(
        baseLineupActions.addPrefix(instance.prefix, baseLineupActions.PAUSE),
        pause
      )
    }
  }

  watchReset = () => {
    const instance = this
    return function* () {
      yield takeLatest(
        baseLineupActions.addPrefix(instance.prefix, baseLineupActions.RESET),
        reset,
        instance.actions,
        instance.prefix,
        instance.selector,
        instance.sourceSelector
      )
    }
  }

  watchAdd = () => {
    const instance = this
    return function* () {
      yield takeEvery(
        baseLineupActions.addPrefix(instance.prefix, baseLineupActions.ADD),
        add
      )
    }
  }

  watchRemove = () => {
    const instance = this
    return function* () {
      yield takeEvery(
        baseLineupActions.addPrefix(instance.prefix, baseLineupActions.REMOVE),
        remove
      )
    }
  }

  watchUpdateLineupOrder = () => {
    const instance = this
    return function* () {
      yield takeLatest(
        baseLineupActions.addPrefix(
          instance.prefix,
          baseLineupActions.UPDATE_LINEUP_ORDER
        ),
        updateLineupOrder,
        instance.prefix,
        instance.sourceSelector
      )
    }
  }

  watchRefreshInView = () => {
    const instance = this
    return function* () {
      yield takeLatest(
        baseLineupActions.addPrefix(
          instance.prefix,
          baseLineupActions.REFRESH_IN_VIEW
        ),
        refreshInView,
        instance.actions,
        instance.selector
      )
    }
  }

  getSagas() {
    return [
      this.watchFetchLineupMetadata(),
      this.watchPlay(),
      this.watchPauseAgreement(),
      this.watchReset(),
      this.watchAdd(),
      this.watchRemove(),
      this.watchUpdateLineupOrder(),
      this.watchRefreshInView()
    ]
  }
}
