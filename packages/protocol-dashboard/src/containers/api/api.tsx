import React from 'react'

import Page from 'components/page'
import RewardsCTABanner from 'components/rewardsCTABanner'
import useOpenLink from 'hooks/useOpenLink'
import { COLIVING_API_URL } from 'utils/routes'
import TopAPIAppsChart from 'components/topAPIAppsChart'

import { createStyles } from 'utils/mobile'
import desktopStyles from './API.module.css'
import mobileStyles from './APIMobile.module.css'

const styles = createStyles({ desktopStyles, mobileStyles })

const messages = {
  title: 'API Leaderboard',
  imgBannerAlt: 'Coliving API',
  cta: 'Learn more about the  API'
}

type OwnProps = {}
type APIProps = OwnProps

const API: React.FC<APIProps> = () => {
  const onClickLearnMore = useOpenLink(COLIVING_API_URL)
  return (
    <Page title={messages.title} className={styles.container}>
      <div className={styles.apiBanner}>
        <a
          href={COLIVING_API_URL}
          className={styles.learnMore}
          onClick={onClickLearnMore}
        >
          {messages.cta}
        </a>
      </div>
      <RewardsCTABanner className={styles.rewardsCTABanner} />
      <TopAPIAppsChart className={styles.topAPIAppsChart} />
    </Page>
  )
}

export default API
