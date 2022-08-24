import { CreateContentListScreen } from 'app/screens/edit-content-list-screen'
import FavoritesScreen from 'app/screens/favorites-screen'

import type { AppTabScreenParamList } from './AppTabScreen'
import { createAppTabScreenStack } from './createAppTabScreenStack'

export type FavoritesTabScreenParamList = AppTabScreenParamList & {
  Favorites: undefined
  CreateContentList: undefined
}

export const FavoritesTabScreen =
  createAppTabScreenStack<FavoritesTabScreenParamList>((Stack) => (
    <>
      <Stack.Screen name='Favorites' component={FavoritesScreen} />
      <Stack.Screen name='CreateContentList' component={CreateContentListScreen} />
    </>
  ))
