import {
  OverflowAction,
  OverflowActionCallbacks
} from 'common/store/ui/mobile-overflow-menu/types'
import ActionSheetModal from 'components/action-drawer/ActionDrawer'

type MobileOverflowModalProps = {
  // Actions to show in the modal
  actions: OverflowAction[]
  // Extra callbacks to fire after a row/action is selected
  callbacks?: OverflowActionCallbacks
  isOpen: boolean
  onClose: () => void
  onRepost?: () => void
  onUnrepost?: () => void
  onFavorite?: () => void
  onUnfavorite?: () => void
  onShare?: () => void
  onAddToContentList?: () => void
  onEditContentList?: () => void
  onDeleteContentList?: () => void
  onPublishContentList?: () => void
  onVisitAgreementPage?: () => void
  onVisitArtistPage?: () => void
  onVisitCollectiblePage?: () => void
  onVisitCollectionPage?: () => void
  onUnsubscribeUser?: () => void
  onFollow?: () => void
  onUnfollow?: () => void
}

const rowMessageMap = {
  [OverflowAction.REPOST]: 'Repost',
  [OverflowAction.UNREPOST]: 'Unrepost',
  [OverflowAction.FAVORITE]: 'Favorite',
  [OverflowAction.UNFAVORITE]: 'Unfavorite',
  [OverflowAction.SHARE]: 'Share',
  [OverflowAction.ADD_TO_CONTENT_LIST]: 'Add To ContentList',
  [OverflowAction.EDIT_CONTENT_LIST]: 'Edit ContentList',
  [OverflowAction.DELETE_CONTENT_LIST]: 'Delete ContentList',
  [OverflowAction.PUBLISH_CONTENT_LIST]: 'Publish ContentList',
  [OverflowAction.VIEW_AGREEMENT_PAGE]: 'View Agreement Page',
  [OverflowAction.VIEW_ARTIST_PAGE]: 'View Artist Page',
  [OverflowAction.VIEW_CONTENT_LIST_PAGE]: 'View ContentList Page',
  [OverflowAction.VIEW_COLLECTIBLE_PAGE]: 'View Collectible Page',
  [OverflowAction.VIEW_ALBUM_PAGE]: 'View Album Page',
  [OverflowAction.UNSUBSCRIBER_USER]: 'Unsubscribe',
  [OverflowAction.FOLLOW_ARTIST]: 'Follow Artist',
  [OverflowAction.UNFOLLOW_ARTIST]: 'Unfollow Artist',
  [OverflowAction.FOLLOW]: 'Follow',
  [OverflowAction.UNFOLLOW]: 'Unfollow'
}

// A modal for displaying overflow options on mobile.
// Configurable by passing in an array of `OverflowActions`.
const MobileOverflowModal = ({
  actions,
  callbacks,
  isOpen,
  onClose,
  onRepost,
  onUnrepost,
  onFavorite,
  onUnfavorite,
  onShare,
  onAddToContentList,
  onEditContentList,
  onDeleteContentList,
  onPublishContentList,
  onVisitAgreementPage,
  onVisitArtistPage,
  onVisitCollectionPage,
  onVisitCollectiblePage,
  onUnsubscribeUser,
  onFollow,
  onUnfollow
}: MobileOverflowModalProps) => {
  // Mapping from rows to prop callbacks.
  const rowCallbacks = {
    [OverflowAction.REPOST]: onRepost,
    [OverflowAction.UNREPOST]: onUnrepost,
    [OverflowAction.FAVORITE]: onFavorite,
    [OverflowAction.UNFAVORITE]: onUnfavorite,
    [OverflowAction.SHARE]: onShare,
    [OverflowAction.ADD_TO_CONTENT_LIST]: onAddToContentList,
    [OverflowAction.EDIT_CONTENT_LIST]: onEditContentList,
    [OverflowAction.DELETE_CONTENT_LIST]: onDeleteContentList,
    [OverflowAction.PUBLISH_CONTENT_LIST]: onPublishContentList,
    [OverflowAction.VIEW_AGREEMENT_PAGE]: onVisitAgreementPage,
    [OverflowAction.VIEW_ARTIST_PAGE]: onVisitArtistPage,
    [OverflowAction.VIEW_COLLECTIBLE_PAGE]: onVisitCollectiblePage,
    [OverflowAction.VIEW_CONTENT_LIST_PAGE]: onVisitCollectionPage,
    [OverflowAction.VIEW_ALBUM_PAGE]: onVisitCollectionPage,
    [OverflowAction.UNSUBSCRIBER_USER]: onUnsubscribeUser,
    [OverflowAction.FOLLOW_ARTIST]: onFollow,
    [OverflowAction.UNFOLLOW_ARTIST]: onUnfollow,
    [OverflowAction.FOLLOW]: onFollow,
    [OverflowAction.UNFOLLOW]: onUnfollow
  }

  const didSelectRow = (index: number) => {
    const action = actions[index]
    const callback = rowCallbacks[action] || (() => {})
    if (callbacks && callbacks[action]) {
      callbacks[action]!()
    }
    // Eventually: will need some special casing for onAddToContentList, which returns
    // a function accepting contentListId
    callback()
    onClose()
  }

  return (
    <ActionSheetModal
      isOpen={isOpen}
      onClose={onClose}
      actions={actions ? actions.map((r) => ({ text: rowMessageMap[r] })) : []}
      didSelectRow={didSelectRow}
    />
  )
}

export default MobileOverflowModal
