import { useCallback, useEffect, useState } from 'react'

import { Theme, StringKeys } from '@coliving/common'
import { TabSlider } from '@coliving/stems'
import cn from 'classnames'
import { useDispatch } from 'react-redux'
import { TwitterTweetEmbed } from 'react-twitter-embed'

import { useModalState } from 'common/hooks/useModalState'
import { getTrendingRewardsModalType } from 'common/store/pages/live-rewards/selectors'
import {
  TrendingRewardsModalType,
  setTrendingRewardsModalType
} from 'common/store/pages/live-rewards/slice'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import { useNavigateToPage } from 'hooks/useNavigateToPage'
import { useRemoteVar } from 'hooks/useRemoteConfig'
import { useWithMobileStyle } from 'hooks/useWithMobileStyle'
import { isMobile } from 'utils/clientUtil'
import { useSelector } from 'utils/reducer'
import {
  TRENDING_PAGE,
  TRENDING_CONTENT_LISTS_PAGE,
  TRENDING_UNDERGROUND_PAGE
} from 'utils/route'
import { getTheme, isDarkMode } from 'utils/theme/theme'

import ButtonWithArrow from '../ButtonWithArrow'

import ModalDrawer from './ModalDrawer'
import styles from './TrendingRewards.module.css'

const IS_NATIVE_MOBILE = process.env.REACT_APP_NATIVE_MOBILE

const messages = {
  agreementsTitle: 'Top 5 Agreements Each Week Receive 100 $LIVE',
  content listTitle: 'Top 5 Playlists Each Week Receive 100 $LIVE',
  undergroundTitle: 'Top 5 Agreements Each Week Receive 100 $LIVE',
  winners: 'Winners are selected every Friday at Noon PT!',
  lastWeek: "LAST WEEK'S WINNERS",
  agreements: 'AGREEMENTS',
  topAgreements: 'TOP AGREEMENTS',
  content lists: 'CONTENT_LISTS',
  topPlaylists: 'TOP CONTENT_LISTS',
  underground: 'UNDERGROUND',
  terms: 'Terms and Conditions Apply',
  agreementsModalTitle: 'Top 5 Trending Agreements',
  content listsModalTitle: 'Top 5 Trending Playlists',
  undergroundModalTitle: 'Top 5 Underground Trending Agreements',
  buttonTextAgreements: 'Current Trending Agreements',
  buttonTextPlaylists: 'Current Trending Playlists',
  buttonTextUnderground: 'Current Underground Trending Agreements',
  mobileButtonTextAgreements: 'Trending Agreements',
  mobileButtonTextPlaylists: 'Trending Playlists',
  mobileButtonTextUnderground: 'Underground Trending Agreements'
}

const TRENDING_PAGES = {
  agreements: TRENDING_PAGE,
  content lists: TRENDING_CONTENT_LISTS_PAGE,
  underground: TRENDING_UNDERGROUND_PAGE
}

const textMap = {
  content lists: {
    modalTitle: messages.content listsModalTitle,
    title: messages.content listTitle,
    button: messages.buttonTextPlaylists,
    buttonMobile: messages.mobileButtonTextPlaylists
  },
  agreements: {
    modalTitle: messages.agreementsModalTitle,
    title: messages.agreementsTitle,
    button: messages.buttonTextAgreements,
    buttonMobile: messages.mobileButtonTextAgreements
  },
  underground: {
    modalTitle: messages.undergroundModalTitle,
    title: messages.undergroundTitle,
    button: messages.buttonTextUnderground,
    buttonMobile: messages.mobileButtonTextUnderground
  }
}

const TOS_URL = 'https://blog.coliving.lol/posts/live-rewards'

// Getters and setters for whether we're looking at
// trending content lists or trending agreements
const useRewardsType = (): [
  TrendingRewardsModalType,
  (type: TrendingRewardsModalType) => void
] => {
  const dispatch = useDispatch()
  const rewardsType = useSelector(getTrendingRewardsModalType)
  const setTrendingRewardsType = useCallback(
    (type: TrendingRewardsModalType) => {
      dispatch(setTrendingRewardsModalType({ modalType: type }))
    },
    [dispatch]
  )
  return [rewardsType, setTrendingRewardsType]
}

