import { memo, useState, useCallback, useEffect } from 'react'

import {
  UID,
  ID,
  ShareSource,
  RepostSource,
  FavoriteSource
} from '@coliving/common'
import cn from 'classnames'
import { push as pushRoute } from 'connected-react-router'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'

import { ReactComponent as IconKebabHorizontal } from 'assets/img/iconKebabHorizontal.svg'
import { getUserHandle } from 'common/store/account/selectors'
import { getAgreement } from 'common/store/cache/agreements/selectors'
import { getUserFromAgreement } from 'common/store/cache/users/selectors'
import {
  saveAgreement,
  unsaveAgreement,
  repostAgreement,
  undoRepostAgreement
} from 'common/store/social/agreements/actions'
import { requestOpen as requestOpenShareModal } from 'common/store/ui/share-modal/slice'
import { ArtistPopover } from 'components/artist/ArtistPopover'
import Draggable from 'components/dragndrop/Draggable'
import Menu from 'components/menu/Menu'
import { OwnProps as AgreementMenuProps } from 'components/menu/AgreementMenu'
import { AgreementArtwork } from 'components/agreement/desktop/Artwork'
import UserBadges from 'components/user-badges/UserBadges'
import {
  setUsers,
  setVisibility
} from 'store/application/ui/userListModal/slice'
import {
  UserListType,
  UserListEntityType
} from 'store/application/ui/userListModal/types'
import { getUid, getPlaying, getBuffering } from 'store/player/selectors'
import { AppState } from 'store/types'
import { fullAgreementPage, profilePage } from 'utils/route'
import { isDarkMode, isMatrix } from 'utils/theme/theme'

import { getAgreementWithFallback, getUserWithFallback } from '../helpers'
import { AgreementTileSize } from '../types'

import styles from './ConnectedAgreementTile.module.css'
import AgreementTile from './AgreementTile'
import Stats from './stats/Stats'
import { Flavor } from './stats/StatsText'

type OwnProps = {
  uid: UID
  index: number
  order: number
  containerClassName?: string
  size: AgreementTileSize
  showArtistPick: boolean
  ordered: boolean
  togglePlay: (uid: UID, id: ID) => void
  isLoading: boolean
  hasLoaded: (index: number) => void
  isTrending: boolean
  showRankIcon: boolean
}

type ConnectedAgreementTileProps = OwnProps &
  ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps>

