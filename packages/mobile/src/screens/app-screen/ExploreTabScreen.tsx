import ExploreScreen from 'app/screens/explore-screen'
import {
  CHILL_CONTENT_LISTS,
  INTENSE_CONTENT_LISTS,
  INTIMATE_CONTENT_LISTS,
  PROVOKING_CONTENT_LISTS,
  UPBEAT_CONTENT_LISTS
} from 'app/screens/explore-screen/collections'
import {
  BEST_NEW_RELEASES,
  FEELING_LUCKY,
  HEAVY_ROTATION,
  MOST_LOVED,
  REMIXABLES,
  UNDER_THE_RADAR
} from 'app/screens/explore-screen/smartCollections'
import {
  LetThemDJScreen,
  TopAlbumsScreen,
  TrendingContentListsScreen,
  TrendingUndergroundScreen
} from 'app/screens/explore-screen/tabs/ForYouTab'
import { MoodCollectionScreen } from 'app/screens/mood-collection-screen/MoodCollectionScreen'
import { SmartCollectionScreen } from 'app/screens/smart-collection-screen/SmartCollectionScreen'

import type { AppTabScreenParamList } from './AppTabScreen'
import { createAppTabScreenStack } from './createAppTabScreenStack'

export type ExploreTabScreenParamList = AppTabScreenParamList & {
  Explore: undefined
  // Smart Collection Screens
  UnderTheRadar: undefined
  MostLoved: undefined
  FeelingLucky: undefined
  HeavyRotation: undefined
  BestNewReleases: undefined
  Remixables: undefined
  // Collection Screens
  TrendingUnderground: undefined
  LetThemDJ: undefined
  TopAlbums: undefined
  TrendingContentLists: undefined
  // Mood Screens
  ChillContentLists: undefined
  IntenseContentLists: undefined
  IntimateContentLists: undefined
  UpbeatContentLists: undefined
  ProvokingContentLists: undefined
}

const moodCollections = [
  CHILL_CONTENT_LISTS,
  INTENSE_CONTENT_LISTS,
  INTIMATE_CONTENT_LISTS,
  PROVOKING_CONTENT_LISTS,
  UPBEAT_CONTENT_LISTS
]

const smartCollections = [
  UNDER_THE_RADAR,
  BEST_NEW_RELEASES,
  REMIXABLES,
  MOST_LOVED,
  FEELING_LUCKY,
  HEAVY_ROTATION
]

export const ExploreTabScreen =
  createAppTabScreenStack<ExploreTabScreenParamList>((Stack) => (
    <>
      <Stack.Screen name='Explore' component={ExploreScreen} />
      <Stack.Screen name='LetThemDJ' component={LetThemDJScreen} />
      <Stack.Screen name='TopAlbums' component={TopAlbumsScreen} />
      <Stack.Screen
        name='TrendingContentLists'
        component={TrendingContentListsScreen}
      />
      <Stack.Screen
        name='TrendingUnderground'
        component={TrendingUndergroundScreen}
      />
      {smartCollections.map((collection) => (
        <Stack.Screen name={collection.screen} key={collection.screen}>
          {() => <SmartCollectionScreen smartCollection={collection} />}
        </Stack.Screen>
      ))}
      {moodCollections.map((collection) => (
        <Stack.Screen name={collection.screen} key={collection.screen}>
          {() => <MoodCollectionScreen collection={collection} />}
        </Stack.Screen>
      ))}
    </>
  ))
