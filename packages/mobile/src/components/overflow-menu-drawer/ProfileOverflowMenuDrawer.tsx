import type { ID } from '@coliving/common'
import { FollowSource, ShareSource } from '@coliving/common'
import type { CommonState } from '@coliving/web/src/common/store'
import { getUser } from '@coliving/web/src/common/store/cache/users/selectors'
import {
  followUser,
  unfollowUser,
  shareUser
} from '@coliving/web/src/common/store/social/users/actions'
import { getMobileOverflowModal } from '@coliving/web/src/common/store/ui/mobile-overflow-menu/selectors'
import type { OverflowActionCallbacks } from '@coliving/web/src/common/store/ui/mobile-overflow-menu/types'
import { OverflowAction } from '@coliving/web/src/common/store/ui/mobile-overflow-menu/types'

import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'

type Props = {
  render: (callbacks: OverflowActionCallbacks) => React.ReactNode
}

const ProfileOverflowMenuDrawer = ({ render }: Props) => {
  const dispatchWeb = useDispatchWeb()
  const { id: modalId } = useSelectorWeb(getMobileOverflowModal)
  const id = modalId as ID
  const user = useSelectorWeb((state: CommonState) => getUser(state, { id }))

  if (!user) {
    return null
  }
  const { handle, name } = user

  if (!id || !handle || !name) {
    return null
  }

  const callbacks = {
    [OverflowAction.FOLLOW]: () =>
      dispatchWeb(followUser(id, FollowSource.OVERFLOW)),
    [OverflowAction.UNFOLLOW]: () =>
      dispatchWeb(unfollowUser(id, FollowSource.OVERFLOW)),
    [OverflowAction.SHARE]: () =>
      dispatchWeb(shareUser(id, ShareSource.OVERFLOW))
  }

  return render(callbacks)
}

export default ProfileOverflowMenuDrawer
