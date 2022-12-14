import { useCallback } from 'react'

import type { User, Nullable } from '@coliving/common'
import { NOTIFICATION_PAGE } from '@coliving/web/src/utils/route'

import { useNavigation } from 'app/hooks/useNavigation'
import { getUserRoute } from 'app/utils/routes'

export const useGoToProfile = (user: Nullable<User> | undefined) => {
  const navigation = useNavigation()

  const handlePress = useCallback(() => {
    if (!user) return
    navigation.navigate({
      native: {
        screen: 'Profile',
        params: { handle: user.handle, fromNotifications: true }
      },
      web: { route: getUserRoute(user), fromPage: NOTIFICATION_PAGE }
    })
  }, [user, navigation])

  return handlePress
}
