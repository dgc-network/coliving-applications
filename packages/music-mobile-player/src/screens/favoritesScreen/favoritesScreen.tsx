import IconAlbum from 'app/assets/images/iconAlbum.svg'
import IconNote from 'app/assets/images/iconNote.svg'
import IconContentLists from 'app/assets/images/iconContentLists.svg'
import { Screen } from 'app/components/core'
import { Header } from 'app/components/header'
import { TopTabNavigator } from 'app/components/topTabBar'
import { usePopToTopOnDrawerOpen } from 'app/hooks/usePopToTopOnDrawerOpen'

import { AlbumsTab } from './albumsTab'
import { ContentListsTab } from './ContentListsTab'
import { AgreementsTab } from './AgreementsTab'

const favoritesScreens = [
  {
    name: 'agreements',
    Icon: IconNote,
    component: AgreementsTab
  },
  {
    name: 'albums',
    Icon: IconAlbum,
    component: AlbumsTab
  },
  {
    name: 'contentLists',
    Icon: IconContentLists,
    component: ContentListsTab
  }
]

const FavoritesScreen = () => {
  usePopToTopOnDrawerOpen()

  return (
    <Screen>
      <Header text='Favorites' />
      <TopTabNavigator screens={favoritesScreens} />
    </Screen>
  )
}

export default FavoritesScreen
