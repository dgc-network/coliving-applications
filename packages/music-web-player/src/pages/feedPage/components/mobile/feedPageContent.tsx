import { useContext, useEffect, useCallback } from 'react'

import { FeedFilter, Name, Status } from '@coliving/common'
import cn from 'classnames'

import { useModalState } from 'common/hooks/useModalState'
import { feedActions } from 'common/store/pages/feed/lineup/actions'
import Header from 'components/header/mobile/header'
import { HeaderContext } from 'components/header/mobile/headerContextProvider'
import Lineup from 'components/lineup/lineup'
import MobilePageContainer from 'components/mobilePageContainer/mobilePageContainer'
import { useMainPageHeader } from 'components/nav/store/context'
import PullToRefresh from 'components/pullToRefresh/pullToRefresh'
import useAsyncPoll from 'hooks/useAsyncPoll'
import { FeedPageContentProps } from 'pages/feedPage/types'
import { make, useRecord } from 'store/analytics/actions'
import { BASE_URL, FEED_PAGE } from 'utils/route'

import Filters from './feedFilterButton'
import FeedFilterDrawer from './feedFilterDrawer'
import styles from './feedPageContent.module.css'

const IS_NATIVE_MOBILE = process.env.REACT_APP_NATIVE_MOBILE

const messages = {
  title: 'Your Feed'
}

const FeedPageMobileContent = ({
  feedTitle,
  feedDescription,
  feed,
  setFeedInView,
  loadMoreFeed,
  playFeedDigitalContent,
  pauseFeedDigitalContent,
  getLineupProps,
  feedFilter,
  setFeedFilter,
  refreshFeedInView,
  resetFeedLineup
}: FeedPageContentProps) => {
  const { setHeader } = useContext(HeaderContext)
  const [modalIsOpen, setModalIsOpen] = useModalState('FeedFilter')

  useEffect(() => {
    setHeader(
      <Header title={messages.title} className={styles.header}>
        <Filters
          currentFilter={feedFilter}
          didOpenModal={() => {
            setModalIsOpen(true)
          }}
          showIcon={false}
        />
      </Header>
    )
  }, [setHeader, feedFilter, setModalIsOpen])

  // Set Nav-Bar Menu
  useMainPageHeader()

  const lineupProps = {
    ordered: true,
    ...getLineupProps(feed),
    loadMore: (offset: number, limit: number, overwrite: boolean) =>
      loadMoreFeed(offset, limit, overwrite),
    setInView: setFeedInView,
    playDigitalContent: playFeedDigitalContent,
    pauseDigitalContent: pauseFeedDigitalContent,
    actions: feedActions,
    delineate: true
  }

  const record = useRecord()
  const handleSelectFilter = (filter: FeedFilter) => {
    setModalIsOpen(false)
    setFeedFilter(filter)
    // Clear the lineup
    resetFeedLineup()
    // Tell the store that the feed is still in view so it can be refetched
    setFeedInView(true)
    // Force a refresh for at least 10 tiles
    refreshFeedInView(true, 10)
    record(make(Name.FEED_CHANGE_VIEW, { view: filter }))
  }

  const refresh = useCallback(
    () => refreshFeedInView(true),
    [refreshFeedInView]
  )
  const asyncRefresh = useAsyncPoll({
    call: refresh,
    variable: feed.status,
    value: Status.SUCCESS
  })

  return (
    <MobilePageContainer
      title={feedTitle}
      description={feedDescription}
      canonicalUrl={`${BASE_URL}${FEED_PAGE}`}
      hasDefaultHeader
    >
      {IS_NATIVE_MOBILE ? null : (
        <FeedFilterDrawer
          isOpen={modalIsOpen}
          onSelectFilter={handleSelectFilter}
          onClose={() => setModalIsOpen(false)}
        />
      )}
      <div
        className={cn(styles.lineupContainer, {
          [styles.playing]: !!lineupProps.playingUid
        })}
      >
        <PullToRefresh fetchContent={asyncRefresh}>
          <Lineup {...lineupProps} />
        </PullToRefresh>
      </div>
    </MobilePageContainer>
  )
}

export default FeedPageMobileContent
