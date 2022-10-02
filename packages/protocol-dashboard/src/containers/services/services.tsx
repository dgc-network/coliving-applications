import React from 'react'
import clsx from 'clsx'

import Page from 'components/page'
import ManageService from 'components/manageService'
import DiscoveryTable from 'components/discoveryTable'
import ContentTable from 'components/contentTable'
import TopOperatorsTable from 'components/topOperatorsTable'
import { useAccount } from 'store/account/hooks'

import desktopStyles from './Services.module.css'
import mobileStyles from './ServicesMobile.module.css'
import { createStyles } from 'utils/mobile'

const styles = createStyles({ desktopStyles, mobileStyles })

const messages = {
  title: 'SERVICES OVERVIEW'
}

const NODE_LIMIT = 10

type OwnProps = {}

type ServicesProps = OwnProps

const Services: React.FC<ServicesProps> = () => {
  const { isLoggedIn } = useAccount()
  return (
    <Page title={messages.title} hidePreviousPage>
      {isLoggedIn && <ManageService />}
      <TopOperatorsTable
        limit={5}
        className={styles.topAddressesTable}
        alwaysShowMore
      />
      <div className={styles.serviceContainer}>
        <DiscoveryTable
          className={clsx(styles.serviceTable, styles.rightSpacing)}
          limit={NODE_LIMIT}
          alwaysShowMore
        />
        <ContentTable
          className={clsx(styles.serviceTable, styles.leftSpacing)}
          limit={NODE_LIMIT}
          alwaysShowMore
        />
      </div>
    </Page>
  )
}

export default Services