const ConnectedAgreementTile = memo(
  ({
    uid,
    index,
    size,
    agreement,
    user,
    ordered,
    showArtistPick,
    goToRoute,
    togglePlay,
    isBuffering,
    isPlaying,
    playingUid,
    isLoading,
    hasLoaded,
    containerClassName,
    setRepostUsers,
    setFavoriteUsers,
    setModalVisibility,
    userHandle,
    saveAgreement,
    unsaveAgreement,
    repostAgreement,
    undoRepostAgreement,
    shareAgreement,
    isTrending,
    showRankIcon
  }: ConnectedAgreementTileProps) => {
    const {
      is_delete,
      is_unlisted: isUnlisted,
      agreement_id: agreementId,
      title,
      permalink,
      repost_count,
      save_count,
      field_visibility: fieldVisibility,
      followee_reposts,
      followee_saves,
      _co_sign: coSign,
      has_current_user_reposted: isReposted,
      has_current_user_saved: isFavorited,
      _cover_art_sizes,
      play_count,
      duration
    } = getAgreementWithFallback(agreement)

    const {
      _artist_pick,
      name,
      handle,
      is_deactivated: isOwnerDeactivated
    } = getUserWithFallback(user)

    const isActive = uid === playingUid
    const isAgreementBuffering = isActive && isBuffering
    const isAgreementPlaying = isActive && isPlaying
    const isOwner = handle === userHandle
    const isArtistPick = showArtistPick && _artist_pick === agreementId

    const onClickStatRepost = () => {
      setRepostUsers(agreementId)
      setModalVisibility()
    }

    const onClickStatFavorite = () => {
      setFavoriteUsers(agreementId)
      setModalVisibility()
    }

    const [artworkLoaded, setArtworkLoaded] = useState(false)
    useEffect(() => {
      if (artworkLoaded && !isLoading && hasLoaded) {
        hasLoaded(index)
      }
    }, [artworkLoaded, hasLoaded, index, isLoading])

    const renderImage = () => {
      const artworkProps = {
        id: agreementId,
        coverArtSizes: _cover_art_sizes,
        coSign: coSign || undefined,
        size: 'large',
        isBuffering: isAgreementBuffering,
        isPlaying: isAgreementPlaying,
        artworkIconClassName: styles.artworkIcon,
        showArtworkIcon: !isLoading,
        showSkeleton: isLoading,
        callback: () => setArtworkLoaded(true)
      }
      return <AgreementArtwork {...artworkProps} />
    }

    const renderOverflowMenu = () => {
      const menu: Omit<AgreementMenuProps, 'children'> = {
        extraMenuItems: [],
        handle,
        includeAddToContentList: true,
        includeArtistPick: handle === userHandle && !isUnlisted,
        includeEdit: handle === userHandle,
        includeEmbed: true,
        includeFavorite: false,
        includeRepost: false,
        includeShare: false,
        includeAgreementPage: true,
        isArtistPick,
        isDeleted: is_delete || isOwnerDeactivated,
        isFavorited,
        isOwner,
        isReposted,
        agreementId,
        agreementTitle: title,
        agreementPermalink: permalink,
        type: 'agreement'
      }

      return (
        <Menu menu={menu}>
          {(ref, triggerPopup) => (
            <div className={styles.menuContainer}>
              <div
                className={cn(styles.menuKebabContainer, {
                  [styles.small]: size === AgreementTileSize.SMALL,
                  [styles.large]: size === AgreementTileSize.LARGE
                })}
                onClick={triggerPopup}
              >
                <IconKebabHorizontal
                  className={cn(styles.iconKebabHorizontal)}
                  ref={ref}
                />
              </div>
            </div>
          )}
        </Menu>
      )
    }

    const onClickArtistName = useCallback(
      (e) => {
        e.stopPropagation()
        if (goToRoute) goToRoute(profilePage(handle))
      },
      [handle, goToRoute]
    )

    const onClickTitle = useCallback(
      (e) => {
        e.stopPropagation()
        if (goToRoute) goToRoute(permalink)
      },
      [goToRoute, permalink]
    )

    const renderUserName = () => {
      return (
        <div className={styles.userName}>
          <ArtistPopover handle={handle}>
            <span
              className={cn(styles.name, {
                [styles.artistNameLink]: onClickArtistName
              })}
              onClick={onClickArtistName}
            >
              {name}
            </span>
          </ArtistPopover>
          <UserBadges
            userId={user?.user_id ?? 0}
            badgeSize={14}
            className={styles.badgeWrapper}
          />
        </div>
      )
    }

    const renderStats = () => {
      const contentTitle = 'agreement' // undefined,  contentList or album -  undefined is agreement
      const statSize = 'large'
      return (
        <div className={cn(styles.socialInfo)}>
          <Stats
            hideImage={size === AgreementTileSize.SMALL}
            count={repost_count}
            followeeActions={followee_reposts}
            contentTitle={contentTitle}
            size={statSize}
            onClick={onClickStatRepost}
            flavor={Flavor.REPOST}
          />
          <Stats
            count={save_count}
            followeeActions={followee_saves}
            contentTitle={contentTitle}
            size={statSize}
            onClick={onClickStatFavorite}
            flavor={Flavor.FAVORITE}
          />
        </div>
      )
    }

    const onClickFavorite = useCallback(() => {
      if (isFavorited) {
        unsaveAgreement(agreementId)
      } else {
        saveAgreement(agreementId)
      }
    }, [saveAgreement, unsaveAgreement, agreementId, isFavorited])

    const onClickRepost = useCallback(() => {
      if (isReposted) {
        undoRepostAgreement(agreementId)
      } else {
        repostAgreement(agreementId)
      }
    }, [repostAgreement, undoRepostAgreement, agreementId, isReposted])

    const onClickShare = useCallback(() => {
      shareAgreement(agreementId)
    }, [shareAgreement, agreementId])

    const onTogglePlay = useCallback(() => {
      togglePlay(uid, agreementId)
    }, [togglePlay, uid, agreementId])

    if (is_delete || user?.is_deactivated) return null

    const order = ordered && index !== undefined ? index + 1 : undefined
    const artwork = renderImage()
    const stats = renderStats()
    const rightActions = renderOverflowMenu()
    const userName = renderUserName()

    const disableActions = false
    const showSkeleton = isLoading

    return (
      <Draggable
        text={title}
        kind='agreement'
        id={agreementId}
        isOwner={isOwner}
        isDisabled={disableActions || showSkeleton}
        link={fullAgreementPage(permalink)}
      >
        <AgreementTile
          size={size}
          order={order}
          standalone
          isFavorited={isFavorited}
          isReposted={isReposted}
          isOwner={isOwner}
          isUnlisted={isUnlisted}
          isLoading={isLoading}
          isDarkMode={isDarkMode()}
          isMatrixMode={isMatrix()}
          listenCount={play_count}
          isActive={isActive}
          isArtistPick={isArtistPick}
          artwork={artwork}
          rightActions={rightActions}
          title={title}
          userName={userName}
          duration={duration}
          stats={stats}
          fieldVisibility={fieldVisibility}
          containerClassName={cn(styles.container, {
            [containerClassName!]: !!containerClassName,
            [styles.loading]: isLoading,
            [styles.active]: isActive
          })}
          onClickTitle={onClickTitle}
          onClickRepost={onClickRepost}
          onClickFavorite={onClickFavorite}
          onClickShare={onClickShare}
          onTogglePlay={onTogglePlay}
          isTrending={isTrending}
          showRankIcon={showRankIcon}
        />
      </Draggable>
    )
  }
)

