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
import { getDigitalContent } from 'common/store/cache/digital_contents/selectors'
import { getUserFromDigitalContent } from 'common/store/cache/users/selectors'
import {
  saveDigitalContent,
  unsaveDigitalContent,
  repostDigitalContent,
  undoRepostDigitalContent
} from 'common/store/social/digital_contents/actions'
import { requestOpen as requestOpenShareModal } from 'common/store/ui/shareModal/slice'
import { LandlordPopover } from 'components/author/landlordPopover'
import Draggable from 'components/dragndrop/draggable'
import Menu from 'components/menu/menu'
import { OwnProps as DigitalContentMenuProps } from 'components/menu/digitalContentMenu'
import { DigitalContentArtwork } from 'components/digital_content/desktop/Artwork'
import UserBadges from 'components/userBadges/userBadges'
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
import { fullDigitalContentPage, profilePage } from 'utils/route'
import { isDarkMode, isMatrix } from 'utils/theme/theme'

import { getDigitalContentWithFallback, getUserWithFallback } from '../helpers'
import { DigitalContentTileSize } from '../types'

import styles from './ConnectedDigitalContentTile.module.css'
import DigitalContentTile from './digitalContentTile'
import Stats from './stats/stats'
import { Flavor } from './stats/statsText'

type OwnProps = {
  uid: UID
  index: number
  order: number
  containerClassName?: string
  size: DigitalContentTileSize
  showLandlordPick: boolean
  ordered: boolean
  togglePlay: (uid: UID, id: ID) => void
  isLoading: boolean
  hasLoaded: (index: number) => void
  isTrending: boolean
  showRankIcon: boolean
}

type ConnectedDigitalContentTileProps = OwnProps &
  ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps>

