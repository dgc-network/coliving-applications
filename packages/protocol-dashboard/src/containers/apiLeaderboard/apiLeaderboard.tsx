import React from 'react'

import styles from './APILeaderboard.module.css'
import Page from 'components/page'
import { API, API_TITLE } from 'utils/routes'
import RewardsCTABanner from 'components/rewardsCTABanner'
import TopAPITable from 'components/topAPITable'

const messages = {
  title: 'API Leaderboard',
  imgBannerAlt: 'Coliving API',
  cta: 'Learn more about the  API'
}

type OwnProps = {}
type APILeaderboardProps = OwnProps

const APILeaderboard: React.FC<APILeaderboardProps> = () => {
  return (
    <Page
      title={messages.title}
      className={styles.container}
      defaultPreviousPage={API_TITLE}
      defaultPreviousPageRoute={API}
    >
      <RewardsCTABanner className={styles.rewardsCTABanner} />
      <TopAPITable className={styles.topAPITable} />
    </Page>
  )
}

export default APILeaderboard
