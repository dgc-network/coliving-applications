import { AudioScreen } from 'app/screens/digitalcoinScreen'
import { EditProfileScreen } from 'app/screens/editProfileScreen'
import { ProfileScreen } from 'app/screens/profileScreen'
import {
  AboutScreen,
  AccountSettingsScreen,
  AccountVerificationScreen,
  ChangePasswordScreen,
  ListeningHistoryScreen,
  NotificationSettingsScreen,
  SettingsScreen
} from 'app/screens/settingsScreen'

import type { AppTabScreenParamList } from './appTabScreen'
import { createAppTabScreenStack } from './createAppTabScreenStack'

export type ProfileTabScreenParamList = AppTabScreenParamList & {
  UserProfile: undefined
  EditProfile: undefined
  SettingsScreen: undefined
  AboutScreen: undefined
  ListeningHistoryScreen: undefined
  AccountSettingsScreen: undefined
  AccountVerificationScreen: undefined
  ChangePasswordScreen: undefined
  NotificationSettingsScreen: undefined
  AudioScreen: Record<string, unknown>
}

export const ProfileTabScreen =
  createAppTabScreenStack<ProfileTabScreenParamList>((Stack) => (
    <>
      <Stack.Screen
        name='UserProfile'
        component={ProfileScreen}
        initialParams={{ handle: 'accountUser' }}
      />
      <Stack.Screen name='EditProfile' component={EditProfileScreen} />
      <Stack.Screen name='SettingsScreen' component={SettingsScreen} />
      <Stack.Screen name='AboutScreen' component={AboutScreen} />
      <Stack.Screen
        name='ListeningHistoryScreen'
        component={ListeningHistoryScreen}
      />
      <Stack.Screen
        name='AccountSettingsScreen'
        component={AccountSettingsScreen}
      />
      <Stack.Screen
        name='NotificationSettingsScreen'
        component={NotificationSettingsScreen}
      />
      <Stack.Screen name='AudioScreen' component={AudioScreen} />
      <Stack.Screen
        name='AccountVerificationScreen'
        component={AccountVerificationScreen}
      />
      <Stack.Screen
        name='ChangePasswordScreen'
        component={ChangePasswordScreen}
      />
    </>
  ))
