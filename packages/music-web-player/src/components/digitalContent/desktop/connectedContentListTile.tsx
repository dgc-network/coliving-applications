import {
  MouseEvent,
  memo,
  useMemo,
  useState,
  useEffect,
  useCallback,
  ReactChildren
} from 'react'

import {
  UID,
  ID,
  ShareSource,
  RepostSource,
  FavoriteSource,
  PlaybackSource,
  Name,
  DigitalContent
} from '@coliving/common'
import cn from 'classnames'
import { push as pushRoute } from 'connected-react-router'
import { range } from 'lodash'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'

import { ReactComponent as IconKebabHorizontal } from 'assets/img/iconKebabHorizontal.svg'
import { getUserHandle } from 'common/store/account/selectors'
import {
  getCollection,
  getDigitalContentsFromCollection
} from 'common/store/cache/collections/selectors'
import { getUserFromCollection } from 'common/store/cache/users/selectors'
import {
  saveCollection,
  unsaveCollection,
  repostCollection,
  undoRepostCollection
} from 'common/store/social/collections/actions'
import { requestOpen as requestOpenShareModal } from 'common/store/ui/shareModal/slice'
import { LandlordPopover } from 'components/author/landlordPopover'
import Draggable from 'components/dragndrop/draggable'
import { OwnProps as CollectionkMenuProps } from 'components/menu/collectionMenu'
import Menu from 'components/menu/menu'
import { CollectionArtwork } from 'components/digital_content/desktop/Artwork'
import { DigitalContentTileSize } from 'components/digital_content/types'
import UserBadges from 'components/userBadges/userBadges'
import { DigitalContentEvent, make } from 'store/analytics/actions'
import {
  setUsers,
  setVisibility
} from 'store/application/ui/userListModal/slice'
import {
  UserListType,
  UserListEntityType
} from 'store/application/ui/userListModal/types'
import { getUid, getBuffering, getPlaying } from 'store/player/selectors'
import { AppState } from 'store/types'
import {
  albumPage,
  fullAlbumPage,
  fullContentListPage,
  fullDigitalContentPage,
  contentListPage,
  profilePage
} from 'utils/route'
import { isDarkMode, isMatrix } from 'utils/theme/theme'

import { getCollectionWithFallback, getUserWithFallback } from '../helpers'

import styles from './ConnectedContentListTile.module.css'
import ContentListTile from './contentListTile'
import DigitalContentListItem from './digitalContentListItem'
import Stats from './stats/stats'
import { Flavor } from './stats/statsText'

type OwnProps = {
  uid: UID
  ordered: boolean
  index: number
  size: DigitalContentTileSize
  containerClassName?: string
  togglePlay: () => void
  playDigitalContent: (uid: string) => void
  playingDigitalContentId?: ID
  pauseDigitalContent: () => void
  isUploading?: boolean
  isLoading: boolean
  hasLoaded: (index: number) => void
  numLoadingSkeletonRows?: number
  isTrending: boolean
  showRankIcon: boolean
}

type ConnectedContentListTileProps = OwnProps &
  ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps>

