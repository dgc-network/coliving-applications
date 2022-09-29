import { useCallback } from 'react'

import { setSupporting } from '@coliving/web/src/common/store/user-list/supporting/actions'
import { getUserList } from '@coliving/web/src/common/store/user-list/supporting/selectors'

import IconTip from 'app/assets/images/iconTip.svg'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useRoute } from 'app/hooks/useRoute'

import { UserList } from './userList'
import { UserListScreen } from './userListScreen'

const messages = {
  title: 'Supporting'
}

export const SupportingUsersScreen = () => {
  const { params } = useRoute<'SupportingUsers'>()
  const { userId } = params
  const dispatchWeb = useDispatchWeb()

  const handleSetSupporting = useCallback(() => {
    dispatchWeb(setSupporting(userId))
  }, [dispatchWeb, userId])

  return (
    <UserListScreen title={messages.title} titleIcon={IconTip}>
      <UserList
        userSelector={getUserList}
        tag='SUPPORTING'
        setUserList={handleSetSupporting}
      />
    </UserListScreen>
  )
}
