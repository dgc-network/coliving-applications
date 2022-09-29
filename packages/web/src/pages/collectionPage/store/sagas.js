import { Kind, makeUid } from '@coliving/common'
import { call, put, takeLatest, takeEvery } from 'redux-saga/effects'

import * as cacheActions from 'common/store/cache/actions'
import { retrieveCollections } from 'common/store/cache/collections/utils'
import * as collectionActions from 'common/store/pages/collection/actions'
import { agreementsActions } from 'common/store/pages/collection/lineup/actions.js'
import agreementsSagas from 'pages/collection-page/store/lineups/agreements/sagas'

function* watchFetchCollection() {
  yield takeLatest(collectionActions.FETCH_COLLECTION, function* (action) {
    const collectionId = action.id

    const { collections, uids: collectionUids } = yield call(
      retrieveCollections,
      null,
      [collectionId],
      /* fetchAgreements */ false,
      /* requiresAllAgreements */ true
    )

    if (Object.values(collections).length === 0) {
      yield put(collectionActions.fetchCollectionFailed())
      return
    }
    const collection = collections[collectionId]
    const userUid = makeUid(Kind.USERS, collection.content_list_owner_id)
    const collectionUid = collectionUids[collectionId]
    if (collection) {
      yield put(
        cacheActions.subscribe(Kind.USERS, [
          { uid: userUid, id: collection.content_list_owner_id }
        ])
      )
      yield put(
        collectionActions.fetchCollectionSucceeded(
          collection.content_list_id,
          collectionUid,
          userUid,
          collection.content_list_contents.agreement_ids.length
        )
      )
    } else {
      yield put(collectionActions.fetchCollectionFailed(userUid))
    }
  })
}

function* watchResetCollection() {
  yield takeEvery(collectionActions.RESET_COLLECTION, function* (action) {
    yield put(agreementsActions.reset())
    yield put(
      cacheActions.unsubscribe(Kind.COLLECTIONS, [
        { uid: action.collectionUid }
      ])
    )
    yield put(cacheActions.unsubscribe(Kind.USERS, [{ uid: action.userUid }]))
  })
}

export default function sagas() {
  return [...agreementsSagas(), watchFetchCollection, watchResetCollection]
}
