import { UserCollectionMetadata, UserTrackMetadata } from '@coliving/common'

import { processAndCacheTracks } from 'common/store/cache/tracks/utils'

export function* addTracksFromCollections(
  metadataArray: Array<UserCollectionMetadata>
) {
  const tracks: UserTrackMetadata[] = []

  metadataArray.forEach((m) => {
    if (m.tracks) {
      m.tracks.forEach((t) => {
        tracks.push(t)
      })
    }
  })
  yield processAndCacheTracks(tracks)
}
