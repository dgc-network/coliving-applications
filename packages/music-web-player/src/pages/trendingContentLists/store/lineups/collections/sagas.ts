import { Collection, UserCollectionMetadata, StringKeys } from '@coliving/common'
import { call, select } from 'redux-saga/effects'

import { getUserId } from 'common/store/account/selectors'
import { processAndCacheCollections } from 'common/store/cache/collections/utils'
import {
  PREFIX,
  trendingContentListLineupActions
} from 'common/store/pages/trendingContentLists/lineups/actions'
import { getLineup } from 'common/store/pages/trendingContentLists/lineups/selectors'
import apiClient from 'services/colivingAPIClient/colivingAPIClient'
import { remoteConfigInstance } from 'services/remoteConfig/remoteConfigInstance'
import { LineupSagas } from 'store/lineup/sagas'

function* getContentLists({ limit, offset }: { limit: number; offset: number }) {
  yield call(remoteConfigInstance.waitForRemoteConfig)
  const TF = new Set(
    remoteConfigInstance.getRemoteVar(StringKeys.TPF)?.split(',') ?? []
  )

  const time = 'week' as const
  const currentUserId: ReturnType<typeof getUserId> = yield select(getUserId)
  let contentLists: UserCollectionMetadata[] = yield call(
    (args) => apiClient.getTrendingContentLists(args),
    {
      currentUserId,
      limit,
      offset,
      time
    }
  )
  if (TF.size > 0) {
    contentLists = contentLists.filter((p) => {
      const shaId = window.Web3.utils.sha3(p.content_list_id.toString())
      return !TF.has(shaId)
    })
  }

  // Omit contentLists owned by Coliving
  const userIdsToOmit = new Set(
    (
      remoteConfigInstance.getRemoteVar(
        StringKeys.TRENDING_CONTENT_LIST_OMITTED_USER_IDS
      ) || ''
    ).split(',')
  )
  const trendingContentLists = contentLists.filter(
    (contentList) => !userIdsToOmit.has(`${contentList.content_list_owner_id}`)
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
