import { DigitalContent, UserDigitalContentMetadata, StringKeys } from '@coliving/common'
import { call, select } from 'redux-saga/effects'

import { getUserId } from 'common/store/account/selectors'
import { processAndCacheDigitalContents } from 'common/store/cache/digital_contents/utils'
import {
  PREFIX,
  trendingUndergroundLineupActions
} from 'common/store/pages/trendingUnderground/lineup/actions'
import { getLineup } from 'common/store/pages/trendingUnderground/lineup/selectors'
import apiClient from 'services/colivingAPIClient/colivingAPIClient'
import { remoteConfigInstance } from 'services/remoteConfig/remoteConfigInstance'
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
  let digitalContents: UserDigitalContentMetadata[] = yield call(
    (args) => apiClient.getTrendingUnderground(args),
    {
      currentUserId,
      limit,
      offset
    }
  )
  if (TF.size > 0) {
    digitalContents = digitalContents.filter((t) => {
      const shaId = window.Web3.utils.sha3(t.digital_content_id.toString())
      return !TF.has(shaId)
    })
  }

  const processed: DigitalContent[] = yield processAndCacheDigitalContents(digitalContents)
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
