import { useState, useEffect, MouseEvent } from 'react'

import { UID, ID, LineupAgreement } from '@coliving/common'
import cn from 'classnames'
import { range } from 'lodash'

import { ReactComponent as IconVolume } from 'assets/img/iconVolume.svg'
import { formatCount } from 'common/utils/formatUtil'
import { formatSeconds } from 'common/utils/timeUtil'
import FavoriteButton from 'components/altButton/favoriteButton'
import RepostButton from 'components/altButton/repostButton'
import Skeleton from 'components/skeleton/skeleton'
import { ContentListTileProps } from 'components/agreement/types'
import UserBadges from 'components/userBadges/userBadges'

import BottomButtons from './bottomButtons'
import styles from './ContentListTile.module.css'
import { RankIcon } from './agreementTile'
import AgreementTileArt from './agreementTileArt'

type AgreementItemProps = {
  index: number
  agreement?: LineupAgreement
  active: boolean
  forceSkeleton?: boolean
}

// Max number of agreement to display in a contentList
const DISPLAY_AGREEMENT_COUNT = 5

const AgreementItem = (props: AgreementItemProps) => {
  return (
    <>
      <div className={styles.agreementItemDivider}></div>
      <div
        className={cn(styles.agreementItem, {
          [styles.activeAgreementItem]: props.active
        })}
      >
        {props.forceSkeleton ? (
          <Skeleton width='100%' height='10px' />
        ) : props.agreement ? (
          <>
            <div className={styles.index}> {props.index + 1} </div>
            <div className={styles.agreementTitle}> {props.agreement.title} </div>
            <div className={styles.byLandlord}>
              {' '}
              {`by ${props.agreement.user.name}`}{' '}
            </div>
          </>
        ) : null}
      </div>
    </>
  )
}

type AgreementListProps = {
  activeAgreementUid: UID | null
  agreements: LineupAgreement[]
  goToCollectionPage: (e: MouseEvent<HTMLElement>) => void
  isLoading?: boolean
  numLoadingSkeletonRows?: number
  agreementCount?: number
}

const AgreementList = ({
  agreements,
  activeAgreementUid,
  goToCollectionPage,
  isLoading,
  numLoadingSkeletonRows,
  agreementCount
}: AgreementListProps) => {
  if (!agreements.length && isLoading && numLoadingSkeletonRows) {
    return (
      <>
        {range(numLoadingSkeletonRows).map((i) => (
          <AgreementItem key={i} active={false} index={i} forceSkeleton />
        ))}
      </>
    )
  }

  return (
    <div onClick={goToCollectionPage}>
      {agreements.slice(0, DISPLAY_AGREEMENT_COUNT).map((agreement, index) => (
        <AgreementItem
          key={agreement.uid}
          active={activeAgreementUid === agreement.uid}
          index={index}
          agreement={agreement}
        />
      ))}
      {agreementCount && agreementCount > 5 && (
        <>
          <div className={styles.agreementItemDivider}></div>
          <div className={cn(styles.agreementItem, styles.agreementItemMore)}>
            {`+${agreementCount - agreements.length} more agreements`}
          </div>
        </>
      )}
    </div>
  )
}

type ExtraProps = {
  index: number
  isLoading: boolean
  isPlaying: boolean
  isActive: boolean
  goToCollectionPage: (e: MouseEvent<HTMLElement>) => void
  goToLandlordPage: (e: MouseEvent<HTMLElement>) => void
  toggleSave: () => void
  toggleRepost: () => void
  onClickOverflow: () => void
  onShare: () => void
  togglePlay: () => void
  makeGoToRepostsPage: (id: ID) => (e: MouseEvent<HTMLElement>) => void
  makeGoToFavoritesPage: (id: ID) => (e: MouseEvent<HTMLElement>) => void
  isOwner: boolean
  darkMode: boolean
  isMatrix: boolean
}

