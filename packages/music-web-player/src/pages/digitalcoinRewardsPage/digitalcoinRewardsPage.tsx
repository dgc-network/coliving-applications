import { ReactNode, useContext, useEffect } from 'react'

import { FeatureFlags } from '@coliving/common'
import { useDispatch } from 'react-redux'

import { preloadWalletProviders } from 'common/store/pages/tokenDashboard/slice'
import { getBalance } from 'common/store/wallet/slice'
import Header from 'components/header/desktop/header'
import { useMobileHeader } from 'components/header/mobile/hooks'
import MobilePageContainer from 'components/mobilePageContainer/mobilePageContainer'
import NavContext, {
  LeftPreset,
  RightPreset
} from 'components/nav/store/context'
import Page from 'components/page/page'
import { useFlag } from 'hooks/useRemoteConfig'
import { useRequiresAccount } from 'hooks/useRequiresAccount'
import { useWithMobileStyle } from 'hooks/useWithMobileStyle'
import { isMobile } from 'utils/clientUtil'
import { LIVE_PAGE, BASE_URL, TRENDING_PAGE } from 'utils/route'

import styles from './liveRewardsPage.module.css'
import ChallengeRewardsTile from './challengeRewardsTile'
import Tiers from './tiers'
import { BalanceTile, WalletTile } from './tiles'
import TrendingRewardsTile from './trendingRewardsTile'
import WalletModal from './walletModal'
import ExplainerTile from './components/explainerTile'

export const messages = {
  title: '$DGC & Rewards',
  description: 'Complete tasks to earn $DGC tokens!'
}

export const RewardsContent = () => {
  const wm = useWithMobileStyle(styles.mobile)
  const { isEnabled: isChallengeRewardsEnabled } = useFlag(
    FeatureFlags.CHALLENGE_REWARDS_UI
  )
  useRequiresAccount(TRENDING_PAGE)
  return (
    <>
      <WalletModal />
      <div className={wm(styles.cryptoContentContainer)}>
        <BalanceTile className={wm(styles.balanceTile)} />
        <WalletTile className={styles.walletTile} />
      </div>
      {isChallengeRewardsEnabled && (
        <ChallengeRewardsTile className={styles.mobile} />
      )}
      <TrendingRewardsTile className={styles.mobile} />
      <Tiers />
      <ExplainerTile className={wm(styles.explainerTile)} />
    </>
  )
}

export const DesktopPage = ({ children }: { children: ReactNode }) => {
  const dispatch = useDispatch()
  useEffect(() => {
    dispatch(preloadWalletProviders())
  }, [dispatch])
  const header = <Header primary={messages.title} />
  return (
    <Page
      title={messages.title}
      description={messages.description}
      contentClassName={styles.pageContainer}
      header={header}
    >
      {children}
    </Page>
  )
}

const useMobileNavContext = () => {
  useMobileHeader({ title: messages.title })
  const { setLeft, setRight } = useContext(NavContext)!
  useEffect(() => {
    setLeft(LeftPreset.BACK)
    setRight(RightPreset.SEARCH)
  }, [setLeft, setRight])
}

export const MobilePage = ({ children }: { children: ReactNode }) => {
  useMobileNavContext()
  return (
    <MobilePageContainer
      title={messages.title}
      description={messages.description}
      canonicalUrl={`${BASE_URL}${LIVE_PAGE}`}
      hasDefaultHeader
      containerClassName={styles.rewardsMobilePageContainer}
    >
      {children}
    </MobilePageContainer>
  )
}

export const DigitalcoinRewardsPage = () => {
  const dispatch = useDispatch()
  useEffect(() => {
    dispatch(getBalance())
  }, [dispatch])
  const Page = isMobile() ? MobilePage : DesktopPage
  return (
    <Page>
      <RewardsContent />
    </Page>
  )
}

export default DigitalcoinRewardsPage
