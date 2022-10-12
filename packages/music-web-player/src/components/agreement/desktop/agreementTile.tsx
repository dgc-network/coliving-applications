import { memo, MouseEvent, useCallback } from 'react'

import { IconCrown, IconHidden } from '@coliving/stems'
import cn from 'classnames'

import { ReactComponent as IconStar } from 'assets/img/iconStar.svg'
import { ReactComponent as IconVolume } from 'assets/img/iconVolume.svg'
import { formatCount, pluralize } from 'common/utils/formatUtil'
import { formatSeconds } from 'common/utils/timeUtil'
import FavoriteButton from 'components/altButton/favoriteButton'
import RepostButton from 'components/altButton/repostButton'
import ShareButton from 'components/altButton/shareButton'
import Skeleton from 'components/skeleton/skeleton'
import Tooltip from 'components/tooltip/tooltip'

import AgreementBannerIcon, { AgreementBannerIconType } from '../agreementBannerIcon'
import {
  AgreementTileSize,
  DesktopAgreementTileProps as AgreementTileProps
} from '../types'

import styles from './AgreementTile.module.css'

const messages = {
  getPlays: (listenCount: number) => ` ${pluralize('Play', listenCount)}`,
  landlordPick: 'Landlord Pick',
  hiddenAgreement: 'Hidden DigitalContent',
  repostLabel: 'Repost',
  unrepostLabel: 'Unrepost'
}

const RankAndIndexIndicator = ({
  hasOrdering,
  showCrownIcon,
  isLoading,
  index
}: {
  hasOrdering: boolean
  showCrownIcon: boolean
  isLoading: boolean
  index: number
}) => {
  return (
    <>
      {hasOrdering && (
        <div className={styles.order}>
          {showCrownIcon && (
            <div className={styles.crownContainer}>
              <IconCrown />
            </div>
          )}
          {!isLoading && index}
        </div>
      )}
    </>
  )
}

