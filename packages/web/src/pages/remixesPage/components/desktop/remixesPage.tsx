import { Agreement, User } from '@coliving/common'
import cn from 'classnames'

import { ReactComponent as IconRemixes } from 'assets/img/iconRemix.svg'
import { pluralize } from 'common/utils/formatUtil'
import Header from 'components/header/desktop/header'
import Lineup, { LineupWithoutTile } from 'components/lineup/lineup'
import Page from 'components/page/page'
import UserBadges from 'components/userBadges/userBadges'
import { fullAgreementRemixesPage } from 'utils/route'
import { isMatrix } from 'utils/theme/theme'
import { withNullGuard } from 'utils/withNullGuard'

import styles from './remixesPage.module.css'

const messages = {
  remixes: 'Remix',
  by: 'by',
  of: 'of',
  getDescription: (agreementName: string, landlordName: string) =>
    `${messages.remixes} ${messages.of} ${agreementName} ${messages.by} ${landlordName}`
}

export type RemixesPageProps = {
  title: string
  count: number | null
  originalAgreement: Agreement | null
  user: User | null
  getLineupProps: () => LineupWithoutTile
  goToAgreementPage: () => void
  goToLandlordPage: () => void
}

const g = withNullGuard(
  ({ originalAgreement, user, ...p }: RemixesPageProps) =>
    originalAgreement && user && { ...p, originalAgreement, user }
)

const RemixesPage = g(
  ({
    title,
    count,
    originalAgreement,
    user,
    getLineupProps,
    goToAgreementPage,
    goToLandlordPage
  }) => {
    const renderHeader = () => (
      <Header
        wrapperClassName={styles.header}
        primary={
          <div className={styles.headerPrimary}>
            <IconRemixes
              className={cn(styles.iconRemix, { [styles.matrix]: isMatrix() })}
            />
            <span>{title}</span>
          </div>
        }
        secondary={
          <div className={styles.headerSecondary}>
            {`${count || ''} ${pluralize(
              messages.remixes,
              count,
              'es',
              !count
            )} ${messages.of}`}
            <div className={styles.link} onClick={goToAgreementPage}>
              {originalAgreement.title}
            </div>
            {messages.by}
            <div className={styles.link} onClick={goToLandlordPage}>
              {user.name}
              <UserBadges
                className={styles.iconVerified}
                userId={user.user_id}
                badgeSize={12}
              />
            </div>
          </div>
        }
        containerStyles={styles.header}
      />
    )

    return (
      <Page
        title={title}
        description={messages.getDescription(originalAgreement.title, user.name)}
        canonicalUrl={fullAgreementRemixesPage(originalAgreement.permalink)}
        header={renderHeader()}
      >
        <Lineup {...getLineupProps()} />
      </Page>
    )
  }
)

export default RemixesPage
