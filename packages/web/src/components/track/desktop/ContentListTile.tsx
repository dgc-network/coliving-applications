import { memo, ReactChildren, useCallback } from 'react'

import { IconArrow, Scrollbar } from '@coliving/stems'
import cn from 'classnames'

import {
  AgreementTileSize,
  DesktopContentListTileProps as ContentListTileProps
} from 'components/agreement/types'

import styles from './ContentListTile.module.css'
import AgreementTile from './AgreementTile'

const DefaultTileContainer = ({ children }: { children: ReactChildren }) =>
  children

const ContentListTile = memo(
  ({
    size,
    order,
    isFavorited,
    isReposted,
    isOwner,
    isLoading,
    isActive,
    isDisabled,
    isDarkMode,
    isMatrixMode,
    artwork,
    rightActions,
    header,
    title,
    userName,
    duration,
    stats,
    bottomBar,
    showIconButtons,
    containerClassName,
    tileClassName,
    agreementsContainerClassName,
    onClickTitle,
    onClickRepost,
    onClickFavorite,
    onClickShare,
    onTogglePlay,
    agreementList,
    agreementCount,
    isTrending,
    showRankIcon,
    TileAgreementContainer = DefaultTileContainer
  }: ContentListTileProps) => {
    const renderAgreements = useCallback(
      () => (
        <Scrollbar
          className={cn(styles.contentListAgreements, {
            [agreementsContainerClassName!]: !!agreementsContainerClassName
          })}
        >
          {agreementList}
        </Scrollbar>
      ),
      [agreementsContainerClassName, agreementList]
    )

    const renderMoreAgreements = useCallback(() => {
      const hasMoreAgreements = agreementCount ? agreementCount > agreementList.length : false
      return (
        !isLoading &&
        hasMoreAgreements && (
          <div onClick={onClickTitle} className={styles.moreAgreements}>
            {`${agreementCount - agreementList.length} More Agreements`}
            <IconArrow className={styles.moreArrow} />
          </div>
        )
      )
    }, [agreementCount, agreementList, onClickTitle, isLoading])

    return (
      <div
        className={cn(styles.container, {
          [containerClassName!]: !!containerClassName,
          [styles.small]: size === AgreementTileSize.SMALL,
          [styles.large]: size === AgreementTileSize.LARGE,
          [styles.disabled]: !!isDisabled
        })}
      >
        <TileAgreementContainer>
          <AgreementTile
            size={size}
            order={order}
            isFavorited={isFavorited}
            isReposted={isReposted}
            isOwner={isOwner}
            isLoading={isLoading}
            isActive={isActive}
            isDisabled={isDisabled}
            isDarkMode={isDarkMode}
            isMatrixMode={isMatrixMode}
            artwork={artwork}
            rightActions={rightActions}
            header={header}
            title={title}
            userName={userName}
            duration={duration}
            stats={stats}
            bottomBar={bottomBar}
            showIconButtons={showIconButtons}
            containerClassName={tileClassName}
            onClickTitle={onClickTitle}
            onClickRepost={onClickRepost}
            onClickFavorite={onClickFavorite}
            onClickShare={onClickShare}
            onTogglePlay={onTogglePlay}
            showRankIcon={showRankIcon}
            isTrending={isTrending}
          />
        </TileAgreementContainer>
        {renderAgreements()}
        {renderMoreAgreements()}
      </div>
    )
  }
)

export default ContentListTile
