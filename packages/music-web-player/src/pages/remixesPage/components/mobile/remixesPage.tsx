import { useEffect, useContext } from 'react'

import { DigitalContent, User } from '@coliving/common'
import cn from 'classnames'

import { ReactComponent as IconRemixes } from 'assets/img/iconRemix.svg'
import { pluralize } from 'common/utils/formatUtil'
import Header from 'components/header/mobile/header'
import { HeaderContext } from 'components/header/mobile/headerContextProvider'
import Lineup, { LineupWithoutTile } from 'components/lineup/lineup'
import MobilePageContainer from 'components/mobilePageContainer/mobilePageContainer'
import { useSubPageHeader } from 'components/nav/store/context'
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
    }, [setHeader, title, originalDigitalContent, user, goToLandlordPage, goToDigitalContentPage])

    return (
      <MobilePageContainer
        title={title}
        description={messages.getDescription(originalDigitalContent.title, user.name)}
        canonicalUrl={fullDigitalContentRemixesPage(originalDigitalContent.permalink)}
        containerClassName={styles.container}
      >
        <div className={styles.digitalContentsContainer}>
          <div className={styles.subHeader}>
            {`${count || ''} ${pluralize(
              messages.remixes,
              count,
              'es',
              !count
            )} ${messages.of}`}
            <div className={styles.digital_content}>
              <div className={styles.link} onClick={goToDigitalContentPage}>
                {originalDigitalContent.title}
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
