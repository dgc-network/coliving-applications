import { SmartCollectionVariant } from 'models/smartCollectionVariant'

export type ContentListIdentifier = {
  type: 'contentList'
  content_list_id: number
}

export type ExploreContentListIdentifier = {
  type: 'explore_content_list'
  content_list_id: SmartCollectionVariant
}

export type LiveNftContentListIdentifier = {
  type: 'live_nft_content_list'
  content_list_id: SmartCollectionVariant.LIVE_NFT_CONTENT_LIST
}

// Never written to backends
export type TempContentListIdentifier = {
  type: 'temp_content_list'
  content_list_id: string
}

export type ContentListLibraryIdentifier =
  | ContentListIdentifier
  | ExploreContentListIdentifier
  | LiveNftContentListIdentifier
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