const ContentListTile = (props: ContentListTileProps & ExtraProps) => {
  const {
    hasLoaded,
    index,
    showSkeleton,
    numLoadingSkeletonRows,
    isTrending,
    showRankIcon,
    agreementCount
  } = props
  const [artworkLoaded, setArtworkLoaded] = useState(false)
  useEffect(() => {
    if (artworkLoaded && !showSkeleton) {
      hasLoaded(index)
    }
  }, [artworkLoaded, hasLoaded, index, showSkeleton])

  const shouldShow = artworkLoaded && !showSkeleton
  const fadeIn = {
    [styles.show]: shouldShow,
    [styles.hide]: !shouldShow
  }

  return (
    <div className={styles.container}>
      <div className={styles.mainContent} onClick={props.togglePlay}>
        <div className={cn(styles.duration, styles.statText, fadeIn)}>
          {formatSeconds(props.duration)}
        </div>
        <div className={styles.metadata}>
          <AgreementTileArt
            id={props.id}
            isAgreement={false}
            showSkeleton={props.showSkeleton}
            callback={() => setArtworkLoaded(true)}
            coverArtSizes={props.coverArtSizes}
            className={styles.albumArtContainer}
          />
          <div
            className={cn(styles.titles, {
              [styles.titlesActive]: props.isActive
            })}
          >
            <div className={styles.title} onClick={props.goToCollectionPage}>
              <div className={cn(fadeIn)}>{props.contentListTitle}</div>
              {props.isPlaying && <IconVolume />}
              {!shouldShow && (
                <Skeleton
                  className={styles.skeleton}
                  width='90px'
                  height='16px'
                />
              )}
            </div>
            <div className={styles.landlord} onClick={props.goToLandlordPage}>
              <span className={cn(styles.userName, fadeIn)}>
                {props.landlordName}
              </span>
              <UserBadges
                userId={props.ownerId}
                badgeSize={10}
                className={styles.iconVerified}
              />
              {!shouldShow && (
                <Skeleton
                  className={styles.skeleton}
                  width='180px'
                  height='16px'
                />
              )}
            </div>
          </div>
        </div>
        <div className={cn(styles.stats, styles.statText)}>
          <RankIcon
            className={styles.rankIcon}
            index={index}
            isVisible={isTrending && shouldShow}
            showCrown={showRankIcon}
          />
          {!!(props.repostCount || props.saveCount) && (
            <>
              <div
                className={cn(styles.statItem, fadeIn, {
                  [styles.disabledStatItem]: !props.saveCount
                })}
                onClick={
                  props.saveCount
                    ? props.makeGoToFavoritesPage(props.id)
                    : undefined
                }
              >
                {formatCount(props.saveCount)}
                <FavoriteButton
                  iconMode
                  isDarkMode={props.darkMode}
                  isMatrixMode={props.isMatrix}
                  className={styles.favoriteButton}
                />
              </div>
              <div
                className={cn(styles.statItem, fadeIn, {
                  [styles.disabledStatItem]: !props.repostCount
                })}
                onClick={
                  props.repostCount
                    ? props.makeGoToRepostsPage(props.id)
                    : undefined
                }
              >
                {formatCount(props.repostCount)}
                <RepostButton
                  iconMode
                  isDarkMode={props.darkMode}
                  isMatrixMode={props.isMatrix}
                  className={styles.repostButton}
                />
              </div>
            </>
          )}
        </div>
        <AgreementList
          activeAgreementUid={props.activeAgreementUid}
          goToCollectionPage={props.goToCollectionPage}
          agreements={props.agreements}
          isLoading={showSkeleton}
          numLoadingSkeletonRows={numLoadingSkeletonRows}
          agreementCount={agreementCount}
        />
        <div className={cn(fadeIn)}>
          <BottomButtons
            hasSaved={props.hasCurrentUserSaved}
            hasReposted={props.hasCurrentUserReposted}
            toggleSave={props.toggleSave}
            toggleRepost={props.toggleRepost}
            onShare={props.onShare}
            onClickOverflow={props.onClickOverflow}
            isOwner={props.isOwner}
            isDarkMode={props.darkMode}
            isMatrixMode={props.isMatrix}
          />
        </div>
      </div>
    </div>
  )
}

export default ContentListTile
