import { TrendingScreen } from 'app/screens/trendingScreen'

import type { AppTabScreenParamList } from './appTabScreen'
import { createAppTabScreenStack } from './createAppTabScreenStack'

export type TrendingTabScreenParamList = AppTabScreenParamList & {
  Trending: undefined
}

export const TrendingTabScreen =
  createAppTabScreenStack<TrendingTabScreenParamList>((Stack) => (
    <Stack.Screen name='Trending' component={TrendingScreen} />
  ))
