import { memo, MouseEvent } from 'react'

import { UID, ID } from '@coliving/common'
import cn from 'classnames'

import { ReactComponent as IconKebabHorizontal } from 'assets/img/iconKebabHorizontal.svg'
import { EnhancedCollectionAgreement } from 'common/store/cache/collections/selectors'
import { formatSeconds } from 'common/utils/timeUtil'
import { ArtistPopover } from 'components/artist/ArtistPopover'
import Menu from 'components/menu/Menu'
import { OwnProps as AgreementMenuProps } from 'components/menu/AgreementMenu'
import Skeleton from 'components/skeleton/Skeleton'
import TablePlayButton from 'components/agreements-table/TablePlayButton'
import { profilePage } from 'utils/route'

import { AgreementTileSize } from '../types'

import styles from './AgreementListItem.module.css'

const makeStrings = ({ deleted }: { deleted: boolean }) => ({
  deleted: deleted ? ` [Deleted By Artist]` : '',
  by: 'by'
})

type AgreementListItemProps = {
  index: number
  isLoading: boolean
  active: boolean
  size: AgreementTileSize
  disableActions: boolean
  playing: boolean
  togglePlay: (uid: UID, id: ID) => void
  goToRoute: (route: string) => void
  artistHandle: string
  agreement?: EnhancedCollectionAgreement
  forceSkeleton?: boolean
}

const AgreementListItem = ({
  agreement,
  active,
  disableActions,
  playing,
  index,
  size,
  goToRoute,
  togglePlay,
  isLoading,
  forceSkeleton = false
}: AgreementListItemProps) => {
  if (forceSkeleton) {
    return (
      <div
        className={cn(styles.content listAgreement, {
          [styles.large]: size === AgreementTileSize.LARGE,
          [styles.small]: size === AgreementTileSize.SMALL
        })}
      >
        <Skeleton className={styles.skeleton} width='96%' height='80%' />
      </div>
    )
  }

  if (!agreement) return null

  const deleted = agreement.is_delete || !!agreement.user?.is_deactivated
  const strings = makeStrings({ deleted })

  const onClickArtistName = (e: MouseEvent) => {
    e.stopPropagation()
    if (goToRoute) goToRoute(profilePage(agreement.user.handle))
  }

  const onClickAgreementName = (e: MouseEvent) => {
    if (!disableActions && !deleted) {
      e.stopPropagation()
      if (goToRoute) goToRoute(agreement.permalink)
    }
  }

  const onMoreClick = (triggerPopup: () => void) => (e: MouseEvent) => {
    e.stopPropagation()
    triggerPopup()
  }

  const onPlayAgreement = () => {
    if (!deleted && togglePlay) togglePlay(agreement.uid, agreement.agreement_id)
  }

  const hideShow = cn({
    [styles.hide]: isLoading,
    [styles.show]: !isLoading
  })

  const menu: Omit<AgreementMenuProps, 'children'> = {
    handle: agreement.user.handle,
    includeAddToPlaylist: true,
    includeArtistPick: false,
    includeEdit: false,
    includeFavorite: true,
    includeRepost: true,
    includeShare: false,
    includeAgreementPage: true,
    isArtistPick: agreement.user._artist_pick === agreement.agreement_id,
    isDeleted: deleted,
    isFavorited: agreement.has_current_user_saved,
    isOwner: false,
    isOwnerDeactivated: !!agreement.user?.is_deactivated,
    isReposted: agreement.has_current_user_reposted,
    agreementId: agreement.agreement_id,
    agreementTitle: agreement.title,
    agreementPermalink: agreement.permalink,
    type: 'agreement'
  }

  return (
    <div
      className={cn(styles.content listAgreement, {
        [styles.large]: size === AgreementTileSize.LARGE,
        [styles.small]: size === AgreementTileSize.SMALL,
        [styles.deleted]: deleted,
        [styles.active]: active,
        [styles.disabled]: disableActions || deleted,
        [styles.noBorder]: isLoading
      })}
      onClick={onPlayAgreement}
    >
      {isLoading && (
        <Skeleton className={styles.skeleton} width='96%' height='80%' />
      )}
      <div className={cn(styles.wrapper, hideShow)}>
        {deleted && size !== AgreementTileSize.SMALL ? (
          <div className={styles.listButton} style={{ height: 24 }} />
        ) : null}
        {!disableActions && size !== AgreementTileSize.SMALL && !deleted ? (
          <div className={styles.listButton}>
            <TablePlayButton
              playing={active}
              paused={!playing}
              hideDefault={false}
            />
          </div>
        ) : null}
        <div className={styles.agreementNumber}>{index + 1}</div>
        <div className={styles.nameArtistContainer}>
          <div className={styles.agreementTitle} onClick={onClickAgreementName}>
            {agreement.title}
            {strings.deleted}
          </div>
          <div className={styles.artistName} onClick={onClickArtistName}>
            <div className={styles.by}>{strings.by}</div>
            {agreement.user.is_deactivated ? (
              `${agreement.user.name} [Deactivated]`
            ) : (
              <ArtistPopover handle={agreement.user.handle}>
                {agreement.user.name}
              </ArtistPopover>
            )}
          </div>
        </div>
        <div className={styles.duration}>
          {agreement.duration && formatSeconds(agreement.duration)}
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

export default memo(AgreementListItem)