const useTweetId = (type: TrendingRewardsModalType) => {
  const agreementsId = useRemoteVar(StringKeys.REWARDS_TWEET_ID_AGREEMENTS)
  const content listsId = useRemoteVar(StringKeys.REWARDS_TWEET_ID_CONTENT_LISTS)
  const undergroundId = useRemoteVar(StringKeys.REWARDS_TWEET_ID_UNDERGROUND)
  return {
    agreements: agreementsId,
    content lists: content listsId,
    underground: undergroundId
  }[type]
}
const shouldUseDarkTwitter = () => {
  const theme = getTheme()
  return theme === Theme.MATRIX || isDarkMode()
}

const TrendingRewardsBody = ({
  dismissModal
}: {
  dismissModal: () => void
}) => {
  const [modalType, setModalType] = useRewardsType()

  const onClickToS = useCallback(() => {
    window.open(TOS_URL, '_blank')
  }, [])

  const mobile = isMobile()
  const tabOptions = [
    {
      key: 'agreements',
      text: mobile ? messages.agreements : messages.topAgreements
    },
    {
      key: 'content lists',
      text: mobile ? messages.content lists : messages.topPlaylists
    },
    {
      key: 'underground',
      text: messages.underground
    }
  ]

  const navigate = useNavigateToPage()

  const onButtonClick = useCallback(() => {
    const page = TRENDING_PAGES[modalType]
    navigate(page)
    dismissModal()
  }, [navigate, modalType, dismissModal])

  const wm = useWithMobileStyle(styles.mobile)

  // If we change type, show the spinner again
  const [showSpinner, setShowSpinner] = useState(true)
  useEffect(() => {
    setShowSpinner(true)
  }, [modalType])

  const tweetId = useTweetId(modalType)

  return (
    <div className={styles.scrollContainer}>
      <div className={wm(styles.container)}>
        <div className={styles.sliderContainer}>
          <TabSlider
            options={tabOptions}
            selected={modalType}
            onSelectOption={(option) =>
              setModalType(option as TrendingRewardsModalType)
            }
            textClassName={cn(styles.slider, styles.compactSlider)}
            activeTextClassName={styles.activeSlider}
            key={`rewards-slider-${tabOptions.length}`}
          />
        </div>
        <div className={styles.titles}>
          <span className={styles.title}>{textMap[modalType].title}</span>
          <span className={styles.subtitle}>{messages.winners}</span>
        </div>
        <div className={styles.insetRegion}>
          <span className={styles.lastWeek}>{messages.lastWeek}</span>
          <div className={styles.embedWrapper}>
            {showSpinner && <LoadingSpinner className={styles.spinner} />}
            <TwitterTweetEmbed
              // Refresh it when we toggle
              key={`twitter-${modalType}`}
              tweetId={tweetId}
              onLoad={() => setShowSpinner(false)}
              options={{
                theme: shouldUseDarkTwitter() ? 'dark' : 'light',
                cards: 'none',
                conversation: 'none',
                hide_thread: true,
                width: 554,
                height: 390
              }}
            />
          </div>
        </div>
        <ButtonWithArrow
          text={textMap[modalType][mobile ? 'buttonMobile' : 'button']}
          onClick={onButtonClick}
          className={styles.button}
        />
        <span onClick={onClickToS} className={styles.terms}>
          {messages.terms}
        </span>
      </div>
    </div>
  )
}

export const TrendingRewardsModal = () => {
  const [isOpen, setOpen] = useModalState('TrendingRewardsExplainer')
  const [modalType] = useRewardsType()

  return (
    <ModalDrawer
      isOpen={!IS_NATIVE_MOBILE && isOpen}
      onClose={() => setOpen(false)}
      title={
        <h2 className={styles.titleHeader}>
          <i className={`emoji large chart-increasing ${styles.titleIcon}`} />
          {textMap[modalType].modalTitle}
        </h2>
      }
      allowScroll
      showTitleHeader
      showDismissButton
    >
      <TrendingRewardsBody dismissModal={() => setOpen(false)} />
    </ModalDrawer>
  )
}

export default TrendingRewardsModal
