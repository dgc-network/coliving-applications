import { call, put, select } from 'typed-redux-saga'

import { getUserId } from 'common/store/account/selectors'
import { processAndCacheAgreements } from 'common/store/cache/agreements/utils'
import {
  PREFIX,
  agreementsActions
} from 'common/store/pages/remixes/lineup/actions'
import { getAgreementId, getLineup } from 'common/store/pages/remixes/selectors'
import { setCount } from 'common/store/pages/remixes/slice'
import apiClient from 'services/colivingAPIClient/colivingAPIClient'
import { LineupSagas } from 'store/lineup/sagas'
import { AppState } from 'store/types'

function* getAgreements({
  offset,
  limit,
  payload
}: {
  offset: number
  limit: number
  payload: { agreementId: number | null }
}) {
  const { agreementId } = payload
  if (!agreementId) return []

  const currentUserId = yield* select(getUserId)
  const { agreements, count } = yield* call([apiClient, 'getRemixes'], {
    agreementId,
    offset,
    limit,
    currentUserId
  })

  yield* put(setCount({ count }))

  const processedAgreements = yield* call(processAndCacheAgreements, agreements)

  return processedAgreements
}

const sourceSelector = (state: AppState) => `${PREFIX}:${getAgreementId(state)}`

class AgreementsSagas extends LineupSagas {
  constructor() {
    super(
      PREFIX,
      agreementsActions,
      getLineup,
      getAgreements,
      undefined,
      undefined,
      sourceSelector
    )
  }
}

export default function sagas() {
  return new AgreementsSagas().getSagas()
}
