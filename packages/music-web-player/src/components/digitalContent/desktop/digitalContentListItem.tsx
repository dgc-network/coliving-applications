import { memo, MouseEvent } from 'react'

import { UID, ID } from '@coliving/common'
import cn from 'classnames'

import { ReactComponent as IconKebabHorizontal } from 'assets/img/iconKebabHorizontal.svg'
import { EnhancedCollectionDigitalContent } from 'common/store/cache/collections/selectors'
import { formatSeconds } from 'common/utils/timeUtil'
import { LandlordPopover } from 'components/author/landlordPopover'
import Menu from 'components/menu/menu'
import { OwnProps as DigitalContentMenuProps } from 'components/menu/digitalContentMenu'
import Skeleton from 'components/skeleton/skeleton'
import TablePlayButton from 'components/digitalContentsTable/tablePlayButton'
import { profilePage } from 'utils/route'

import { DigitalContentTileSize } from '../types'

import styles from './DigitalContentListItem.module.css'

const makeStrings = ({ deleted }: { deleted: boolean }) => ({
  deleted: deleted ? ` [Deleted By Author]` : '',
  by: 'by'
})

type DigitalContentListItemProps = {
  index: number
  isLoading: boolean
  active: boolean
  size: DigitalContentTileSize
  disableActions: boolean
  playing: boolean
  togglePlay: (uid: UID, id: ID) => void
  goToRoute: (route: string) => void
  landlordHandle: string
  digital_content?: EnhancedCollectionDigitalContent
  forceSkeleton?: boolean
}

const DigitalContentListItem = ({
  digital_content,
  active,
  disableActions,
  playing,
  index,
  size,
  goToRoute,
  togglePlay,
  isLoading,
  forceSkeleton = false
}: DigitalContentListItemProps) => {
  if (forceSkeleton) {
    return (
      <div
        className={cn(styles.contentListDigitalContent, {
          [styles.large]: size === DigitalContentTileSize.LARGE,
          [styles.small]: size === DigitalContentTileSize.SMALL
        })}
      >
        <Skeleton className={styles.skeleton} width='96%' height='80%' />
      </div>
    )
  }

  if (!digital_content) return null

  const deleted = digital_content.is_delete || !!digital_content.user?.is_deactivated
  const strings = makeStrings({ deleted })

  const onClickLandlordName = (e: MouseEvent) => {
    e.stopPropagation()
    if (goToRoute) goToRoute(profilePage(digital_content.user.handle))
  }

  const onClickDigitalContentName = (e: MouseEvent) => {
    if (!disableActions && !deleted) {
      e.stopPropagation()
      if (goToRoute) goToRoute(digital_content.permalink)
    }
  }

  const onMoreClick = (triggerPopup: () => void) => (e: MouseEvent) => {
    e.stopPropagation()
    triggerPopup()
  }

  const onPlayDigitalContent = () => {
    if (!deleted && togglePlay) togglePlay(digital_content.uid, digital_content.digital_content_id)
  }

  const hideShow = cn({
    [styles.hide]: isLoading,
    [styles.show]: !isLoading
  })

  const menu: Omit<DigitalContentMenuProps, 'children'> = {
    handle: digital_content.user.handle,
    includeAddToContentList: true,
    includeLandlordPick: false,
    includeEdit: false,
    includeFavorite: true,
    includeRepost: true,
    includeShare: false,
    includeDigitalContentPage: true,
    isLandlordPick: digital_content.user._landlord_pick === digital_content.digital_content_id,
    isDeleted: deleted,
    isFavorited: digital_content.has_current_user_saved,
    isOwner: false,
    isOwnerDeactivated: !!digital_content.user?.is_deactivated,
    isReposted: digital_content.has_current_user_reposted,
    digitalContentId: digital_content.digital_content_id,
    digitalContentTitle: digital_content.title,
    digitalContentPermalink: digital_content.permalink,
    type: 'digital_content'
  }

  return (
    <div
      className={cn(styles.contentListDigitalContent, {
        [styles.large]: size === DigitalContentTileSize.LARGE,
        [styles.small]: size === DigitalContentTileSize.SMALL,
        [styles.deleted]: deleted,
        [styles.active]: active,
        [styles.disabled]: disableActions || deleted,
        [styles.noBorder]: isLoading
      })}
      onClick={onPlayDigitalContent}
    >
      {isLoading && (
        <Skeleton className={styles.skeleton} width='96%' height='80%' />
      )}
      <div className={cn(styles.wrapper, hideShow)}>
        {deleted && size !== DigitalContentTileSize.SMALL ? (
          <div className={styles.listButton} style={{ height: 24 }} />
        ) : null}
        {!disableActions && size !== DigitalContentTileSize.SMALL && !deleted ? (
          <div className={styles.listButton}>
            <TablePlayButton
              playing={active}
              paused={!playing}
              hideDefault={false}
            />
          </div>
        ) : null}
        <div className={styles.digitalContentNumber}>{index + 1}</div>
        <div className={styles.nameLandlordContainer}>
          <div className={styles.digitalContentTitle} onClick={onClickDigitalContentName}>
            {digital_content.title}
            {strings.deleted}
          </div>
          <div className={styles.landlordName} onClick={onClickLandlordName}>
            <div className={styles.by}>{strings.by}</div>
            {digital_content.user.is_deactivated ? (
              `${digital_content.user.name} [Deactivated]`
            ) : (
              <LandlordPopover handle={digital_content.user.handle}>
                {digital_content.user.name}
              </LandlordPopover>
            )}
          </div>
        </div>
        <div className={styles.duration}>
          {digital_content.duration && formatSeconds(digital_content.duration)}
        </div>
        {deleted ? <div className={styles.more} style={{ width: 16 }} /> : null}
        {!disableActions && !deleted ? (
          <Menu menu={menu}>
            {(ref, triggerPopup) => (
              <div className={cn(styles.menuContainer)}>
                <IconKebabHorizontal
                  className={styles.iconKebabHorizontal}
                  ref={ref}
                  onClick={onMoreClick(triggerPopup)}
                />
              </div>
            )}
          </Menu>
        ) : null}
      </div>
    </div>
  )
}

export default memo(DigitalContentListItem)
