import { Cache, Track } from '@coliving/common'

export interface TracksCacheState extends Cache<Track> {
  permalinks: { [permalink: string]: { id: number } }
}
