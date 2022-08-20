import type { ID, Nullable } from '@/common'
import type { getAgreements } from 'common/store/ui/createPlaylistModal/selectors'

export type Image = {
  height?: number
  width?: number
  name?: string
  size?: number
  fileType?: string
  url: string
  file?: string
}

export type PlaylistValues = {
  content list_name: string
  description: Nullable<string>
  artwork: Image
  agreements: ReturnType<typeof getAgreements>
  agreement_ids: {
    time: number
    agreement: ID
  }[]
  removedAgreements: { agreementId: ID; timestamp: number }[]
}

export type UpdatedPlaylist = Omit<PlaylistValues, 'cover_art'> & {
  updatedCoverArt?: Image
}
