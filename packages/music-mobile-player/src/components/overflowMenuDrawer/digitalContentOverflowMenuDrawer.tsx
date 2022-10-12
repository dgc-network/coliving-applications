import type { ID } from '@coliving/common'
import {
  FavoriteSource,
  FollowSource,
  RepostSource,
  ShareSource
} from '@coliving/common'
import type { CommonState } from '@coliving/web/src/common/store'
import { getDigitalContent } from '@coliving/web/src/common/store/cache/digital_contents/selectors'
import { getUser } from '@coliving/web/src/common/store/cache/users/selectors'
// Importing directly from -client for now, this will be removed
// when the profile page is implemented in RN
import {
  repostDigitalContent,
  undoRepostDigitalContent,
  saveDigitalContent,
  unsaveDigitalContent,
  shareDigitalContent
} from '@coliving/web/src/common/store/social/digital_contents/actions'
import {
  followUser,
  unfollowUser
} from '@coliving/web/src/common/store/social/users/actions'
import { requestOpen as openAddToContentListModal } from '@coliving/web/src/common/store/ui/add-to-content-list/actions'
import { getMobileOverflowModal } from '@coliving/web/src/common/store/ui/mobile-overflow-menu/selectors'
import type { OverflowActionCallbacks } from '@coliving/web/src/common/store/ui/mobile-overflow-menu/types'
import { OverflowAction } from '@coliving/web/src/common/store/ui/mobile-overflow-menu/types'
import { profilePage } from '@coliving/web/src/utils/route'

import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useDrawer } from 'app/hooks/useDrawer'
import { useNavigation } from 'app/hooks/useNavigation'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'

type Props = {
  render: (callbacks: OverflowActionCallbacks) => JSX.Element
}

const DigitalContentOverflowMenuDrawer = ({ render }: Props) => {
  const { onClose: closeNowPlayingDrawer } = useDrawer('NowPlaying')
  const navigation = useNavigation()
  const dispatchWeb = useDispatchWeb()
  const { id: modalId } = useSelectorWeb(getMobileOverflowModal)
  const id = modalId as ID

  const digital_content = useSelectorWeb((state: CommonState) => getDigitalContent(state, { id }))

  const user = useSelectorWeb((state: CommonState) =>
    getUser(state, { id: digital_content?.owner_id })
  )

  if (!digital_content || !user) {
    return null
  }
  const { owner_id, title, permalink } = digital_content
  const { handle } = user

  if (!id || !owner_id || !handle || !title) {
    return null
  }

  const callbacks = {
    [OverflowAction.REPOST]: () =>
      dispatchWeb(repostDigitalContent(id, RepostSource.OVERFLOW)),
    [OverflowAction.UNREPOST]: () =>
      dispatchWeb(undoRepostDigitalContent(id, RepostSource.OVERFLOW)),
    [OverflowAction.FAVORITE]: () =>
      dispatchWeb(saveDigitalContent(id, FavoriteSource.OVERFLOW)),
    [OverflowAction.UNFAVORITE]: () =>
      dispatchWeb(unsaveDigitalContent(id, FavoriteSource.OVERFLOW)),
    [OverflowAction.SHARE]: () =>
      dispatchWeb(shareDigitalContent(id, ShareSource.OVERFLOW)),
    [OverflowAction.ADD_TO_CONTENT_LIST]: () =>
      dispatchWeb(openAddToContentListModal(id, title)),
    [OverflowAction.VIEW_AGREEMENT_PAGE]: () => {
      closeNowPlayingDrawer()
      navigation.navigate({
        native: { screen: 'DigitalContent', params: { id } },
        web: { route: permalink }
      })
    },
    [OverflowAction.VIEW_LANDLORD_PAGE]: () => {
      closeNowPlayingDrawer()
      navigation.navigate({
        native: { screen: 'Profile', params: { handle } },
        web: { route: profilePage(handle) }
      })
    },
    [OverflowAction.FOLLOW_LANDLORD]: () =>
      dispatchWeb(followUser(owner_id, FollowSource.OVERFLOW)),
    [OverflowAction.UNFOLLOW_LANDLORD]: () =>
      dispatchWeb(unfollowUser(owner_id, FollowSource.OVERFLOW))
  }

  return render(callbacks)
}

export default DigitalContentOverflowMenuDrawer
