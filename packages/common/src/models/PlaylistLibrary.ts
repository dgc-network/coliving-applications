import { SmartCollectionVariant } from 'models/SmartCollectionVariant'

export type PlaylistIdentifier = {
  type: 'content list'
  content list_id: number
}

export type ExplorePlaylistIdentifier = {
  type: 'explore_content list'
  content list_id: SmartCollectionVariant
}

export type AudioNftPlaylistIdentifier = {
  type: 'live_nft_content list'
  content list_id: SmartCollectionVariant.LIVE_NFT_CONTENT_LIST
}

// Never written to backends
export type TempPlaylistIdentifier = {
  type: 'temp_content list'
  content list_id: string
}

export type PlaylistLibraryIdentifier =
  | PlaylistIdentifier
  | ExplorePlaylistIdentifier
  | AudioNftPlaylistIdentifier
  | TempPlaylistIdentifier

export type PlaylistLibraryFolder = {
  id: string
  type: 'folder'
  name: string
  contents: (PlaylistLibraryFolder | PlaylistLibraryIdentifier)[]
}

export type PlaylistLibrary = {
  contents: (PlaylistLibraryFolder | PlaylistLibraryIdentifier)[]
}
