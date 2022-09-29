import { useEffect, useContext } from 'react'

import { Agreement, User } from '@coliving/common'
import cn from 'classnames'

import { ReactComponent as IconRemixes } from 'assets/img/iconRemix.svg'
import { pluralize } from 'common/utils/formatUtil'
import Header from 'components/header/mobile/header'
import { HeaderContext } from 'components/header/mobile/headerContextProvider'
import Lineup, { LineupWithoutTile } from 'components/lineup/Lineup'
import MobilePageContainer from 'components/mobile-page-container/MobilePageContainer'
import { useSubPageHeader } from 'components/nav/store/context'
import UserBadges from 'components/user-badges/UserBadges'
import { fullAgreementRemixesPage } from 'utils/route'
import { isMatrix } from 'utils/theme/theme'
import { withNullGuard } from 'utils/withNullGuard'

import styles from './RemixesPage.module.css'

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
    useSubPageHeader()

    const { setHeader } = useContext(HeaderContext)
    useEffect(() => {
      setHeader(
        <>
          <Header
            className={styles.header}
            title={
              <>
                <IconRemixes
                  className={cn(styles.iconRemix, {
                    [styles.matrix]: isMatrix()
                  })}
                />
                <span>{title}</span>
              </>
            }
          />
        </>
      )
    }, [setHeader, title, originalAgreement, user, goToLandlordPage, goToAgreementPage])

    return (
      <MobilePageContainer
        title={title}
        description={messages.getDescription(originalAgreement.title, user.name)}
        canonicalUrl={fullAgreementRemixesPage(originalAgreement.permalink)}
        containerClassName={styles.container}
      >
        <div className={styles.agreementsContainer}>
          <div className={styles.subHeader}>
            {`${count || ''} ${pluralize(
              messages.remixes,
              count,
              'es',
              !count
            )} ${messages.of}`}
            <div className={styles.agreement}>
              <div className={styles.link} onClick={goToAgreementPage}>
                {originalAgreement.title}
              </div>
              {messages.by}
              <div className={styles.link} onClick={goToLandlordPage}>
                {user.name}
                <UserBadges
                  userId={user.user_id}
                  badgeSize={10}
                  className={styles.iconVerified}
                />
              </div>
            </div>
          </div>
          <Lineup {...getLineupProps()} />
        </div>
      </MobilePageContainer>
    )
  }
)

export default RemixesPage
