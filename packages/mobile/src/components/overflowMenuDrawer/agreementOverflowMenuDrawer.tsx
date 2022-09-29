import type { ID } from '@coliving/common'
import {
  FavoriteSource,
  FollowSource,
  RepostSource,
  ShareSource
} from '@coliving/common'
import type { CommonState } from '@coliving/web/src/common/store'
import { getAgreement } from '@coliving/web/src/common/store/cache/agreements/selectors'
import { getUser } from '@coliving/web/src/common/store/cache/users/selectors'
// Importing directly from -client for now, this will be removed
// when the profile page is implemented in RN
import {
  repostAgreement,
  undoRepostAgreement,
  saveAgreement,
  unsaveAgreement,
  shareAgreement
} from '@coliving/web/src/common/store/social/agreements/actions'
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

const AgreementOverflowMenuDrawer = ({ render }: Props) => {
  const { onClose: closeNowPlayingDrawer } = useDrawer('NowPlaying')
  const navigation = useNavigation()
  const dispatchWeb = useDispatchWeb()
  const { id: modalId } = useSelectorWeb(getMobileOverflowModal)
  const id = modalId as ID

  const agreement = useSelectorWeb((state: CommonState) => getAgreement(state, { id }))

  const user = useSelectorWeb((state: CommonState) =>
    getUser(state, { id: agreement?.owner_id })
  )

  if (!agreement || !user) {
    return null
  }
  const { owner_id, title, permalink } = agreement
  const { handle } = user

  if (!id || !owner_id || !handle || !title) {
    return null
  }

  const callbacks = {
    [OverflowAction.REPOST]: () =>
      dispatchWeb(repostAgreement(id, RepostSource.OVERFLOW)),
    [OverflowAction.UNREPOST]: () =>
      dispatchWeb(undoRepostAgreement(id, RepostSource.OVERFLOW)),
    [OverflowAction.FAVORITE]: () =>
      dispatchWeb(saveAgreement(id, FavoriteSource.OVERFLOW)),
    [OverflowAction.UNFAVORITE]: () =>
      dispatchWeb(unsaveAgreement(id, FavoriteSource.OVERFLOW)),
    [OverflowAction.SHARE]: () =>
      dispatchWeb(shareAgreement(id, ShareSource.OVERFLOW)),
    [OverflowAction.ADD_TO_CONTENT_LIST]: () =>
      dispatchWeb(openAddToContentListModal(id, title)),
    [OverflowAction.VIEW_AGREEMENT_PAGE]: () => {
      closeNowPlayingDrawer()
      navigation.navigate({
        native: { screen: 'Agreement', params: { id } },
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

export default AgreementOverflowMenuDrawer
