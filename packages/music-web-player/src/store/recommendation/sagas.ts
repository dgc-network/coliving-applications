import { ID, UserDigitalContent, Nullable } from '@coliving/common'
import { call } from 'typed-redux-saga'

import { processAndCacheDigitalContents } from 'common/store/cache/digital_contents/utils'
import apiClient from 'services/colivingAPIClient/colivingAPIClient'

import ColivingBackend from '../../services/colivingBackend'
import Explore from '../../services/colivingBackend/explore'

export function* getRecommendedDigitalContents(
  genre: string,
  exclusionList: number[],
  currentUserId: Nullable<ID>
) {
  const digitalContents = yield* call([apiClient, apiClient.getRecommended], {
    genre,
    exclusionList,
    currentUserId
  })
  yield* call(processAndCacheDigitalContents, digitalContents)
  return digitalContents
}

export function* getLuckyDigitalContents(limit: number) {
  const latestDigitalContentID = yield* call(Explore.getLatestDigitalContentID)
  const ids = Array.from({ length: limit }, () =>
    Math.floor(Math.random() * latestDigitalContentID)
  )
  const digitalContents: UserDigitalContent[] = yield* call(ColivingBackend.getAllDigitalContents, {
    offset: 0,
    limit,
    idsArray: ids,
    filterDeletes: true
  })
  yield* call(processAndCacheDigitalContents, digitalContents)
  return digitalContents
}
