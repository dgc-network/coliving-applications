import { memo, ReactChildren, useCallback } from 'react'

import { IconArrow, Scrollbar } from '@coliving/stems'
import cn from 'classnames'

import {
  DigitalContentTileSize,
  DesktopContentListTileProps as ContentListTileProps
} from 'components/digital_content/types'

import styles from './ContentListTile.module.css'
import DigitalContentTile from './digitalContentTile'

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
    digitalContentsContainerClassName,
    onClickTitle,
    onClickRepost,
    onClickFavorite,
    onClickShare,
    onTogglePlay,
    digitalContentList,
    digitalContentCount,
    isTrending,
    showRankIcon,
    TileDigitalContentContainer = DefaultTileContainer
  }: ContentListTileProps) => {
    const renderDigitalContents = useCallback(
      () => (
        <Scrollbar
          className={cn(styles.contentListDigitalContents, {
            [digitalContentsContainerClassName!]: !!digitalContentsContainerClassName
          })}
        >
          {digitalContentList}
        </Scrollbar>
      ),
      [digitalContentsContainerClassName, digitalContentList]
    )

    const renderMoreDigitalContents = useCallback(() => {
      const hasMoreDigitalContents = digitalContentCount ? digitalContentCount > digitalContentList.length : false
      return (
        !isLoading &&
        hasMoreDigitalContents && (
          <div onClick={onClickTitle} className={styles.moreDigitalContents}>
            {`${digitalContentCount - digitalContentList.length} More DigitalContents`}
            <IconArrow className={styles.moreArrow} />
          </div>
        )
      )
    }, [digitalContentCount, digitalContentList, onClickTitle, isLoading])

    return (
      <div
        className={cn(styles.container, {
          [containerClassName!]: !!containerClassName,
          [styles.small]: size === DigitalContentTileSize.SMALL,
          [styles.large]: size === DigitalContentTileSize.LARGE,
          [styles.disabled]: !!isDisabled
        })}
      >
        <TileDigitalContentContainer>
          <DigitalContentTile
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
        </TileDigitalContentContainer>
        {renderDigitalContents()}
        {renderMoreDigitalContents()}
      </div>
    )
  }
)

export default ContentListTile