function mapStateToProps(state: AppState, ownProps: OwnProps) {
  return {
    agreement: getAgreement(state, { uid: ownProps.uid }),
    user: getUserFromAgreement(state, { uid: ownProps.uid }),
    playingUid: getUid(state),
    isBuffering: getBuffering(state),
    isPlaying: getPlaying(state),
    userHandle: getUserHandle(state)
  }
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    goToRoute: (route: string) => dispatch(pushRoute(route)),
    shareAgreement: (agreementId: ID) =>
      dispatch(
        requestOpenShareModal({
          type: 'agreement',
          agreementId,
          source: ShareSource.TILE
        })
      ),
    repostAgreement: (agreementId: ID) =>
      dispatch(repostAgreement(agreementId, RepostSource.TILE)),
    undoRepostAgreement: (agreementId: ID) =>
      dispatch(undoRepostAgreement(agreementId, RepostSource.TILE)),
    saveAgreement: (agreementId: ID) =>
      dispatch(saveAgreement(agreementId, FavoriteSource.TILE)),
    unsaveAgreement: (agreementId: ID) =>
      dispatch(unsaveAgreement(agreementId, FavoriteSource.TILE)),

    setRepostUsers: (agreementID: ID) =>
      dispatch(
        setUsers({
          userListType: UserListType.REPOST,
          entityType: UserListEntityType.AGREEMENT,
          id: agreementID
        })
      ),
    setFavoriteUsers: (agreementID: ID) =>
      dispatch(
        setUsers({
          userListType: UserListType.FAVORITE,
          entityType: UserListEntityType.AGREEMENT,
          id: agreementID
        })
      ),
    setModalVisibility: () => dispatch(setVisibility(true))
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ConnectedAgreementTile)
