import { call, select } from 'typed-redux-saga/macro'

import { getUserId } from 'common/store/account/selectors'
import { retrieveUserAgreements } from 'common/store/pages/profile/lineups/agreements/retrieveUserAgreements'
import {
  PREFIX,
  moreByActions
} from 'pages/deletedPage/store/lineups/more-by/actions'
import { getLineup } from 'pages/deletedPage/store/selectors'
import { LineupSagas } from 'store/lineup/sagas'

function* getAgreements({
  payload
}: {
  offset: number
  limit: number
  payload: { handle: string }
}) {
  const { handle } = payload
  const currentUserId = yield* select(getUserId)
  const processed = yield* call(retrieveUserAgreements, {
    handle,
    currentUserId,
    sort: 'plays',
    limit: 5
  })

  return processed
}

const sourceSelector = () => PREFIX

class MoreBySagas extends LineupSagas {
  constructor() {
    super(
      PREFIX,
      moreByActions,
      getLineup,
      getAgreements,
      undefined,
      undefined,
      sourceSelector
    )
  }
}

export default function sagas() {
  return new MoreBySagas().getSagas()
}
