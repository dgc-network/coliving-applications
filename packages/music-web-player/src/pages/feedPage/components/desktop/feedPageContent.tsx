import { Name, FeedFilter } from '@coliving/common'

import { feedActions } from 'common/store/pages/feed/lineup/actions'
import Header from 'components/header/desktop/header'
import EndOfLineup from 'components/lineup/endOfLineup'
import Lineup from 'components/lineup/lineup'
import {
  getLoadMoreDigitalContentCount,
  INITIAL_LOAD_DIGITAL_CONTENTS_MULTIPLIER
} from 'components/lineup/lineupProvider'
import { LineupVariant } from 'components/lineup/types'
import Page from 'components/page/page'
import EmptyFeed from 'pages/feedPage/components/emptyFeed'
import { FeedPageContentProps } from 'pages/feedPage/types'
import { make, useRecord } from 'store/analytics/actions'

import FeedFilters from './feedFilters'

const initialFilters = [FeedFilter.ALL, FeedFilter.ORIGINAL, FeedFilter.REPOST]

const messages = {
  feedHeaderTitle: 'Your Feed'
}

const FeedPageContent = ({
  feedTitle,
  feedDescription,
  feedIsMain,
  feed,
  fetchSuggestedFollowUsers,
  followUsers,
  suggestedFollows,
  hasAccount,
  goToTrending,
  goToSignUp,
  setFeedInView,
  loadMoreFeed,
  playFeedDigitalContent,
  pauseFeedDigitalContent,
  getLineupProps,
  feedFilter,
  setFeedFilter,
  resetFeedLineup
}: FeedPageContentProps) => {
  const mainLineupProps = {
    variant: LineupVariant.MAIN
  }

  const feedLineupProps = {
    ...getLineupProps(feed),
    setInView: setFeedInView,
    loadMore: loadMoreFeed,
    playDigitalContent: playFeedDigitalContent,
    pauseDigitalContent: pauseFeedDigitalContent,
    delineate: feedIsMain,
    actions: feedActions
  }
  const record = useRecord()

  const didSelectFilter = (filter: FeedFilter) => {
    if (feedLineupProps.scrollParent && feedLineupProps.scrollParent.scrollTo) {
      feedLineupProps.scrollParent.scrollTo(0, 0)
    }
    setFeedFilter(filter)
    resetFeedLineup()
    const fetchLimit = getLoadMoreDigitalContentCount(
      mainLineupProps.variant,
      INITIAL_LOAD_DIGITAL_CONTENTS_MULTIPLIER
    )
    const fetchOffset = 0
    loadMoreFeed(fetchOffset, fetchLimit, true)
    record(make(Name.FEED_CHANGE_VIEW, { view: filter }))
  }

  const header = (
    <Header
      primary={messages.feedHeaderTitle}
      variant={'main'}
      rightDecorator={
        <FeedFilters
          initialFilters={initialFilters}
          filter={feedFilter}
          didSelectFilter={didSelectFilter}
        />
      }
    />
  )

  return (
    <>
      <Page
        title={feedTitle}
        description={feedDescription}
        size='large'
        header={header}
      >
        <Lineup
          emptyElement={
            <EmptyFeed
              hasAccount={hasAccount}
              fetchFollowUsers={fetchSuggestedFollowUsers}
              followUsers={followUsers}
              suggestedFollows={suggestedFollows}
              onClick={hasAccount ? goToTrending : goToSignUp}
            />
          }
          endOfLineup={<EndOfLineup key='endOfLineup' />}
          key='feed'
          isFeed
          {...feedLineupProps}
          {...mainLineupProps}
        />
      </Page>
    </>
  )
}

export default FeedPageContent
