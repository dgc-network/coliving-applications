import { ID, UserTrack, Nullable } from '@coliving/common'
import { call } from 'typed-redux-saga'

import { processAndCacheTracks } from 'common/store/cache/tracks/utils'
import apiClient from 'services/coliving-api-client/ColivingAPIClient'

import ColivingBackend from '../../services/ColivingBackend'
import Explore from '../../services/coliving-backend/Explore'

export function* getRecommendedTracks(
  genre: string,
  exclusionList: number[],
  currentUserId: Nullable<ID>
) {
  const tracks = yield* call([apiClient, apiClient.getRecommended], {
    genre,
    exclusionList,
    currentUserId
  })
  yield* call(processAndCacheTracks, tracks)
  return tracks
}

export function* getLuckyTracks(limit: number) {
  const latestTrackID = yield* call(Explore.getLatestTrackID)
  const ids = Array.from({ length: limit }, () =>
    Math.floor(Math.random() * latestTrackID)
  )
  const tracks: UserTrack[] = yield* call(ColivingBackend.getAllTracks, {
    offset: 0,
    limit,
    idsArray: ids,
    filterDeletes: true
  })
  yield* call(processAndCacheTracks, tracks)
  return tracks
}
