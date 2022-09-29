import { useContext } from 'react'

import { useNavigation } from 'app/hooks/useNavigation'

import type { AppTabScreenParamList } from '../appScreen'
import type { ProfileTabScreenParamList } from '../appScreen/profileTabScreen'

import { NotificationsDrawerNavigationContext } from './notificationsDrawerNavigationContext'

export const useDrawerNavigation = () => {
  const { drawerHelpers } = useContext(NotificationsDrawerNavigationContext)
  return useNavigation<AppTabScreenParamList & ProfileTabScreenParamList>({
    customNativeNavigation: drawerHelpers
  })
}
