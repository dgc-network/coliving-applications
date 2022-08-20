import { SmartCollectionVariant } from 'models/SmartCollectionVariant'

export type ContentListIdentifier = {
  type: 'contentList'
  contentList_id: number
}

export type ExploreContentListIdentifier = {
  type: 'explore_contentList'
  contentList_id: SmartCollectionVariant
}

export type AudioNftContentListIdentifier = {
  type: 'live_nft_contentList'
  contentList_id: SmartCollectionVariant.LIVE_NFT_CONTENT_LIST
}

// Never written to backends
export type TempContentListIdentifier = {
  type: 'temp_contentList'
  contentList_id: string
}

export type ContentListLibraryIdentifier =
  | ContentListIdentifier
  | ExploreContentListIdentifier
  | AudioNftContentListIdentifier
  | TempContentListIdentifier

export type ContentListLibraryFolder = {
  id: string
  type: 'folder'
  name: string
  contents: (ContentListLibraryFolder | ContentListLibraryIdentifier)[]
}

export type ContentListLibrary = {
  contents: (ContentListLibraryFolder | ContentListLibraryIdentifier)[]
}
