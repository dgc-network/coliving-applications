import { Kind } from '@coliving/common'
import { all, call, select, takeEvery, put } from 'redux-saga/effects'

import { getUserId } from 'common/store/account/selectors'
import { DELETE_AGREEMENT } from 'common/store/cache/agreements/actions'
import { getAgreement } from 'common/store/cache/agreements/selectors'
import { retrieveAgreements } from 'common/store/cache/agreements/utils'
import { getUser } from 'common/store/cache/users/selectors'
import {
  PREFIX,
  agreementsActions,
  agreementsActions as lineupActions
} from 'common/store/pages/profile/lineups/agreements/actions'
import {
  getProfileUserId,
  getProfileAgreementsLineup,
  getProfileUserHandle
} from 'common/store/pages/profile/selectors'
import { SET_ARTIST_PICK } from 'common/store/social/agreements/actions'
import { LineupSagas } from 'store/lineup/sagas'
import { waitForValue } from 'utils/sagaHelpers'

import { AgreementsSortMode } from '../../types'

import { retrieveUserAgreements } from './retrieveUserAgreements'

function* getAgreements({ offset, limit, payload }) {
  const handle = yield select(getProfileUserHandle)
  const currentUserId = yield select(getUserId)

  // Wait for user to receive social handles
  // We need to know ahead of time whether we want to request
  // the "artist pick" agreement in addition to the artist's agreements.
  // TODO: Move artist pick to chain/discprov to avoid this extra trip
  const user = yield call(
    waitForValue,
    getUser,
    {
      handle: handle.toLowerCase()
    },
    (user) => 'twitter_handle' in user
  )
  const sort = payload.sort === AgreementsSortMode.POPULAR ? 'plays' : 'date'
  const getUnlisted = true

  if (user._artist_pick) {
    let [pinnedAgreement, processed] = yield all([
      call(retrieveAgreements, { agreementIds: [user._artist_pick] }),
      call(retrieveUserAgreements, {
        handle,
        currentUserId,
        sort,
        limit,
        offset,
        getUnlisted
      })
    ])

    // Pinned agreements *should* be unpinned
    // when deleted, but just in case they're not,
    // defend against that edge case here.
    if (!pinnedAgreement.length || pinnedAgreement[0].is_delete) {
      pinnedAgreement = []
    }

    const pinnedAgreementIndex = processed.findIndex(
      (agreement) => agreement.agreement_id === user._artist_pick
    )
    if (offset === 0) {
      // If pinned agreement found in agreementsResponse,
      // put it to the front of the list, slicing it out of agreementsResponse.
      if (pinnedAgreementIndex !== -1) {
        return pinnedAgreement
          .concat(processed.slice(0, pinnedAgreementIndex))
          .concat(processed.slice(pinnedAgreementIndex + 1))
      }
      // If pinned agreement not in agreementsResponse,
      // add it to the front of the list.
      return pinnedAgreement.concat(processed)
    } else {
      // If we're paginating w/ offset > 0
      // set the pinned agreement as null.
      // This will be handled by `filterDeletes` via `nullCount`
      if (pinnedAgreementIndex !== -1) {
        return processed.map((agreement, i) =>
          i === pinnedAgreementIndex ? null : agreement
        )
      }
      return processed
    }
  } else {
    const processed = yield call(retrieveUserAgreements, {
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

class AgreementsSagas extends LineupSagas {
  constructor() {
    super(
      PREFIX,
      agreementsActions,
      getProfileAgreementsLineup,
      getAgreements,
      undefined,
      undefined,
      sourceSelector
    )
  }
}

function* watchSetArtistPick() {
  yield takeEvery(SET_ARTIST_PICK, function* (action) {
    const lineup = yield select(getProfileAgreementsLineup)
    const updatedOrderUid = []
    for (const [entryUid, order] of Object.entries(lineup.order)) {
      const agreement = yield select(getAgreement, { uid: entryUid })
      const isArtistPick = agreement.agreement_id === action.agreementId

      if (isArtistPick) updatedOrderUid.push({ uid: entryUid, order: 0 })
      else updatedOrderUid.push({ uid: entryUid, order: order + 1 })
    }
    updatedOrderUid.sort((a, b) => a.order - b.order)
    const updatedLineupOrder = updatedOrderUid.map(({ uid }) => uid)

    yield put(lineupActions.updateLineupOrder(updatedLineupOrder))
  })
}

function* watchDeleteAgreement() {
  yield takeEvery(DELETE_AGREEMENT, function* (action) {
    const { agreementId } = action
    const lineup = yield select(getProfileAgreementsLineup)
    const agreementLineupEntry = lineup.entries.find(
      (entry) => entry.id === agreementId
    )
    if (agreementLineupEntry) {
      yield put(agreementsActions.remove(Kind.AGREEMENTS, agreementLineupEntry.uid))
    }
  })
}

export default function sagas() {
  const agreementSagas = new AgreementsSagas().getSagas()
  return agreementSagas.concat([watchSetArtistPick, watchDeleteAgreement])
}