const ConnectedContentListTile = memo(
  ({
    ordered,
    index,
    size,
    collection,
    userHandle,
    containerClassName,
    user,
    digitalContents,
    togglePlay,
    playDigitalContent,
    pauseDigitalContent,
    playingUid,
    isBuffering,
    isPlaying,
    goToRoute,
    record,
    playingDigitalContentId,
    isLoading,
    numLoadingSkeletonRows,
    isUploading,
    hasLoaded,
    setRepostUsers,
    setFavoriteUsers,
    setModalVisibility,
    shareCollection,
    repostCollection,
    undoRepostCollection,
    saveCollection,
    unsaveCollection,
    isTrending,
    showRankIcon
  }: ConnectedContentListTileProps) => {
    const {
      is_album: isAlbum,
      content_list_name: title,
      content_list_id: id,
      is_private: isPrivate,
      _cover_art_sizes: coverArtSizes,
      repost_count: repostCount,
      save_count: saveCount,
      followee_reposts: followeeReposts,
      followee_saves: followeeSaves,
      has_current_user_reposted: isReposted,
      has_current_user_saved: isFavorited,
      digital_content_count: digitalContentCount
    } = getCollectionWithFallback(collection)

    const {
      name,
      handle,
      is_deactivated: isOwnerDeactivated
    } = getUserWithFallback(user)
    const isOwner = handle === userHandle

    const isActive = useMemo(() => {
      return digitalContents.some((digital_content: any) => digital_content.uid === playingUid)
    }, [digitalContents, playingUid])

    const onTogglePlay = useCallback(() => {
      if (isUploading) return
      if (!isActive || !isPlaying) {
        if (isActive) {
          playDigitalContent(playingUid!)
          if (record) {
            record(
              make(Name.PLAYBACK_PLAY, {
                id: `${playingDigitalContentId}`,
                source: PlaybackSource.CONTENT_LIST_TILE_DIGITAL_CONTENT
              })
            )
          }
        } else {
          const digitalContentUid = digitalContents[0] ? digitalContents[0].uid : null
          const digitalContentId = digitalContents[0] ? digitalContents[0].digital_content_id : null
          if (!digitalContentUid || !digitalContentId) return
          playDigitalContent(digitalContentUid)
          if (record) {
            record(
              make(Name.PLAYBACK_PLAY, {
                id: `${digitalContentId}`,
                source: PlaybackSource.CONTENT_LIST_TILE_DIGITAL_CONTENT
              })
            )
          }
        }
      } else {
        pauseDigitalContent()
        if (record) {
          record(
            make(Name.PLAYBACK_PAUSE, {
              id: `${playingDigitalContentId}`,
              source: PlaybackSource.CONTENT_LIST_TILE_DIGITAL_CONTENT
            })
          )
        }
      }
    }, [
      isPlaying,
      digitalContents,
      playDigitalContent,
      pauseDigitalContent,
      isActive,
      playingUid,
      playingDigitalContentId,
      isUploading,
      record
    ])

    const onClickTitle = useCallback(
      (e: MouseEvent) => {
        e.stopPropagation()
        goToRoute(
          isAlbum
            ? albumPage(handle, title, id)
            : contentListPage(handle, title, id)
        )
      },
      [goToRoute, isAlbum, handle, title, id]
    )

    const [artworkLoaded, setArtworkLoaded] = useState(false)
    useEffect(() => {
      if (artworkLoaded && !isLoading && hasLoaded) {
        hasLoaded(index)
      }
    }, [artworkLoaded, hasLoaded, index, isLoading])

    const renderImage = useCallback(() => {
      const artworkProps = {
        id,
        coverArtSizes,
        size: 'large',
        isBuffering: isBuffering && isActive,
        isPlaying: isPlaying && isActive,
        artworkIconClassName: styles.artworkIcon,
        showArtworkIcon: !isLoading,
        showSkeleton: isLoading,
        callback: () => setArtworkLoaded(true)
      }
      return <CollectionArtwork {...artworkProps} />
    }, [
      id,
      coverArtSizes,
      isActive,
      isBuffering,
      isPlaying,
      isLoading,
      setArtworkLoaded
    ])

    const renderOverflowMenu = () => {
      const menu: Omit<CollectionkMenuProps, 'children'> = {
        handle,
        isFavorited,
        isReposted,
        type: isAlbum ? 'album' : 'contentList', // contentList or album
        contentListId: id,
        contentListName: title,
        isPublic: !isPrivate,
        isOwner,
        includeEmbed: true,
        includeShare: false,
        includeRepost: false,
        includeFavorite: false,
        includeVisitPage: true,
        extraMenuItems: []
      }

      return (
        <Menu menu={menu}>
          {(ref, triggerPopup) => (
            <div className={styles.menuContainer}>
              <div className={styles.menuKebabContainer} onClick={triggerPopup}>
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

    const renderUserName = () => {
      return (
        <div className={styles.userName}>
          <span className={styles.createdBy}>{'Created by'}</span>
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
            className={styles.iconVerified}
            badgeSize={14}
          />
        </div>
      )
    }

    const onClickStatFavorite = useCallback(() => {
      setFavoriteUsers(id!)
      setModalVisibility()
    }, [setFavoriteUsers, id, setModalVisibility])

    const onClickStatRepost = useCallback(() => {
      setRepostUsers(id!)
      setModalVisibility()
    }, [setRepostUsers, id, setModalVisibility])

    const renderStats = () => {
      const contentTitle = 'digital_content' // undefined,  contentList or album -  undefined is digital_content
      const sz = 'large'
      return (
        <div className={cn(styles.socialInfo)}>
          <Stats
            hideImage={size === DigitalContentTileSize.SMALL}
            count={repostCount}
            followeeActions={followeeReposts}
            contentTitle={contentTitle}
            size={sz}
            onClick={onClickStatRepost}
            flavor={Flavor.REPOST}
          />
          <Stats
            count={saveCount}
            followeeActions={followeeSaves}
            contentTitle={contentTitle}
            size={sz}
            onClick={onClickStatFavorite}
            flavor={Flavor.FAVORITE}
          />
        </div>
      )
    }

    const onClickFavorite = useCallback(() => {
      if (isFavorited) {
        unsaveCollection(id)
      } else {
        saveCollection(id)
      }
    }, [saveCollection, unsaveCollection, id, isFavorited])

    const onClickRepost = useCallback(() => {
      if (isReposted) {
        undoRepostCollection(id)
      } else {
        repostCollection(id)
      }
    }, [repostCollection, undoRepostCollection, id, isReposted])

    const onClickShare = useCallback(() => {
      shareCollection(id)
    }, [shareCollection, id])

    const disableActions = false

    const TileDigitalContentContainer = useCallback(
      ({ children }: { children: ReactChildren }) => (
        <Draggable
          key={id}
          isDisabled={disableActions}
          text={title}
          kind={isAlbum ? 'album' : 'contentList'}
          id={id}
          isOwner={isOwner}
          link={
            isAlbum
              ? fullAlbumPage(handle, title, id)
              : fullContentListPage(handle, title, id)
          }
        >
          {children as any}
        </Draggable>
      ),
      [id, disableActions, title, isAlbum, handle, isOwner]
    )

    const renderDigitalContentList = useCallback(() => {
      const showSkeletons = !!(
        !digitalContents.length &&
        isLoading &&
        numLoadingSkeletonRows
      )
      if (showSkeletons) {
        return range(numLoadingSkeletonRows as number).map((i) => (
          <DigitalContentListItem
            index={i}
            key={i}
            isLoading={true}
            forceSkeleton
            active={false}
            size={size}
            disableActions={disableActions}
            playing={isPlaying}
            togglePlay={togglePlay}
            goToRoute={goToRoute}
            landlordHandle={handle}
          />
        ))
      }
      return digitalContents.map((digital_content, i) => (
        <Draggable
          key={`${digital_content.title}+${i}`}
          text={digital_content.title}
          kind='digital_content'
          id={digital_content.digital_content_id}
          isOwner={digital_content.user.handle === userHandle}
          link={fullDigitalContentPage(digital_content.permalink)}
        >
          <DigitalContentListItem
            index={i}
            key={`${digital_content.title}+${i}`}
            isLoading={isLoading}
            active={playingUid === digital_content.uid}
            size={size}
            disableActions={disableActions}
            playing={isPlaying}
            digital_content={digital_content}
            togglePlay={togglePlay}
            goToRoute={goToRoute}
            landlordHandle={handle}
          />
        </Draggable>
      ))
    }, [
      digitalContents,
      isLoading,
      userHandle,
      playingUid,
      size,
      disableActions,
      isPlaying,
      togglePlay,
      goToRoute,
      handle,
      numLoadingSkeletonRows
    ])

    const artwork = renderImage()
    const stats = renderStats()
    const rightActions = renderOverflowMenu()
    const userName = renderUserName()
    const digitalContentList = renderDigitalContentList()

    const order = ordered && index !== undefined ? index + 1 : undefined
    const header =
      size === DigitalContentTileSize.LARGE
        ? isAlbum
          ? 'ALBUM'
          : 'CONTENT_LIST'
        : undefined

    // Failsafe check - should never get this far, lineups should filter deactivated contentLists
    if (isOwnerDeactivated) {
      return null
    }
    return (
      <ContentListTile
        // DigitalContent Tile Props
        size={size}
        order={order}
        isFavorited={isFavorited}
        isReposted={isReposted}
        isOwner={isOwner}
        isLoading={isLoading}
        numLoadingSkeletonRows={numLoadingSkeletonRows}
        isDarkMode={isDarkMode()}
        isMatrixMode={isMatrix()}
        isActive={isActive}
        artwork={artwork}
        rightActions={rightActions}
        title={title}
        userName={userName}
        stats={stats}
        header={header}
        onClickTitle={onClickTitle}
        onClickRepost={onClickRepost}
        onClickFavorite={onClickFavorite}
        onClickShare={onClickShare}
        onTogglePlay={onTogglePlay}
        key={`${index}-${title}`}
        TileDigitalContentContainer={TileDigitalContentContainer}
        duration={digitalContents.reduce(
          (duration: number, digital_content: DigitalContent) => duration + digital_content.duration,
          0
        )}
        containerClassName={cn(styles.container, {
          [containerClassName!]: !!containerClassName,
          [styles.loading]: isLoading,
          [styles.active]: isActive,
          [styles.small]: size === DigitalContentTileSize.SMALL,
          [styles.large]: DigitalContentTileSize.LARGE
        })}
        tileClassName={cn(styles.digitalContentTile)}
        digitalContentsContainerClassName={cn(styles.digitalContentsContainer)}
        digitalContentList={digitalContentList}
        digitalContentCount={digitalContentCount}
        isTrending={isTrending}
        showRankIcon={showRankIcon}
      />
    )
  }
)

function mapStateToProps(state: AppState, ownProps: OwnProps) {
  return {
    collection: getCollection(state, { uid: ownProps.uid }),
    digitalContents: getDigitalContentsFromCollection(state, { uid: ownProps.uid }),
    user: getUserFromCollection(state, { uid: ownProps.uid }),
    userHandle: getUserHandle(state),
    playingUid: getUid(state),
    isBuffering: getBuffering(state),
    isPlaying: getPlaying(state)
  }
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    goToRoute: (route: string) => dispatch(pushRoute(route)),
    record: (event: DigitalContentEvent) => dispatch(event),
    shareCollection: (id: ID) =>
      dispatch(
        requestOpenShareModal({
          type: 'collection',
          collectionId: id,
          source: ShareSource.TILE
        })
      ),
    repostCollection: (id: ID) =>
      dispatch(repostCollection(id, RepostSource.TILE)),
    undoRepostCollection: (id: ID) =>
      dispatch(undoRepostCollection(id, RepostSource.TILE)),
    saveCollection: (id: ID) =>
      dispatch(saveCollection(id, FavoriteSource.TILE)),
    unsaveCollection: (id: ID) =>
      dispatch(unsaveCollection(id, FavoriteSource.TILE)),

    setRepostUsers: (digitalContentID: ID) =>
      dispatch(
        setUsers({
          userListType: UserListType.REPOST,
          entityType: UserListEntityType.COLLECTION,
          id: digitalContentID
        })
      ),
    setFavoriteUsers: (digitalContentID: ID) =>
      dispatch(
        setUsers({
          userListType: UserListType.FAVORITE,
          entityType: UserListEntityType.COLLECTION,
          id: digitalContentID
        })
      ),
    setModalVisibility: () => dispatch(setVisibility(true))
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ConnectedContentListTile)
