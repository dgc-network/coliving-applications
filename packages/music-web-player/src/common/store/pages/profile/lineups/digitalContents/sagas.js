import { Kind } from '@coliving/common'
import { all, call, select, takeEvery, put } from 'redux-saga/effects'

import { getUserId } from 'common/store/account/selectors'
import { DELETE_DIGITAL_CONTENT } from 'common/store/cache/digital_contents/actions'
import { getDigitalContent } from 'common/store/cache/digital_contents/selectors'
import { retrieveDigitalContents } from 'common/store/cache/digital_contents/utils'
import { getUser } from 'common/store/cache/users/selectors'
import {
  PREFIX,
  digitalContentsActions,
  digitalContentsActions as lineupActions
} from 'common/store/pages/profile/lineups/digital_contents/actions'
import {
  getProfileUserId,
  getProfileDigitalContentsLineup,
  getProfileUserHandle
} from 'common/store/pages/profile/selectors'
import { SET_LANDLORD_PICK } from 'common/store/social/digital_contents/actions'
import { LineupSagas } from 'store/lineup/sagas'
import { waitForValue } from 'utils/sagaHelpers'

import { DigitalContentsSortMode } from '../../types'

import { retrieveUserDigitalContents } from './retrieveUserDigitalContents'

function* getDigitalContents({ offset, limit, payload }) {
  const handle = yield select(getProfileUserHandle)
  const currentUserId = yield select(getUserId)

  // Wait for user to receive social handles
  // We need to know ahead of time whether we want to request
  // the "author pick" digital_content in addition to the author's digitalContents.
  // TODO: Move author pick to chain/discprov to avoid this extra trip
  const user = yield call(
    waitForValue,
    getUser,
    {
      handle: handle.toLowerCase()
    },
    (user) => 'twitter_handle' in user
  )
  const sort = payload.sort === DigitalContentsSortMode.POPULAR ? 'plays' : 'date'
  const getUnlisted = true

  if (user._landlord_pick) {
    let [pinnedDigitalContent, processed] = yield all([
      call(retrieveDigitalContents, { digitalContentIds: [user._landlord_pick] }),
      call(retrieveUserDigitalContents, {
        handle,
        currentUserId,
        sort,
        limit,
        offset,
        getUnlisted
      })
    ])

    // Pinned digitalContents *should* be unpinned
    // when deleted, but just in case they're not,
    // defend against that edge case here.
    if (!pinnedDigitalContent.length || pinnedDigitalContent[0].is_delete) {
      pinnedDigitalContent = []
    }

    const pinnedDigitalContentIndex = processed.findIndex(
      (digital_content) => digital_content.digital_content_id === user._landlord_pick
    )
    if (offset === 0) {
      // If pinned digital_content found in digitalContentsResponse,
      // put it to the front of the list, slicing it out of digitalContentsResponse.
      if (pinnedDigitalContentIndex !== -1) {
        return pinnedDigitalContent
          .concat(processed.slice(0, pinnedDigitalContentIndex))
          .concat(processed.slice(pinnedDigitalContentIndex + 1))
      }
      // If pinned digital_content not in digitalContentsResponse,
      // add it to the front of the list.
      return pinnedDigitalContent.concat(processed)
    } else {
      // If we're paginating w/ offset > 0
      // set the pinned digital_content as null.
      // This will be handled by `filterDeletes` via `nullCount`
      if (pinnedDigitalContentIndex !== -1) {
        return processed.map((digital_content, i) =>
          i === pinnedDigitalContentIndex ? null : digital_content
        )
      }
      return processed
    }
  } else {
    const processed = yield call(retrieveUserDigitalContents, {
      handle,
      currentUserId,
      sort,
      limit,
      offset,
      getUnlisted
    })
    return processed
  }
}

const sourceSelector = (state) => `${PREFIX}:${getProfileUserId(state)}`

class DigitalContentsSagas extends LineupSagas {
  constructor() {
    super(
      PREFIX,
      digitalContentsActions,
      getProfileDigitalContentsLineup,
      getDigitalContents,
      undefined,
      undefined,
      sourceSelector
    )
  }
}

function* watchSetLandlordPick() {
  yield takeEvery(SET_LANDLORD_PICK, function* (action) {
    const lineup = yield select(getProfileDigitalContentsLineup)
    const updatedOrderUid = []
    for (const [entryUid, order] of Object.entries(lineup.order)) {
      const digital_content = yield select(getDigitalContent, { uid: entryUid })
      const isLandlordPick = digital_content.digital_content_id === action.digitalContentId

      if (isLandlordPick) updatedOrderUid.push({ uid: entryUid, order: 0 })
      else updatedOrderUid.push({ uid: entryUid, order: order + 1 })
    }
    updatedOrderUid.sort((a, b) => a.order - b.order)
    const updatedLineupOrder = updatedOrderUid.map(({ uid }) => uid)

    yield put(lineupActions.updateLineupOrder(updatedLineupOrder))
  })
}

function* watchDeleteDigitalContent() {
  yield takeEvery(DELETE_DIGITAL_CONTENT, function* (action) {
    const { digitalContentId } = action
    const lineup = yield select(getProfileDigitalContentsLineup)
    const digitalContentLineupEntry = lineup.entries.find(
      (entry) => entry.id === digitalContentId
    )
    if (digitalContentLineupEntry) {
      yield put(digitalContentsActions.remove(Kind.DIGITAL_CONTENTS, digitalContentLineupEntry.uid))
    }
  })
}

export default function sagas() {
  const digitalContentSagas = new DigitalContentsSagas().getSagas()
  return digitalContentSagas.concat([watchSetLandlordPick, watchDeleteDigitalContent])
}
