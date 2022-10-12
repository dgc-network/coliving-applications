import React from 'react'

import desktopStyles from './Analytics.module.css'
import mobileStyles from './AnalyticsMobile.module.css'
import Page from 'components/page'
import TotalStakedStat from 'components/totalStakedStat'
import ApiCallsStat from 'components/apiCallsStat'
import UniqueUsersStat from 'components/uniqueUsersStat'
import TotalApiCallsChart from 'components/totalApiCallsChart'
import PlaysChart from 'components/playsChart'
import UniqueUsersChart from 'components/uniqueUsersChart'
import TotalStakedChart from 'components/totalStakedChart'
import TopAppsChart from 'components/topAppsChart'
import TopGenresChart from 'components/topGenresChart'
import TopDigitalContents from 'components/topDigitalContents'
import TopContentLists from 'components/topContentLists'
import TopAlbums from 'components/topAlbums'
import { createStyles } from 'utils/mobile'

const styles = createStyles({ desktopStyles, mobileStyles })

const messages = {
  title: 'Analytics'
}

type OwnProps = {}
type AnalyticsProps = OwnProps

const Analytics: React.FC<AnalyticsProps> = () => {
  return (
    <Page title={messages.title} className={styles.container} hidePreviousPage>
      <div className={styles.statBar}>
        <TotalStakedStat />
        <ApiCallsStat />
        <UniqueUsersStat />
      </div>
      <div className={styles.big}>
        <TotalApiCallsChart />
      </div>
      <div className={styles.big}>
        <TotalStakedChart />
      </div>
      <div className={styles.section}>
        <PlaysChart />
        <UniqueUsersChart />
      </div>
      <div className={styles.section}>
        <TopAppsChart />
        <TopGenresChart />
      </div>
      <div className={styles.medium}>
        <TopDigitalContents />
      </div>
      <div className={styles.section}>
        <TopAlbums />
        <TopContentLists />
      </div>
    </Page>
  )
}

export default Analytics
