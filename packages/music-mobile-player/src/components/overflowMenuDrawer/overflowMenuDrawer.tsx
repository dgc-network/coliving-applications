import { getMobileOverflowModal } from '@coliving/web/src/common/store/ui/mobile-overflow-menu/selectors'
import {
  OverflowAction,
  OverflowSource
} from '@coliving/web/src/common/store/ui/mobile-overflow-menu/types'

import ActionDrawer from 'app/components/actionDrawer'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'

import CollectionOverflowMenuDrawer from './collectionOverflowMenuDrawer'
import ProfileOverflowMenuDrawer from './profileOverflowMenuDrawer'
import DigitalContentOverflowMenuDrawer from './DigitalContentOverflowMenuDrawer'

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
  [OverflowAction.VIEW_DIGITAL_CONTENT_PAGE]: 'View DigitalContent Page',
  [OverflowAction.VIEW_LANDLORD_PAGE]: 'View Author Page',
  [OverflowAction.VIEW_CONTENT_LIST_PAGE]: 'View ContentList Page',
  [OverflowAction.VIEW_ALBUM_PAGE]: 'View Album Page',
  [OverflowAction.UNSUBSCRIBER_USER]: 'Unsubscribe',
  [OverflowAction.FOLLOW_LANDLORD]: 'Follow Author',
  [OverflowAction.UNFOLLOW_LANDLORD]: 'Unfollow Author',
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
      [OverflowSource.DIGITAL_CONTENTS]: DigitalContentOverflowMenuDrawer,
      [OverflowSource.COLLECTIONS]: CollectionOverflowMenuDrawer,
      // No case for NOTIFICATIONS because there currently isn't an overflow menu on notifications
      [OverflowSource.PROFILE]: ProfileOverflowMenuDrawer
    }[source] ?? DigitalContentOverflowMenuDrawer

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
