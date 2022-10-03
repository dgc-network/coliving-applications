import { useEffect, useMemo } from 'react'

import { useIsFocused } from '@react-navigation/native'

import IconNote from 'app/assets/images/iconNote.svg'
import IconUser from 'app/assets/images/iconUser.svg'
import { Screen } from 'app/components/core'
import { Header } from 'app/components/header'
import { TabNavigator, tabScreen } from 'app/components/topTabBar'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useRoute } from 'app/hooks/useRoute'
import { MessageType } from 'app/message'

import { SearchFocusContext } from './searchFocusContext'
import { ProfilesTab } from './tabs/profilesTab'
import { AgreementsTab } from './tabs/AgreementsTab'

const messages = {
  header: 'Tag Search'
}

/**
 * Displays tag search results. Uses the same state as normal full search,
 * but only displays matching agreements & profiles.
 */
export const TagSearchScreen = () => {
  const isFocused = useIsFocused()
  const focusContext = useMemo(() => ({ isFocused }), [isFocused])
  const dispatchWeb = useDispatchWeb()
  const { params } = useRoute<'TagSearch'>()
  const { query } = params

  useEffect(() => {
    dispatchWeb({
      type: MessageType.UPDATE_SEARCH_QUERY,
      query
    })
  }, [dispatchWeb, query])

  const agreementsScreen = tabScreen({
    name: 'Agreements',
    Icon: IconNote,
    component: AgreementsTab
  })

  const profilesScreen = tabScreen({
    name: 'Profiles',
    Icon: IconUser,
    component: ProfilesTab
  })

  return (
    <Screen topbarRight={null}>
      <Header text={messages.header} />
      <SearchFocusContext.Provider value={focusContext}>
        <TabNavigator initialScreenName='Agreements'>
          {agreementsScreen}
          {profilesScreen}
        </TabNavigator>
      </SearchFocusContext.Provider>
    </Screen>
  )
}
