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
  Agreement
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
  getAgreementsFromCollection
} from 'common/store/cache/collections/selectors'
import { getUserFromCollection } from 'common/store/cache/users/selectors'
import {
  saveCollection,
  unsaveCollection,
  repostCollection,
  undoRepostCollection
} from 'common/store/social/collections/actions'
import { requestOpen as requestOpenShareModal } from 'common/store/ui/share-modal/slice'
import { ArtistPopover } from 'components/artist/ArtistPopover'
import Draggable from 'components/dragndrop/Draggable'
import { OwnProps as CollectionkMenuProps } from 'components/menu/CollectionMenu'
import Menu from 'components/menu/Menu'
import { CollectionArtwork } from 'components/agreement/desktop/Artwork'
import { AgreementTileSize } from 'components/agreement/types'
import UserBadges from 'components/user-badges/UserBadges'
import { AgreementEvent, make } from 'store/analytics/actions'
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
  fullAgreementPage,
  content listPage,
  profilePage
} from 'utils/route'
import { isDarkMode, isMatrix } from 'utils/theme/theme'

import { getCollectionWithFallback, getUserWithFallback } from '../helpers'

import styles from './ConnectedContentListTile.module.css'
import ContentListTile from './ContentListTile'
import AgreementListItem from './AgreementListItem'
import Stats from './stats/Stats'
import { Flavor } from './stats/StatsText'

