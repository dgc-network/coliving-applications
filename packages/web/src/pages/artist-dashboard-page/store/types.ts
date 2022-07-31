import { Status, Collection, Track } from '@coliving/common'

export default interface ArtistDashboardState {
  status: Status
  tracks: Track[]
  unlistedTracks: Track[]
  collections: Collection
  listenData: {
    all: {
      labels: string[]
      values: number[]
    }
    [id: number]: {
      labels: string[]
      values: number[]
    }
  }
}