const ConnectedDigitalContentTile = memo(
  ({
    uid,
    index,
    size,
    digital_content,
    user,
    ordered,
    showLandlordPick,
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
    saveDigitalContent,
    unsaveDigitalContent,
    repostDigitalContent,
    undoRepostDigitalContent,
    shareDigitalContent,
    isTrending,
    showRankIcon
  }: ConnectedDigitalContentTileProps) => {
    const {
      is_delete,
      is_unlisted: isUnlisted,
      digital_content_id: digitalContentId,
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
    } = getDigitalContentWithFallback(digital_content)

    const {
      _landlord_pick,
      name,
      handle,
      is_deactivated: isOwnerDeactivated
    } = getUserWithFallback(user)

    const isActive = uid === playingUid
    const isDigitalContentBuffering = isActive && isBuffering
    const isDigitalContentPlaying = isActive && isPlaying
    const isOwner = handle === userHandle
    const isLandlordPick = showLandlordPick && _landlord_pick === digitalContentId

    const onClickStatRepost = () => {
      setRepostUsers(digitalContentId)
      setModalVisibility()
    }

    const onClickStatFavorite = () => {
      setFavoriteUsers(digitalContentId)
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
        id: digitalContentId,
        coverArtSizes: _cover_art_sizes,
        coSign: coSign || undefined,
        size: 'large',
        isBuffering: isDigitalContentBuffering,
        isPlaying: isDigitalContentPlaying,
        artworkIconClassName: styles.artworkIcon,
        showArtworkIcon: !isLoading,
        showSkeleton: isLoading,
        callback: () => setArtworkLoaded(true)
      }
      return <DigitalContentArtwork {...artworkProps} />
    }

    const renderOverflowMenu = () => {
      const menu: Omit<DigitalContentMenuProps, 'children'> = {
        extraMenuItems: [],
        handle,
        includeAddToContentList: true,
        includeLandlordPick: handle === userHandle && !isUnlisted,
        includeEdit: handle === userHandle,
        includeEmbed: true,
        includeFavorite: false,
        includeRepost: false,
        includeShare: false,
        includeDigitalContentPage: true,
        isLandlordPick,
        isDeleted: is_delete || isOwnerDeactivated,
        isFavorited,
        isOwner,
        isReposted,
        digitalContentId,
        digitalContentTitle: title,
        digitalContentPermalink: permalink,
        type: 'digital_content'
      }

      return (
        <Menu menu={menu}>
          {(ref, triggerPopup) => (
            <div className={styles.menuContainer}>
              <div
                className={cn(styles.menuKebabContainer, {
                  [styles.small]: size === DigitalContentTileSize.SMALL,
                  [styles.large]: size === DigitalContentTileSize.LARGE
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

    const onClickLandlordName = useCallback(
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
          <LandlordPopover handle={handle}>
            <span
              className={cn(styles.name, {
                [styles.landlordNameLink]: onClickLandlordName
              })}
              onClick={onClickLandlordName}
            >
              {name}
            </span>
          </LandlordPopover>
          <UserBadges
            userId={user?.user_id ?? 0}
            badgeSize={14}
            className={styles.badgeWrapper}
          />
        </div>
      )
    }

    const renderStats = () => {
      const contentTitle = 'digital_content' // undefined,  contentList or album -  undefined is digital_content
      const statSize = 'large'
      return (
        <div className={cn(styles.socialInfo)}>
          <Stats
            hideImage={size === DigitalContentTileSize.SMALL}
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
        unsaveDigitalContent(digitalContentId)
      } else {
        saveDigitalContent(digitalContentId)
      }
    }, [saveDigitalContent, unsaveDigitalContent, digitalContentId, isFavorited])

    const onClickRepost = useCallback(() => {
      if (isReposted) {
        undoRepostDigitalContent(digitalContentId)
      } else {
        repostDigitalContent(digitalContentId)
      }
    }, [repostDigitalContent, undoRepostDigitalContent, digitalContentId, isReposted])

    const onClickShare = useCallback(() => {
      shareDigitalContent(digitalContentId)
    }, [shareDigitalContent, digitalContentId])

    const onTogglePlay = useCallback(() => {
      togglePlay(uid, digitalContentId)
    }, [togglePlay, uid, digitalContentId])

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
        kind='digital_content'
        id={digitalContentId}
        isOwner={isOwner}
        isDisabled={disableActions || showSkeleton}
        link={fullDigitalContentPage(permalink)}
      >
        <DigitalContentTile
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
          isLandlordPick={isLandlordPick}
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
    digital_content: getDigitalContent(state, { uid: ownProps.uid }),
    user: getUserFromDigitalContent(state, { uid: ownProps.uid }),
    playingUid: getUid(state),
    isBuffering: getBuffering(state),
    isPlaying: getPlaying(state),
    userHandle: getUserHandle(state)
  }
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    goToRoute: (route: string) => dispatch(pushRoute(route)),
    shareDigitalContent: (digitalContentId: ID) =>
      dispatch(
        requestOpenShareModal({
          type: 'digital_content',
          digitalContentId,
          source: ShareSource.TILE
        })
      ),
    repostDigitalContent: (digitalContentId: ID) =>
      dispatch(repostDigitalContent(digitalContentId, RepostSource.TILE)),
    undoRepostDigitalContent: (digitalContentId: ID) =>
      dispatch(undoRepostDigitalContent(digitalContentId, RepostSource.TILE)),
    saveDigitalContent: (digitalContentId: ID) =>
      dispatch(saveDigitalContent(digitalContentId, FavoriteSource.TILE)),
    unsaveDigitalContent: (digitalContentId: ID) =>
      dispatch(unsaveDigitalContent(digitalContentId, FavoriteSource.TILE)),

    setRepostUsers: (digitalContentID: ID) =>
      dispatch(
        setUsers({
          userListType: UserListType.REPOST,
          entityType: UserListEntityType.AGREEMENT,
          id: digitalContentID
        })
      ),
    setFavoriteUsers: (digitalContentID: ID) =>
      dispatch(
        setUsers({
          userListType: UserListType.FAVORITE,
          entityType: UserListEntityType.AGREEMENT,
          id: digitalContentID
        })
      ),
    setModalVisibility: () => dispatch(setVisibility(true))
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ConnectedDigitalContentTile)