type OwnProps = {
  uid: UID
  ordered: boolean
  index: number
  size: AgreementTileSize
  containerClassName?: string
  togglePlay: () => void
  playAgreement: (uid: string) => void
  playingAgreementId?: ID
  pauseAgreement: () => void
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
    agreements,
    togglePlay,
    playAgreement,
    pauseAgreement,
    playingUid,
    isBuffering,
    isPlaying,
    goToRoute,
    record,
    playingAgreementId,
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
      content list_name: title,
      content list_id: id,
      is_private: isPrivate,
      _cover_art_sizes: coverArtSizes,
      repost_count: repostCount,
      save_count: saveCount,
      followee_reposts: followeeReposts,
      followee_saves: followeeSaves,
      has_current_user_reposted: isReposted,
      has_current_user_saved: isFavorited,
      agreement_count: agreementCount
    } = getCollectionWithFallback(collection)

    const {
      name,
      handle,
      is_deactivated: isOwnerDeactivated
    } = getUserWithFallback(user)
    const isOwner = handle === userHandle

    const isActive = useMemo(() => {
      return agreements.some((agreement: any) => agreement.uid === playingUid)
    }, [agreements, playingUid])

    const onTogglePlay = useCallback(() => {
      if (isUploading) return
      if (!isActive || !isPlaying) {
        if (isActive) {
          playAgreement(playingUid!)
          if (record) {
            record(
              make(Name.PLAYBACK_PLAY, {
                id: `${playingAgreementId}`,
                source: PlaybackSource.CONTENT_LIST_TILE_AGREEMENT
              })
            )
          }
        } else {
          const agreementUid = agreements[0] ? agreements[0].uid : null
          const agreementId = agreements[0] ? agreements[0].agreement_id : null
          if (!agreementUid || !agreementId) return
          playAgreement(agreementUid)
          if (record) {
            record(
              make(Name.PLAYBACK_PLAY, {
                id: `${agreementId}`,
                source: PlaybackSource.CONTENT_LIST_TILE_AGREEMENT
              })
            )
          }
        }
      } else {
        pauseAgreement()
        if (record) {
          record(
            make(Name.PLAYBACK_PAUSE, {
              id: `${playingAgreementId}`,
              source: PlaybackSource.CONTENT_LIST_TILE_AGREEMENT
            })
          )
        }
      }
    }, [
      isPlaying,
      agreements,
      playAgreement,
      pauseAgreement,
      isActive,
      playingUid,
      playingAgreementId,
      isUploading,
      record
    ])

    const onClickTitle = useCallback(
      (e: MouseEvent) => {
        e.stopPropagation()
        goToRoute(
          isAlbum
            ? albumPage(handle, title, id)
            : content listPage(handle, title, id)
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
        type: isAlbum ? 'album' : 'content list', // content list or album
        content listId: id,
        content listName: title,
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
    const onClickArtistName = useCallback(
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
      const contentTitle = 'agreement' // undefined,  content list or album -  undefined is agreement
      const sz = 'large'
      return (
        <div className={cn(styles.socialInfo)}>
          <Stats
            hideImage={size === AgreementTileSize.SMALL}
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

    const TileAgreementContainer = useCallback(
      ({ children }: { children: ReactChildren }) => (
        <Draggable
          key={id}
          isDisabled={disableActions}
          text={title}
          kind={isAlbum ? 'album' : 'content list'}
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

    const renderAgreementList = useCallback(() => {
      const showSkeletons = !!(
        !agreements.length &&
        isLoading &&
        numLoadingSkeletonRows
      )
      if (showSkeletons) {
        return range(numLoadingSkeletonRows as number).map((i) => (
          <AgreementListItem
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
            artistHandle={handle}
          />
        ))
      }
      return agreements.map((agreement, i) => (
        <Draggable
          key={`${agreement.title}+${i}`}
          text={agreement.title}
          kind='agreement'
          id={agreement.agreement_id}
          isOwner={agreement.user.handle === userHandle}
          link={fullAgreementPage(agreement.permalink)}
        >
          <AgreementListItem
            index={i}
            key={`${agreement.title}+${i}`}
            isLoading={isLoading}
            active={playingUid === agreement.uid}
            size={size}
            disableActions={disableActions}
            playing={isPlaying}
            agreement={agreement}
            togglePlay={togglePlay}
            goToRoute={goToRoute}
            artistHandle={handle}
          />
        </Draggable>
      ))
    }, [
      agreements,
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
    const agreementList = renderAgreementList()

    const order = ordered && index !== undefined ? index + 1 : undefined
    const header =
      size === AgreementTileSize.LARGE
        ? isAlbum
          ? 'ALBUM'
          : 'CONTENT_LIST'
        : undefined

    // Failsafe check - should never get this far, lineups should filter deactivated content lists
    if (isOwnerDeactivated) {
      return null
    }
    return (
      <ContentListTile
        // Agreement Tile Props
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
        TileAgreementContainer={TileAgreementContainer}
        duration={agreements.reduce(
          (duration: number, agreement: Agreement) => duration + agreement.duration,
          0
        )}
        containerClassName={cn(styles.container, {
          [containerClassName!]: !!containerClassName,
          [styles.loading]: isLoading,
          [styles.active]: isActive,
          [styles.small]: size === AgreementTileSize.SMALL,
          [styles.large]: AgreementTileSize.LARGE
        })}
        tileClassName={cn(styles.agreementTile)}
        agreementsContainerClassName={cn(styles.agreementsContainer)}
        agreementList={agreementList}
        agreementCount={agreementCount}
        isTrending={isTrending}
        showRankIcon={showRankIcon}
      />
    )
  }
)

function mapStateToProps(state: AppState, ownProps: OwnProps) {
  return {
    collection: getCollection(state, { uid: ownProps.uid }),
    agreements: getAgreementsFromCollection(state, { uid: ownProps.uid }),
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
    record: (event: AgreementEvent) => dispatch(event),
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

    setRepostUsers: (agreementID: ID) =>
      dispatch(
        setUsers({
          userListType: UserListType.REPOST,
          entityType: UserListEntityType.COLLECTION,
          id: agreementID
        })
      ),
    setFavoriteUsers: (agreementID: ID) =>
      dispatch(
        setUsers({
          userListType: UserListType.FAVORITE,
          entityType: UserListEntityType.COLLECTION,
          id: agreementID
        })
      ),
    setModalVisibility: () => dispatch(setVisibility(true))
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ConnectedContentListTile)
