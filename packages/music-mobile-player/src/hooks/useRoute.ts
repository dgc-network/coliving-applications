import type { RouteProp } from '@react-navigation/core'
import { useRoute as useRouteRN } from '@react-navigation/core'

import type { AppTabScreenParamList } from 'app/screens/appScreen'
import type { ProfileTabScreenParamList } from 'app/screens/appScreen/profileTabScreen'

export const useRoute = <RouteName extends keyof AppTabScreenParamList>() => {
  return useRouteRN<RouteProp<AppTabScreenParamList, RouteName>>()
}

export const useProfileRoute = <
  RouteName extends keyof ProfileTabScreenParamList
>() => {
  return useRouteRN<RouteProp<ProfileTabScreenParamList, RouteName>>()
}
