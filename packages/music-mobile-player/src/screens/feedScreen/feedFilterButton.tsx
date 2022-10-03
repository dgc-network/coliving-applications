import { FeedFilter } from '@coliving/common'

import { messages } from 'app/components/feedFilterDrawer'
import { HeaderButton } from 'app/components/header'

const messageMap = {
  [FeedFilter.ALL]: messages.filterAll,
  [FeedFilter.ORIGINAL]: messages.filterOriginal,
  [FeedFilter.REPOST]: messages.filterReposts
}

// HeaderButton for filtering feed by All/Original/Repost
type FeedFilterButtonProps = {
  currentFilter: FeedFilter
  onPress: () => void
}

export const FeedFilterButton = ({
  currentFilter,
  onPress
}: FeedFilterButtonProps) => {
  return <HeaderButton onPress={onPress} title={messageMap[currentFilter]} />
}
