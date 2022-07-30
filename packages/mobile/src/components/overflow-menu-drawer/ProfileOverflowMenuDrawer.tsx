import type { ID } from '@/common'
import { FollowSource, ShareSource } from '@/common'
import type { CommonState } from '-client/src/common/store'
import { getUser } from '-client/src/common/store/cache/users/selectors'
import {
  followUser,
  unfollowUser,
  shareUser
} from '-client/src/common/store/social/users/actions'
import { getMobileOverflowModal } from '-client/src/common/store/ui/mobile-overflow-menu/selectors'
import type { OverflowActionCallbacks } from '-client/src/common/store/ui/mobile-overflow-menu/types'
import { OverflowAction } from '-client/src/common/store/ui/mobile-overflow-menu/types'

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
