import { ID } from '@coliving/common'

export const createRemixOfMetadata = ({
  parentTrackId
}: {
  parentTrackId: ID
}) => {
  return {
    tracks: [
      {
        parent_track_id: parentTrackId
      }
    ]
  }
}
