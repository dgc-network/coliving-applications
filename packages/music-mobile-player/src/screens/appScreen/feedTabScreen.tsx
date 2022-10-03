import { FeedScreen } from 'app/screens/feedScreen'

import type { AppTabScreenParamList } from './appTabScreen'
import { createAppTabScreenStack } from './createAppTabScreenStack'

export type FeedTabScreenParamList = AppTabScreenParamList & {
  Feed: undefined
}

export const FeedTabScreen = createAppTabScreenStack<FeedTabScreenParamList>(
  (Stack) => <Stack.Screen name='Feed' component={FeedScreen} />
)
