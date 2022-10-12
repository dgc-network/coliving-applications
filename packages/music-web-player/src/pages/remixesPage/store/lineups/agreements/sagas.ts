import { call, put, select } from 'typed-redux-saga'

import { getUserId } from 'common/store/account/selectors'
import { processAndCacheDigitalContents } from 'common/store/cache/digital_contents/utils'
import {
  PREFIX,
  digitalContentsActions
} from 'common/store/pages/remixes/lineup/actions'
import { getDigitalContentId, getLineup } from 'common/store/pages/remixes/selectors'
import { setCount } from 'common/store/pages/remixes/slice'
import apiClient from 'services/colivingAPIClient/colivingAPIClient'
import { LineupSagas } from 'store/lineup/sagas'
import { AppState } from 'store/types'

function* getDigitalContents({
  offset,
  limit,
  payload
}: {
  offset: number
  limit: number
  payload: { digitalContentId: number | null }
}) {
  const { digitalContentId } = payload
  if (!digitalContentId) return []

  const currentUserId = yield* select(getUserId)
  const { digitalContents, count } = yield* call([apiClient, 'getRemixes'], {
    digitalContentId,
    offset,
    limit,
    currentUserId
  })

  yield* put(setCount({ count }))

  const processedDigitalContents = yield* call(processAndCacheDigitalContents, digitalContents)

  return processedDigitalContents
}

const sourceSelector = (state: AppState) => `${PREFIX}:${getDigitalContentId(state)}`

class DigitalContentsSagas extends LineupSagas {
  constructor() {
    super(
      PREFIX,
      digitalContentsActions,
      getLineup,
      getDigitalContents,
      undefined,
      undefined,
      sourceSelector
    )
  }
}

export default function sagas() {
  return new DigitalContentsSagas().getSagas()
}
