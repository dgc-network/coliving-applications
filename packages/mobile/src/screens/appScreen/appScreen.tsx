import { useEffect } from 'react'

import { useAppState } from '@react-native-community/hooks'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import type { NavigatorScreenParams } from '@react-navigation/native'
import { getBalance } from '@coliving/web/src/common/store/wallet/slice'

import { useDispatchWeb } from 'app/hooks/useDispatchWeb'

import { AppTabBar } from './appTabBar'
import type { ExploreTabScreenParamList } from './exploreTabScreen'
import { ExploreTabScreen } from './exploreTabScreen'
import type { FavoritesTabScreenParamList } from './favoritesTabScreen'
import { FavoritesTabScreen } from './favoritesTabScreen'
import type { FeedTabScreenParamList } from './feedTabScreen'
import { FeedTabScreen } from './feedTabScreen'
import type { ProfileTabScreenParamList } from './profileTabScreen'
import { ProfileTabScreen } from './profileTabScreen'
import type { TrendingTabScreenParamList } from './trendingTabScreen'
import { TrendingTabScreen } from './trendingTabScreen'

export type AppScreenParamList = {
  feed: NavigatorScreenParams<FeedTabScreenParamList>
  trending: NavigatorScreenParams<TrendingTabScreenParamList>
  explore: NavigatorScreenParams<ExploreTabScreenParamList>
  favorites: NavigatorScreenParams<FavoritesTabScreenParamList>
  profile: NavigatorScreenParams<ProfileTabScreenParamList>
}

const Tab = createBottomTabNavigator()

export const AppScreen = () => {
  const dispatchWeb = useDispatchWeb()
  const appState = useAppState()

  useEffect(() => {
    if (appState === 'active') {
      dispatchWeb(getBalance())
    }
  }, [appState, dispatchWeb])

  return (
    <Tab.Navigator
      tabBar={(props) => <AppTabBar {...props} />}
      screenOptions={{ headerShown: false, unmountOnBlur: true }}
    >
      <Tab.Screen name='feed' component={FeedTabScreen} />
      <Tab.Screen name='trending' component={TrendingTabScreen} />
      <Tab.Screen name='explore' component={ExploreTabScreen} />
      <Tab.Screen name='favorites' component={FavoritesTabScreen} />
      <Tab.Screen name='profile' component={ProfileTabScreen} />
    </Tab.Navigator>
  )
}
