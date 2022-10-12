import { call, select } from 'typed-redux-saga/macro'

import { getUserId } from 'common/store/account/selectors'
import { retrieveUserDigitalContents } from 'common/store/pages/profile/lineups/digital_contents/retrieveUserDigitalContents'
import {
  PREFIX,
  moreByActions
} from 'pages/deletedPage/store/lineups/more-by/actions'
import { getLineup } from 'pages/deletedPage/store/selectors'
import { LineupSagas } from 'store/lineup/sagas'

function* getDigitalContents({
  payload
}: {
  offset: number
  limit: number
  payload: { handle: string }
}) {
  const { handle } = payload
  const currentUserId = yield* select(getUserId)
  const processed = yield* call(retrieveUserDigitalContents, {
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
      getDigitalContents,
      undefined,
      undefined,
      sourceSelector
    )
  }
}

export default function sagas() {
  return new MoreBySagas().getSagas()
}
