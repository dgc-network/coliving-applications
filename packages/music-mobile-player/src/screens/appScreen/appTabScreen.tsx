import { useContext, useEffect } from 'react'

import type { ID, FavoriteType } from '@coliving/common'
import type { EventArg, NavigationState } from '@react-navigation/native'
import type { createNativeStackNavigator } from '@react-navigation/native-stack'
import type { NotificationType } from '@coliving/web/src/common/store/notifications/types'
import type { RepostType } from '@coliving/web/src/common/store/user-list/reposts/types'
import { MessageType } from '@coliving/web/src/services/native-mobile-interface/types'

import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useDrawer } from 'app/hooks/useDrawer'
import type { ContextualParams } from 'app/hooks/useNavigation'
import { CollectionScreen } from 'app/screens/collectionScreen/collectionScreen'
import { ProfileScreen } from 'app/screens/profileScreen'
import {
  SearchResultsScreen,
  TagSearchScreen
} from 'app/screens/searchResultsScreen'
import { SearchScreen } from 'app/screens/searchScreen'
import { DigitalContentScreen } from 'app/screens/digitalContentScreen'
import {
  FavoritedScreen,
  FollowersScreen,
  FollowingScreen,
  RepostsScreen,
  NotificationUsersScreen,
  MutualsScreen,
  TopSupportersScreen,
  SupportingUsersScreen
} from 'app/screens/userListScreen'
import type { SearchContentList, SearchDigitalContent } from 'app/store/search/types'

import { EditContentListScreen } from '../edit-content-list-screen/EditContentListScreen'
import { NotificationsDrawerNavigationContext } from '../notificationsScreen/notificationsDrawerNavigationContext'
import { TipLandlordModal } from '../tipAuthorScreen'
import { DigitalContentRemixesScreen } from '../digitalContentScreen/digitalContentRemixesScreen'

import { useAppScreenOptions } from './useAppScreenOptions'

export type AppTabScreenParamList = {
  DigitalContent: { id: ID; searchDigitalContent?: SearchDigitalContent }
  DigitalContentRemixes: { id: ID }
  Profile: { handle: string }
  Collection: { id: ID; searchCollection?: SearchContentList }
  EditContentList: { id: ID }
  Favorited: { id: ID; favoriteType: FavoriteType }
  Reposts: { id: ID; repostType: RepostType }
  Followers: { userId: ID }
  Following: { userId: ID }
  Mutuals: { userId: ID }
  Search: undefined
  SearchResults: { query: string }
  SupportingUsers: { userId: ID }
  TagSearch: { query: string }
  TopSupporters: { userId: ID; source: 'profile' | 'feed' }
  NotificationUsers: {
    id: string // uuid
    notificationType: NotificationType
    count: number
  }
  TipLandlord: undefined
}

const forFade = ({ current }) => ({
  cardStyle: {
    opacity: current.progress
  }
})

type NavigationStateEvent = EventArg<
  'state',
  false,
  { state: NavigationState<AppTabScreenParamList> }
>

type AppTabScreenProps = {
  baseScreen: (
    Stack: ReturnType<typeof createNativeStackNavigator>
  ) => React.ReactNode
  Stack: ReturnType<typeof createNativeStackNavigator>
}

/**
 * This is the base tab screen that includes common screens
 * like digital_content and profile
 */
export const AppTabScreen = ({ baseScreen, Stack }: AppTabScreenProps) => {
  const dispatchWeb = useDispatchWeb()
  const screenOptions = useAppScreenOptions()
  const { drawerNavigation } = useContext(NotificationsDrawerNavigationContext)
  const { isOpen: isNowPlayingDrawerOpen } = useDrawer('NowPlaying')

  useEffect(() => {
    drawerNavigation?.setOptions({ swipeEnabled: !isNowPlayingDrawerOpen })
  }, [drawerNavigation, isNowPlayingDrawerOpen])

  return (
    <Stack.Navigator
      screenOptions={screenOptions}
      screenListeners={{
        state: (e: NavigationStateEvent) => {
          const stackRoutes = e?.data?.state?.routes
          const isStackOpen = stackRoutes.length > 1
          if (isStackOpen) {
            const isFromNotifs =
              stackRoutes.length === 2 &&
              (stackRoutes[1].params as ContextualParams)?.fromNotifications

            // If coming from notifs allow swipe to open notifs drawer
            drawerNavigation?.setOptions({ swipeEnabled: !!isFromNotifs })
          } else {
            // If on the first tab (or the first stack screen isn't a tab navigator),
            // enable the drawer
            const isOnFirstTab = !e?.data?.state.routes[0].state?.index
            drawerNavigation?.setOptions({
              swipeEnabled: isOnFirstTab
            })
          }
        },
        beforeRemove: (e) => {
          // hack for now to prevent pop for some pages
          if (
            !e.target?.includes('EditProfile') &&
            !e.target?.includes('EditContentList') &&
            !e.target?.includes('CreateContentList') &&
            !(
              e.target?.includes('Search') &&
              !e.target?.includes('SearchResults')
            ) &&
            !e.target?.includes('TipLandlord') &&
            !e.target?.includes('TopSupporters') &&
            !e.target?.includes('SupportingUsers')
          ) {
            // When a screen is removed, notify the web layer to pop navigation
            dispatchWeb({
              type: MessageType.POP_ROUTE
            })
          }
        }
      }}
    >
      {baseScreen(Stack)}
      <Stack.Screen
        name='DigitalContent'
        component={DigitalContentScreen}
        options={screenOptions}
      />
      <Stack.Screen
        name='DigitalContentRemixes'
        component={DigitalContentRemixesScreen}
        options={screenOptions}
      />
      <Stack.Screen
        name='Collection'
        component={CollectionScreen}
        options={screenOptions}
      />
      <Stack.Screen
        name='EditContentList'
        component={EditContentListScreen}
        options={screenOptions}
      />
      <Stack.Screen
        name='Profile'
        component={ProfileScreen}
        options={screenOptions}
      />
      <Stack.Group>
        <Stack.Screen
          name='Search'
          component={SearchScreen}
          options={(props) => ({
            ...screenOptions(props),
            cardStyleInterpolator: forFade
          })}
        />
        <Stack.Screen
          name='SearchResults'
          component={SearchResultsScreen}
          options={screenOptions}
        />
        <Stack.Screen
          name='TagSearch'
          component={TagSearchScreen}
          options={screenOptions}
        />
      </Stack.Group>
      <Stack.Group>
        <Stack.Screen
          name='Followers'
          component={FollowersScreen}
          options={screenOptions}
        />
        <Stack.Screen
          name='Following'
          component={FollowingScreen}
          options={screenOptions}
        />
        <Stack.Screen
          name='Favorited'
          component={FavoritedScreen}
          options={screenOptions}
        />
        <Stack.Screen
          name='Mutuals'
          component={MutualsScreen}
          options={screenOptions}
        />
        <Stack.Screen
          name='NotificationUsers'
          component={NotificationUsersScreen}
          options={screenOptions}
        />
      </Stack.Group>
      <Stack.Screen
        name='Reposts'
        component={RepostsScreen}
        options={screenOptions}
      />
      <Stack.Screen
        name='TipLandlord'
        component={TipLandlordModal}
        options={{
          headerShown: false,
          presentation: 'fullScreenModal'
        }}
      />
      <Stack.Screen
        name='TopSupporters'
        component={TopSupportersScreen}
        options={screenOptions}
      />
      <Stack.Screen
        name='SupportingUsers'
        component={SupportingUsersScreen}
        options={screenOptions}
      />
    </Stack.Navigator>
  )
}
