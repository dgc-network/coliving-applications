import { useEffect } from 'react'

import { useDispatch } from 'react-redux'

import { trendingContentListLineupActions } from 'common/store/pages/trendingContentLists/lineups/actions'
import { getLineup } from 'common/store/pages/trendingContentLists/lineups/selectors'
import DesktopHeader from 'components/header/desktop/header'
import { useMobileHeader } from 'components/header/mobile/hooks'
import Lineup from 'components/lineup/lineup'
import { useLineupProps } from 'components/lineup/hooks'
import { LineupVariant } from 'components/lineup/types'
import MobilePageContainer from 'components/mobilePageContainer/mobilePageContainer'
import Page from 'components/page/page'
import RewardsBanner from 'pages/trending-page/components/RewardsBanner'
import { isMobile } from 'utils/clientUtil'
import { BASE_URL, TRENDING_CONTENT_LISTS_PAGE } from 'utils/route'

import styles from './TrendingContentListPage.module.css'

const messages = {
  trendingContentListTile: 'Trending ContentLists',
  description: 'Trending ContentLists on Coliving'
}

/** Wraps useLineupProps to return trending contentList lineup props */
const useTrendingContentListLineup = (containerRef: HTMLElement) => {
  return useLineupProps({
    actions: trendingContentListLineupActions,
    getLineupSelector: getLineup,
    variant: LineupVariant.CONTENT_LIST,
    numContentListSkeletonRows: 5,
    scrollParent: containerRef,
    rankIconCount: 5,
    isTrending: true,
    isOrdered: true
  })
}

type TrendingContentListPageProps = {
  containerRef: HTMLElement
}

const DesktopTrendingContentListPage = ({
  containerRef
}: TrendingContentListPageProps) => {
  const lineupProps = useTrendingContentListLineup(containerRef)

  const header = (
    <DesktopHeader primary={messages.trendingContentListTile} variant='main' />
  )

  return (
    <Page
      title={messages.trendingContentListTile}
      description={messages.description}
      size='large'
      header={header}
    >
      <div className={styles.bannerContainer}>
        <RewardsBanner bannerType='contentLists' />
      </div>
      <Lineup {...lineupProps} />
    </Page>
  )
}

const MobileTrendingContentListPage = ({
  containerRef
}: TrendingContentListPageProps) => {
  const lineupProps = useTrendingContentListLineup(containerRef)

  useMobileHeader({ title: messages.trendingContentListTile })

  return (
    <MobilePageContainer
      title={messages.trendingContentListTile}
      description={messages.description}
      canonicalUrl={`${BASE_URL}${TRENDING_CONTENT_LISTS_PAGE}`}
      hasDefaultHeader
    >
      <div className={styles.mobileLineupContainer}>
        <div className={styles.mobileBannerContainer}>
          <RewardsBanner bannerType='contentLists' />
        </div>
        <Lineup {...lineupProps} />
      </div>
    </MobilePageContainer>
  )
}

const useLineupReset = () => {
  const dispatch = useDispatch()
  useEffect(() => {
    return () => {
      dispatch(trendingContentListLineupActions.reset())
    }
  }, [dispatch])
}

const TrendingContentListPage = (props: TrendingContentListPageProps) => {
  const mobile = isMobile()

  useLineupReset()

  return (
    <>
      {mobile ? (
        <MobileTrendingContentListPage {...props} />
      ) : (
        <DesktopTrendingContentListPage {...props} />
      )}
    </>
  )
}

export default TrendingContentListPage