const AgreementTile = memo(
  ({
    size,
    order,
    standalone,
    isFavorited,
    isReposted,
    isOwner,
    isUnlisted,
    listenCount,
    isActive,
    isDisabled,
    isLoading,
    isLandlordPick,
    artwork,
    rightActions,
    header,
    title,
    userName,
    duration,
    stats,
    fieldVisibility,
    bottomBar,
    isDarkMode,
    isMatrixMode,
    showIconButtons = true,
    containerClassName,
    onClickTitle,
    onClickRepost,
    onClickFavorite,
    onClickShare,
    onTogglePlay,
    showRankIcon
  }: AgreementTileProps) => {
    const hasOrdering = order !== undefined
    const onStopPropagation = useCallback(
      (e: MouseEvent) => e.stopPropagation(),
      []
    )
    const hideShare: boolean = fieldVisibility
      ? fieldVisibility.share === false
      : false
    const hidePlays = fieldVisibility
      ? fieldVisibility.play_count === false
      : false

    const renderShareButton = () => {
      return (
        <Tooltip
          text={'Share'}
          disabled={isDisabled || hideShare}
          placement={'bottom'}
        >
          <div
            className={cn(styles.iconButtonContainer, {
              [styles.isHidden]: hideShare
            })}
            onClick={onStopPropagation}
          >
            <ShareButton
              onClick={onClickShare}
              isDarkMode={!!isDarkMode}
              className={styles.iconButton}
              stopPropagation={false}
              isMatrixMode={isMatrixMode}
            />
          </div>
        </Tooltip>
      )
    }

    const repostLabel = isReposted
      ? messages.unrepostLabel
      : messages.repostLabel

    return (
      <div
        className={cn(styles.container, {
          [containerClassName!]: !!containerClassName,
          // Active indicates that the digital_content is the current queue item
          [styles.isActive]: isActive,
          [styles.isDisabled]: isDisabled,

          [styles.large]: size === AgreementTileSize.LARGE,
          [styles.small]: size === AgreementTileSize.SMALL,

          // Standalone means that this tile is not w/ a contentList
          [styles.standalone]: !!standalone
        })}
        onClick={isLoading || isDisabled ? undefined : onTogglePlay}
      >
        {/* prefix ordering */}
        <RankAndIndexIndicator
          hasOrdering={hasOrdering}
          showCrownIcon={showRankIcon}
          isLoading={!!isLoading}
          index={order ?? 0}
        />
        {/* DigitalContent tile image */}
        <div
          className={cn(styles.imageContainer, {
            [styles.leftSpacing]: !hasOrdering
          })}
        >
          {artwork}
        </div>
        {isLandlordPick && (
          <AgreementBannerIcon
            type={AgreementBannerIconType.STAR}
            isMatrixMode={isMatrixMode}
          />
        )}
        {isUnlisted && (
          <AgreementBannerIcon
            type={AgreementBannerIconType.HIDDEN}
            isMatrixMode={isMatrixMode}
          />
        )}
        <div
          className={cn(styles.body, {
            // if digital_content and not contentList/album
            [styles.withoutHeader]: true
          })}
        >
          <div className={cn(styles.topSection)}>
            <div className={cn(styles.headerRow)}>
              {!isLoading && header && <div>{header}</div>}
            </div>
            <div className={styles.titleRow}>
              {isLoading ? (
                <Skeleton width='80%' className={styles.skeleton} />
              ) : (
                <span className={styles.title} onClick={onClickTitle}>
                  {title}
                  {isActive ? (
                    <IconVolume className={styles.volumeIcon} />
                  ) : null}
                </span>
              )}
            </div>
            <div className={styles.creatorRow}>
              {isLoading ? (
                <Skeleton width='50%' className={styles.skeleton} />
              ) : (
                userName
              )}
            </div>

            <div
              className={cn(styles.socialsRow, {
                [styles.isHidden]: isUnlisted
              })}
            >
              {isLoading ? (
                <Skeleton width='30%' className={styles.skeleton} />
              ) : (
                stats
              )}
            </div>
            <div className={styles.topRight}>
              {isLandlordPick && (
                <div className={styles.topRightIconLabel}>
                  <IconStar className={styles.topRightIcon} />
                  {messages.landlordPick}
                </div>
              )}
              {isUnlisted && (
                <div className={styles.topRightIconLabel}>
                  <IconHidden className={styles.topRightIcon} />
                  {messages.hiddenAgreement}
                </div>
              )}
              {!isLoading && duration && (
                <div className={styles.duration}>{formatSeconds(duration)}</div>
              )}
            </div>
            <div className={styles.bottomRight}>
              {!isLoading && listenCount !== undefined && listenCount > 0 && (
                <div
                  className={cn(styles.plays, {
                    [styles.isHidden]: hidePlays
                  })}
                >
                  {formatCount(listenCount)}
                  {messages.getPlays(listenCount)}
                </div>
              )}
            </div>
          </div>
          <div className={styles.divider} />
          <div className={styles.bottomRow}>
            {bottomBar}
            {!isLoading && showIconButtons && isUnlisted && (
              <div className={styles.iconButtons}>{renderShareButton()}</div>
            )}
            {!isLoading && showIconButtons && !isUnlisted && (
              <div className={styles.iconButtons}>
                <Tooltip
                  text={repostLabel}
                  disabled={isDisabled || isOwner}
                  placement={'bottom'}
                >
                  <div
                    className={cn(styles.iconButtonContainer, {
                      [styles.isDisabled]: isOwner,
                      [styles.isHidden]: isUnlisted
                    })}
                  >
                    <RepostButton
                      aria-label={repostLabel}
                      onClick={onClickRepost}
                      isActive={isReposted}
                      isDisabled={isOwner}
                      isDarkMode={!!isDarkMode}
                      isMatrixMode={isMatrixMode}
                      wrapperClassName={styles.iconButton}
                    />
                  </div>
                </Tooltip>
                <Tooltip
                  text={isFavorited ? 'Unfavorite' : 'Favorite'}
                  disabled={isDisabled || isOwner}
                  placement={'bottom'}
                >
                  <div
                    className={cn(styles.iconButtonContainer, {
                      [styles.isDisabled]: isOwner,
                      [styles.isHidden]: isUnlisted
                    })}
                  >
                    <FavoriteButton
                      onClick={onClickFavorite}
                      isActive={isFavorited}
                      isDisabled={isOwner}
                      isDarkMode={!!isDarkMode}
                      isMatrixMode={isMatrixMode}
                      wrapperClassName={styles.iconButton}
                    />
                  </div>
                </Tooltip>
                {renderShareButton()}
              </div>
            )}
            {!isLoading && (
              <div onClick={onStopPropagation}>{rightActions}</div>
            )}
          </div>
        </div>
      </div>
    )
  }
)

export default memo(AgreementTile)
