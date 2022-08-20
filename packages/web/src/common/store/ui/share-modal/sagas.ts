import { ID } from '@coliving/common'
import { takeEvery, put, select } from 'typed-redux-saga/macro'

import { CommonState } from 'common/store'
import { getCollection as getCollectionBase } from 'common/store/cache/collections/selectors'
import { getAgreement as getAgreementBase } from 'common/store/cache/agreements/selectors'
import { getUser as getUserBase } from 'common/store/cache/users/selectors'

import { setVisibility } from '../modals/slice'

import { open, requestOpen } from './slice'
import { RequestOpenAction } from './types'

const getAgreement = (id: ID) => (state: CommonState) => getAgreementBase(state, { id })
const getUser = (id: ID) => (state: CommonState) => getUserBase(state, { id })
const getCollection = (id: ID) => (state: CommonState) =>
  getCollectionBase(state, { id })

function* handleRequestOpen(action: RequestOpenAction) {
  switch (action.payload.type) {
    case 'agreement': {
      const { agreementId, source, type } = action.payload
      const agreement = yield* select(getAgreement(agreementId))
      if (!agreement) return
      const artist = yield* select(getUser(agreement.owner_id))
      if (!artist) return
      yield put(open({ type, agreement, source, artist }))
      break
    }
    case 'profile': {
      const { profileId, source, type } = action.payload
      const profile = yield* select(getUser(profileId))
      if (!profile) return
      yield put(open({ type, profile, source }))
      break
    }
    case 'collection': {
      const { collectionId, source } = action.payload
      const collection = yield* select(getCollection(collectionId))
      if (!collection) return
      const owner = yield* select(getUser(collection.content list_owner_id))
      if (!owner) return
      if (collection.is_album) {
        yield put(
          open({ type: 'album', album: collection, artist: owner, source })
        )
      } else {
        yield put(
          open({
            type: 'content list',
            content list: collection,
            creator: owner,
            source
          })
        )
      }
      break
    }
    case 'liveNftPlaylist': {
      const { userId, source } = action.payload
      const user = yield* select(getUser(userId))
      if (!user) return
      yield put(
        open({
          type: 'liveNftPlaylist',
          user,
          source
        })
      )
    }
  }

  yield put(setVisibility({ modal: 'Share', visible: true }))
}

function* watchHandleRequestOpen() {
  yield takeEvery(requestOpen, handleRequestOpen)
}

export default function sagas() {
  return [watchHandleRequestOpen]
}
