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
    case 'digital_content': {
      const { agreementId, source, type } = action.payload
      const digital_content = yield* select(getAgreement(agreementId))
      if (!digital_content) return
      const landlord = yield* select(getUser(digital_content.owner_id))
      if (!landlord) return
      yield put(open({ type, digital_content, source, landlord }))
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
      const owner = yield* select(getUser(collection.content_list_owner_id))
      if (!owner) return
      if (collection.is_album) {
        yield put(
          open({ type: 'album', album: collection, landlord: owner, source })
        )
      } else {
        yield put(
          open({
            type: 'contentList',
            contentList: collection,
            creator: owner,
            source
          })
        )
      }
      break
    }
    case 'liveNftContentList': {
      const { userId, source } = action.payload
      const user = yield* select(getUser(userId))
      if (!user) return
      yield put(
        open({
          type: 'liveNftContentList',
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
