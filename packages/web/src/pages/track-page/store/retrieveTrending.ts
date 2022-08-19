import {
  ID,
  TimeRange,
  Agreement,
  UserAgreementMetadata,
  Nullable,
  StringKeys
} from '@coliving/common'
import { call, put, select } from 'redux-saga/effects'

import { getAgreements } from 'common/store/cache/agreements/selectors'
import { processAndCacheAgreements } from 'common/store/cache/agreements/utils'
import { setLastFetchedTrendingGenre } from 'common/store/pages/trending/actions'
import { getTrendingEntries } from 'common/store/pages/trending/lineup/selectors'
import {
  getLastFetchedTrendingGenre,
  getTrendingGenre
} from 'common/store/pages/trending/selectors'
import { Genre } from 'common/utils/genres'
import apiClient from 'services/coliving-api-client/ColivingAPIClient'
import { remoteConfigInstance } from 'services/remote-config/remote-config-instance'
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
}: RetrieveTrendingArgs): Generator<any, Agreement[], any> {
  yield call(remoteConfigInstance.waitForRemoteConfig)
  const TF = new Set(
    remoteConfigInstance.getRemoteVar(StringKeys.TF)?.split(',') ?? []
  )

  const cachedAgreements: ReturnType<ReturnType<typeof getTrendingEntries>> =
    yield select(getTrendingEntries(timeRange))

  const lastGenre = yield select(getLastFetchedTrendingGenre)
  yield put(setLastFetchedTrendingGenre(genre))

  const useCached = lastGenre === genre && cachedAgreements.length > offset + limit

  if (useCached) {
    const agreementIds = cachedAgreements.slice(offset, limit + offset).map((t) => t.id)
    const agreementsMap: ReturnType<typeof getAgreements> = yield select(
      (state: AppState) => getAgreements(state, { ids: agreementIds })
    )
    const agreements = agreementIds.map((id) => agreementsMap[id])
    return agreements
  }

  let apiAgreements: UserAgreementMetadata[] = yield apiClient.getTrending({
    genre,
    offset,
    limit,
    currentUserId,
    timeRange
  })
  if (TF.size > 0) {
    apiAgreements = apiAgreements.filter((t) => {
      const shaId = window.Web3.utils.sha3(t.agreement_id.toString())
      return !TF.has(shaId)
    })
  }

  const currentGenre = yield select(getTrendingGenre)

  // If we changed genres, do nothing
  if (currentGenre !== genre) return []

  const processed: Agreement[] = yield processAndCacheAgreements(apiAgreements)
  return processed
}
