import {
  ID,
  TimeRange,
  DigitalContent,
  UserDigitalContentMetadata,
  Nullable,
  StringKeys
} from '@coliving/common'
import { call, put, select } from 'redux-saga/effects'

import { getDigitalContents } from 'common/store/cache/digital_contents/selectors'
import { processAndCacheDigitalContents } from 'common/store/cache/digital_contents/utils'
import { setLastFetchedTrendingGenre } from 'common/store/pages/trending/actions'
import { getTrendingEntries } from 'common/store/pages/trending/lineup/selectors'
import {
  getLastFetchedTrendingGenre,
  getTrendingGenre
} from 'common/store/pages/trending/selectors'
import { Genre } from 'common/utils/genres'
import apiClient from 'services/colivingAPIClient/colivingAPIClient'
import { remoteConfigInstance } from 'services/remoteConfig/remoteConfigInstance'
import { AppState } from 'store/types'

type RetrieveTrendingArgs = {
  timeRange: TimeRange
  genre: Nullable<Genre>
  offset: number
  limit: number
  currentUserId: Nullable<ID>
}

export function* retrieveTrending({
  timeRange,
  genre,
  offset,
  limit,
  currentUserId
}: RetrieveTrendingArgs): Generator<any, DigitalContent[], any> {
  yield call(remoteConfigInstance.waitForRemoteConfig)
  const TF = new Set(
    remoteConfigInstance.getRemoteVar(StringKeys.TF)?.split(',') ?? []
  )

  const cachedDigitalContents: ReturnType<ReturnType<typeof getTrendingEntries>> =
    yield select(getTrendingEntries(timeRange))

  const lastGenre = yield select(getLastFetchedTrendingGenre)
  yield put(setLastFetchedTrendingGenre(genre))

  const useCached = lastGenre === genre && cachedDigitalContents.length > offset + limit

  if (useCached) {
    const digitalContentIds = cachedDigitalContents.slice(offset, limit + offset).map((t) => t.id)
    const digitalContentsMap: ReturnType<typeof getDigitalContents> = yield select(
      (state: AppState) => getDigitalContents(state, { ids: digitalContentIds })
    )
    const digitalContents = digitalContentIds.map((id) => digitalContentsMap[id])
    return digitalContents
  }

  let apiDigitalContents: UserDigitalContentMetadata[] = yield apiClient.getTrending({
    genre,
    offset,
    limit,
    currentUserId,
    timeRange
  })
  if (TF.size > 0) {
    apiDigitalContents = apiDigitalContents.filter((t) => {
      const shaId = window.Web3.utils.sha3(t.digital_content_id.toString())
      return !TF.has(shaId)
    })
  }

  const currentGenre = yield select(getTrendingGenre)

  // If we changed genres, do nothing
  if (currentGenre !== genre) return []

  const processed: DigitalContent[] = yield processAndCacheDigitalContents(apiDigitalContents)
  return processed
}
