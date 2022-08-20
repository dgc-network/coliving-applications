import { Collection, UserCollectionMetadata, StringKeys } from '@coliving/common'
import { call, select } from 'redux-saga/effects'

import { getUserId } from 'common/store/account/selectors'
import { processAndCacheCollections } from 'common/store/cache/collections/utils'
import {
  PREFIX,
  trendingContentListLineupActions
} from 'common/store/pages/trending-content lists/lineups/actions'
import { getLineup } from 'common/store/pages/trending-content lists/lineups/selectors'
import apiClient from 'services/coliving-api-client/ColivingAPIClient'
import { remoteConfigInstance } from 'services/remote-config/remote-config-instance'
import { LineupSagas } from 'store/lineup/sagas'

function* getContentLists({ limit, offset }: { limit: number; offset: number }) {
  yield call(remoteConfigInstance.waitForRemoteConfig)
  const TF = new Set(
    remoteConfigInstance.getRemoteVar(StringKeys.TPF)?.split(',') ?? []
  )

  const time = 'week' as const
  const currentUserId: ReturnType<typeof getUserId> = yield select(getUserId)
  let content lists: UserCollectionMetadata[] = yield call(
    (args) => apiClient.getTrendingContentLists(args),
    {
      currentUserId,
      limit,
      offset,
      time
    }
  )
  if (TF.size > 0) {
    content lists = content lists.filter((p) => {
      const shaId = window.Web3.utils.sha3(p.content list_id.toString())
      return !TF.has(shaId)
    })
  }

  // Omit content lists owned by Coliving
  const userIdsToOmit = new Set(
    (
      remoteConfigInstance.getRemoteVar(
        StringKeys.TRENDING_CONTENT_LIST_OMITTED_USER_IDS
      ) || ''
    ).split(',')
  )
  const trendingContentLists = content lists.filter(
    (content list) => !userIdsToOmit.has(`${content list.content list_owner_id}`)
  )

  const processed: Collection[] = yield processAndCacheCollections(
    trendingContentLists,
    false
  )

  return processed
}

class TrendingContentListSagas extends LineupSagas {
  constructor() {
    super(PREFIX, trendingContentListLineupActions, getLineup, getContentLists)
  }
}

const sagas = () => new TrendingContentListSagas().getSagas()
export default sagas
