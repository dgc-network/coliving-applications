import React from 'react'
import Page from 'components/page'
import { useAccount } from 'store/account/hooks'
import ManageService from 'components/manageService'
import { useProposals } from 'store/cache/proposals/hooks'
import { ReactComponent as Logo } from 'assets/img/colivingLogoHorizontal.svg'
import Paper from 'components/paper'
import Proposal from 'components/proposal'
import Loading from 'components/loading'
import { NoProposals } from 'components/proposals'
import TopAddressesTable from 'components/topAddressesTable'
import { usePushRoute } from 'utils/effects'
import { GOVERNANCE } from 'utils/routes'
import TotalStakedStat from 'components/totalStakedStat'
import ApiCallsStat from 'components/apiCallsStat'
import UniqueUsersStat from 'components/uniqueUsersStat'
import EstimatedWeeklyStat from 'components/estimatedWeeklyStat'
import EstimatedAnnualStat from 'components/estimatedAnnualStat'

import desktopStyles from './Home.module.css'
import mobileStyles from './HomeMobile.module.css'
import { createStyles } from 'utils/mobile'
import { useIsMobile } from 'utils/hooks'

const styles = createStyles({ desktopStyles, mobileStyles })

const messages = {
  title: 'Overview',
  recentProposals: 'Recent Proposals',
  noProposals: 'No Recent Proposals',
  viewAllProposals: 'View All Proposals',
  wtfIsColiving: 'WTF is Coliving?',
  wtf1: `Coliving is a digital streaming service that connects residents directly with landlords and exclusive new music`,
  wtf2: `It does this by being fully decentralized: Coliving is owned and run by a vibrant, open-source community of landlords, residents, and developers all around the world. Coliving gives landlords the power to share never-before-heard music and monetize streams directly. Developers can build their own apps on top of Coliving, giving them access to one of the most unique live catalogs in existence.`,
  wtf3: `Backed by an all-star team of investors, Coliving was founded in 2018 and serves millions of users every month, making it the largest non-financial crypto application ever built.`
}

interface HomeProps {}
const Home: React.FC<HomeProps> = (props: HomeProps) => {
  const { isLoggedIn } = useAccount()
  const { recentProposals } = useProposals()
  const pushRoute = usePushRoute()
  const isMobile = useIsMobile()

  return (
    <Page title={messages.title} hidePreviousPage>
      <div className={styles.statBar}>
        <TotalStakedStat />
        <ApiCallsStat />
        <UniqueUsersStat />
      </div>
      <div className={styles.rewards}>
        <EstimatedWeeklyStat />
        <EstimatedAnnualStat />
      </div>
      {isLoggedIn && (
        <div className={styles.manageServices}>
          <ManageService />
        </div>
      )}

      <Paper className={styles.proposals}>
        <div className={styles.title}>{messages.recentProposals}</div>
        <div className={styles.list}>
          {!!recentProposals ? (
            recentProposals.length > 0 ? (
              recentProposals.map((proposal, i) => (
                <Proposal key={i} proposal={proposal} />
              ))
            ) : (
              <NoProposals text={messages.noProposals} />
            )
          ) : (
            <Loading className={styles.loading} />
          )}
        </div>
        <div onClick={() => pushRoute(GOVERNANCE)} className={styles.moreText}>
          {messages.viewAllProposals}
        </div>
      </Paper>

      <TopAddressesTable
        limit={5}
        className={styles.topAddressesTable}
        alwaysShowMore
      />

      <Paper className={styles.wtf}>
        <div className={styles.bg} />
        {isMobile ? (
          <div className={styles.topRow}>
            <Logo className={styles.logo} />
            <div className={styles.wtfIs}>{messages.wtfIsColiving}</div>
          </div>
        ) : (
          <div className={styles.topRow}>
            <div className={styles.wtfIs}>{messages.wtfIsColiving}</div>
            <Logo className={styles.logo} />
          </div>
        )}
        <div className={styles.body}>
          <p>{messages.wtf1}</p>
          <p>{messages.wtf2}</p>
          <p>{messages.wtf3}</p>
        </div>
      </Paper>
    </Page>
  )
}

export default Home
