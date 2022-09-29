import { Agreement, UserAgreementMetadata, StringKeys } from '@coliving/common'
import { call, select } from 'redux-saga/effects'

import { getUserId } from 'common/store/account/selectors'
import { processAndCacheAgreements } from 'common/store/cache/agreements/utils'
import {
  PREFIX,
  trendingUndergroundLineupActions
} from 'common/store/pages/trendingUnderground/lineup/actions'
import { getLineup } from 'common/store/pages/trendingUnderground/lineup/selectors'
import apiClient from 'services/coliving-api-client/ColivingAPIClient'
import { remoteConfigInstance } from 'services/remote-config/remote-config-instance'
import { LineupSagas } from 'store/lineup/sagas'

function* getTrendingUnderground({
  limit,
  offset
}: {
  limit: number
  offset: number
}) {
  yield call(remoteConfigInstance.waitForRemoteConfig)
  const TF = new Set(
    remoteConfigInstance.getRemoteVar(StringKeys.UTF)?.split(',') ?? []
  )

  const currentUserId: ReturnType<typeof getUserId> = yield select(getUserId)
  let agreements: UserAgreementMetadata[] = yield call(
    (args) => apiClient.getTrendingUnderground(args),
    {
      currentUserId,
      limit,
      offset
    }
  )
  if (TF.size > 0) {
    agreements = agreements.filter((t) => {
      const shaId = window.Web3.utils.sha3(t.agreement_id.toString())
      return !TF.has(shaId)
    })
  }

  const processed: Agreement[] = yield processAndCacheAgreements(agreements)
  return processed
}

class UndergroundTrendingSagas extends LineupSagas {
  constructor() {
    super(
      PREFIX,
      trendingUndergroundLineupActions,
      getLineup,
      getTrendingUnderground
    )
  }
}

const sagas = () => new UndergroundTrendingSagas().getSagas()
export default sagas
