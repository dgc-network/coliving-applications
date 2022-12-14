import { DigitalContent, User } from '@coliving/common'
import cn from 'classnames'

import { ReactComponent as IconRemixes } from 'assets/img/iconRemix.svg'
import { pluralize } from 'common/utils/formatUtil'
import Header from 'components/header/desktop/header'
import Lineup, { LineupWithoutTile } from 'components/lineup/lineup'
import Page from 'components/page/page'
import UserBadges from 'components/userBadges/userBadges'
import { fullDigitalContentRemixesPage } from 'utils/route'
import { isMatrix } from 'utils/theme/theme'
import { withNullGuard } from 'utils/withNullGuard'

import styles from './remixesPage.module.css'

const messages = {
  remixes: 'Remix',
  by: 'by',
  of: 'of',
  getDescription: (digitalContentName: string, landlordName: string) =>
    `${messages.remixes} ${messages.of} ${digitalContentName} ${messages.by} ${landlordName}`
}

export type RemixesPageProps = {
  title: string
  count: number | null
  originalDigitalContent: DigitalContent | null
  user: User | null
  getLineupProps: () => LineupWithoutTile
  goToDigitalContentPage: () => void
  goToLandlordPage: () => void
}

const g = withNullGuard(
  ({ originalDigitalContent, user, ...p }: RemixesPageProps) =>
    originalDigitalContent && user && { ...p, originalDigitalContent, user }
)

const RemixesPage = g(
  ({
    title,
    count,
    originalDigitalContent,
    user,
    getLineupProps,
    goToDigitalContentPage,
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
            <div className={styles.link} onClick={goToDigitalContentPage}>
              {originalDigitalContent.title}
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
        description={messages.getDescription(originalDigitalContent.title, user.name)}
        canonicalUrl={fullDigitalContentRemixesPage(originalDigitalContent.permalink)}
        header={renderHeader()}
      >
        <Lineup {...getLineupProps()} />
      </Page>
    )
  }
)

export default RemixesPage
