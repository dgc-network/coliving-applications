import { ID } from '@coliving/common'

export type CreatePlaylistModalState = {
  isOpen: boolean
  collectionId: ID | null
  hideFolderTab: boolean
}
