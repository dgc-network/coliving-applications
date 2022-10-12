import { useMemo } from 'react'

import { useIsFocused } from '@react-navigation/native'

import IconAlbum from 'app/assets/images/iconAlbum.svg'
import IconNote from 'app/assets/images/iconNote.svg'
import IconContentLists from 'app/assets/images/iconContentLists.svg'
import IconUser from 'app/assets/images/iconUser.svg'
import { Screen } from 'app/components/core'
import { Header } from 'app/components/header'
import {
  TabNavigator,
  tabScreen
} from 'app/components/topTabBar/topTabNavigator'

import { SearchFocusContext } from './searchFocusContext'
import { AlbumsTab } from './tabs/albumsTab'
import { ContentListsTab } from './tabs/ContentListsTab'
import { ProfilesTab } from './tabs/profilesTab'
import { DigitalContentsTab } from './tabs/DigitalContentsTab'

const messages = {
  header: 'More Results'
}

export const SearchResultsScreen = () => {
  const isFocused = useIsFocused()
  const focusContext = useMemo(() => ({ isFocused }), [isFocused])

  const profilesScreen = tabScreen({
    name: 'Profiles',
    Icon: IconUser,
    component: ProfilesTab
  })

  const digitalContentsScreen = tabScreen({
    name: 'DigitalContents',
    Icon: IconNote,
    component: DigitalContentsTab
  })

  const albumsScreen = tabScreen({
    name: 'Albums',
    Icon: IconAlbum,
    component: AlbumsTab
  })

  const contentListsScreen = tabScreen({
    name: 'ContentLists',
    Icon: IconContentLists,
    component: ContentListsTab
  })

  return (
    <Screen topbarRight={null}>
      <Header text={messages.header} />
      <SearchFocusContext.Provider value={focusContext}>
        <TabNavigator initialScreenName='Profiles'>
          {profilesScreen}
          {digitalContentsScreen}
          {albumsScreen}
          {contentListsScreen}
        </TabNavigator>
      </SearchFocusContext.Provider>
    </Screen>
  )
}
