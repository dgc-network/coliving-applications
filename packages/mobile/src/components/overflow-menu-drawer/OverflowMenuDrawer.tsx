import { getMobileOverflowModal } from '-client/src/common/store/ui/mobile-overflow-menu/selectors'
import {
  OverflowAction,
  OverflowSource
} from '-client/src/common/store/ui/mobile-overflow-menu/types'

import ActionDrawer from 'app/components/action-drawer'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'

import CollectionOverflowMenuDrawer from './CollectionOverflowMenuDrawer'
import ProfileOverflowMenuDrawer from './ProfileOverflowMenuDrawer'
import AgreementOverflowMenuDrawer from './AgreementOverflowMenuDrawer'

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
  [OverflowAction.VIEW_LANDLORD_PAGE]: 'View Landlord Page',
  [OverflowAction.VIEW_CONTENT_LIST_PAGE]: 'View ContentList Page',
  [OverflowAction.VIEW_ALBUM_PAGE]: 'View Album Page',
  [OverflowAction.UNSUBSCRIBER_USER]: 'Unsubscribe',
  [OverflowAction.FOLLOW_LANDLORD]: 'Follow Landlord',
  [OverflowAction.UNFOLLOW_LANDLORD]: 'Unfollow Landlord',
  [OverflowAction.FOLLOW]: 'Follow',
  [OverflowAction.UNFOLLOW]: 'Unfollow'
}

export const OverflowMenuDrawer = () => {
  const overflowMenu = useSelectorWeb(getMobileOverflowModal)

  if (!overflowMenu?.id) {
    return <></>
  }

  const { source, overflowActions } = overflowMenu

  const OverflowDrawerComponent =
    {
      [OverflowSource.AGREEMENTS]: AgreementOverflowMenuDrawer,
      [OverflowSource.COLLECTIONS]: CollectionOverflowMenuDrawer,
      // No case for NOTIFICATIONS because there currently isn't an overflow menu on notifications
      [OverflowSource.PROFILE]: ProfileOverflowMenuDrawer
    }[source] ?? AgreementOverflowMenuDrawer

  return (
    <OverflowDrawerComponent
      render={(callbacks) => {
        const rows = (overflowActions ?? []).map((action) => ({
          text: rowMessageMap[action],
          callback: callbacks[action]
        }))
        return <ActionDrawer modalName='Overflow' rows={rows} />
      }}
    />
  )
}
