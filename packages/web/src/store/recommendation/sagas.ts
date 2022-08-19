import { ID, UserAgreement, Nullable } from '@coliving/common'
import { call } from 'typed-redux-saga'

import { processAndCacheAgreements } from 'common/store/cache/agreements/utils'
import apiClient from 'services/coliving-api-client/ColivingAPIClient'

import ColivingBackend from '../../services/ColivingBackend'
import Explore from '../../services/coliving-backend/Explore'

export function* getRecommendedAgreements(
  genre: string,
  exclusionList: number[],
  currentUserId: Nullable<ID>
) {
  const agreements = yield* call([apiClient, apiClient.getRecommended], {
    genre,
    exclusionList,
    currentUserId
  })
  yield* call(processAndCacheAgreements, agreements)
  return agreements
}

export function* getLuckyAgreements(limit: number) {
  const latestAgreementID = yield* call(Explore.getLatestAgreementID)
  const ids = Array.from({ length: limit }, () =>
    Math.floor(Math.random() * latestAgreementID)
  )
  const agreements: UserAgreement[] = yield* call(ColivingBackend.getAllAgreements, {
    offset: 0,
    limit,
    idsArray: ids,
    filterDeletes: true
  })
  yield* call(processAndCacheAgreements, agreements)
  return agreements
}
