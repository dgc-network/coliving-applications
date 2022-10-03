import { memo, useCallback, useMemo, MouseEvent } from 'react'

import {
  ID,
  FavoriteSource,
  RepostSource,
  Name,
  PlaybackSource,
  ShareSource,
  FavoriteType,
  Agreement
} from '@coliving/common'
import { push as pushRoute } from 'connected-react-router'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'

import { getUserId } from 'common/store/account/selectors'
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
import { open } from 'common/store/ui/mobileOverflowMenu/slice'
import {
  OverflowAction,
  OverflowSource
} from 'common/store/ui/mobileOverflowMenu/types'
import { requestOpen as requestOpenShareModal } from 'common/store/ui/shareModal/slice'
import { getTheme } from 'common/store/ui/theme/selectors'
import { setFavorite } from 'common/store/userList/favorites/actions'
import { setRepost } from 'common/store/userList/reposts/actions'
import { RepostType } from 'common/store/userList/reposts/types'
import { ContentListTileProps } from 'components/agreement/types'
import { useRecord, make } from 'store/analytics/actions'
import { getUid, getBuffering, getPlaying } from 'store/player/selectors'
import { AppState } from 'store/types'
import {
  albumPage,
  contentListPage,
  profilePage,
  REPOSTING_USERS_ROUTE,
  FAVORITING_USERS_ROUTE
} from 'utils/route'
import { isMatrix, shouldShowDark } from 'utils/theme/theme'

import { getCollectionWithFallback, getUserWithFallback } from '../helpers'

import ContentListTile from './contentListTile'

type ConnectedContentListTileProps = ContentListTileProps &
  ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps>

const ConnectedContentListTile = memo(
  ({
    uid,
    index,
    size,
    collection: nullableCollection,
    user: nullableUser,
    agreements,
    playAgreement,
    pauseAgreement,
    playingUid,
    isBuffering,
    isPlaying,
    goToRoute,
    isLoading,
    numLoadingSkeletonRows,
    hasLoaded,
    playingAgreementId,
    uploading,
    unsaveCollection,
    saveCollection,
    shareCollection,
    unrepostCollection,
    repostCollection,
    setRepostContentListId,
    setFavoriteContentListId,
    clickOverflow,
    currentUserId,
    darkMode,
    showRankIcon,
    isTrending
  }: ConnectedContentListTileProps) => {
    const collection = getCollectionWithFallback(nullableCollection)
    const user = getUserWithFallback(nullableUser)
    const record = useRecord()
    const isActive = useMemo(() => {
      return agreements.some((agreement) => agreement.uid === playingUid)
    }, [agreements, playingUid])

    const isOwner = collection.content_list_owner_id === currentUserId

    const toggleSave = useCallback(() => {
      if (collection.has_current_user_saved) {
        unsaveCollection(collection.content_list_id)
      } else {
        saveCollection(collection.content_list_id)
      }
    }, [collection, unsaveCollection, saveCollection])

    const toggleRepost = useCallback(() => {
      if (collection.has_current_user_reposted) {
        unrepostCollection(collection.content_list_id)
      } else {
        repostCollection(collection.content_list_id)
      }
    }, [collection, unrepostCollection, repostCollection])

    const getRoute = useCallback(() => {
      return collection.is_album
        ? albumPage(
            user.handle,
            collection.content_list_name,
            collection.content_list_id
          )
        : contentListPage(
            user.handle,
            collection.content_list_name,
            collection.content_list_id
          )
    }, [collection, user])

    const goToCollectionPage = useCallback(
      (e: MouseEvent<HTMLElement>) => {
        e.stopPropagation()
        const route = getRoute()
        goToRoute(route)
      },
      [goToRoute, getRoute]
    )

    const goToLandlordPage = useCallback(
      (e: MouseEvent<HTMLElement>) => {
        e.stopPropagation()
        goToRoute(profilePage(user.handle))
      },
      [goToRoute, user]
    )

    const onShare = useCallback(() => {
      shareCollection(collection.content_list_id)
    }, [shareCollection, collection.content_list_id])

    const onClickOverflow = useCallback(() => {
      const overflowActions = [
        collection.has_current_user_reposted
          ? OverflowAction.UNREPOST
          : OverflowAction.REPOST,
        collection.has_current_user_saved
          ? OverflowAction.UNFAVORITE
          : OverflowAction.FAVORITE,
        collection.is_album
          ? OverflowAction.VIEW_ALBUM_PAGE
          : OverflowAction.VIEW_CONTENT_LIST_PAGE,
        isOwner && !collection.is_album
          ? OverflowAction.PUBLISH_CONTENT_LIST
          : null,
        isOwner && !collection.is_album ? OverflowAction.DELETE_CONTENT_LIST : null,
        OverflowAction.VIEW_LANDLORD_PAGE
      ].filter(Boolean)

      clickOverflow(
        collection.content_list_id,
        // @ts-ignore
        overflowActions
      )
    }, [collection, isOwner, clickOverflow])

    const togglePlay = useCallback(() => {
      if (uploading) return
      if (!isPlaying || !isActive) {
        if (isActive) {
          playAgreement(playingUid!)
          record(
            make(Name.PLAYBACK_PLAY, {
              id: `${playingAgreementId}`,
              source: PlaybackSource.CONTENT_LIST_TILE_AGREEMENT
            })
          )
        } else {
          const agreementUid = agreements[0] ? agreements[0].uid : null
          const agreementId = agreements[0] ? agreements[0].agreement_id : null
          if (!agreementUid || !agreementId) return
          playAgreement(agreementUid)
          record(
            make(Name.PLAYBACK_PLAY, {
              id: `${agreementId}`,
              source: PlaybackSource.CONTENT_LIST_TILE_AGREEMENT
            })
          )
        }
      } else {
        pauseAgreement()
        record(
          make(Name.PLAYBACK_PAUSE, {
            id: `${playingAgreementId}`,
            source: PlaybackSource.CONTENT_LIST_TILE_AGREEMENT
          })
        )
      }
    }, [
      isPlaying,
      agreements,
      playAgreement,
      pauseAgreement,
      isActive,
      playingUid,
      playingAgreementId,
      uploading,
      record
    ])

    const makeGoToRepostsPage =
      (collectionId: ID) => (e: MouseEvent<HTMLElement>) => {
        e.stopPropagation()
        setRepostContentListId(collectionId)
        goToRoute(REPOSTING_USERS_ROUTE)
      }

    const makeGoToFavoritesPage =
      (collectionId: ID) => (e: MouseEvent<HTMLElement>) => {
        e.stopPropagation()
        setFavoriteContentListId(collectionId)
        goToRoute(FAVORITING_USERS_ROUTE)
      }

    return (
      <ContentListTile
        uid={uid}
        id={collection.content_list_id}
        userId={collection.content_list_owner_id}
        index={index}
        key={`${index}-${collection.content_list_name}`}
        showSkeleton={isLoading}
        hasLoaded={hasLoaded}
        // UI
        isAlbum={collection.is_album}
        isPublic={!collection.is_private}
        contentTitle={collection.is_album ? 'album' : 'contentList'}
        contentListTitle={collection.content_list_name}
        landlordHandle={user.handle}
        landlordName={user.name}
        landlordIsVerified={user.is_verified}
        ownerId={collection.content_list_owner_id}
        coverArtSizes={collection._cover_art_sizes}
        duration={agreements.reduce(
          (duration: number, agreement: Agreement) => duration + agreement.duration,
          0
        )}
        agreements={agreements}
        agreementCount={collection.agreement_count}
        size={size}
        repostCount={collection.repost_count}
        saveCount={collection.save_count}
        followeeReposts={collection.followee_reposts}
        followeeSaves={collection.followee_saves}
        hasCurrentUserReposted={collection.has_current_user_reposted}
        hasCurrentUserSaved={collection.has_current_user_saved}
        activityTimestamp={collection.activity_timestamp}
        numLoadingSkeletonRows={numLoadingSkeletonRows}
        // Playback
        togglePlay={togglePlay}
        playAgreement={playAgreement}
        pauseAgreement={pauseAgreement}
        isActive={isActive}
        isPlaying={isActive && isPlaying}
        isLoading={isActive && isBuffering}
        activeAgreementUid={playingUid || null}
        goToRoute={goToRoute}
        goToLandlordPage={goToLandlordPage}
        goToCollectionPage={goToCollectionPage}
        toggleSave={toggleSave}
        toggleRepost={toggleRepost}
        onShare={onShare}
        onClickOverflow={onClickOverflow}
        makeGoToRepostsPage={makeGoToRepostsPage}
        makeGoToFavoritesPage={makeGoToFavoritesPage}
        isOwner={isOwner}
        darkMode={darkMode}
        isMatrix={isMatrix()}
        isTrending={isTrending}
        showRankIcon={showRankIcon}
      />
    )
  }
)

function mapStateToProps(state: AppState, ownProps: ContentListTileProps) {
  return {
    collection: getCollection(state, { uid: ownProps.uid }),
    user: getUserFromCollection(state, { uid: ownProps.uid }),
    agreements: getAgreementsFromCollection(state, { uid: ownProps.uid }),
    playingUid: getUid(state),
    isBuffering: getBuffering(state),
    isPlaying: getPlaying(state),

    currentUserId: getUserId(state),
    darkMode: shouldShowDark(getTheme(state))
  }
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    goToRoute: (route: string) => dispatch(pushRoute(route)),
    shareCollection: (collectionId: ID) =>
      dispatch(
        requestOpenShareModal({
          type: 'collection',
          collectionId,
          source: ShareSource.TILE
        })
      ),
    saveCollection: (collectionId: ID) =>
      dispatch(saveCollection(collectionId, FavoriteSource.TILE)),
    unsaveCollection: (collectionId: ID) =>
      dispatch(unsaveCollection(collectionId, FavoriteSource.TILE)),
    repostCollection: (collectionId: ID) =>
      dispatch(repostCollection(collectionId, RepostSource.TILE)),
    unrepostCollection: (collectionId: ID) =>
      dispatch(undoRepostCollection(collectionId, RepostSource.TILE)),
    clickOverflow: (collectionId: ID, overflowActions: OverflowAction[]) =>
      dispatch(
        open({
          source: OverflowSource.COLLECTIONS,
          id: collectionId,
          overflowActions
        })
      ),
    setRepostContentListId: (collectionId: ID) =>
      dispatch(setRepost(collectionId, RepostType.COLLECTION)),
    setFavoriteContentListId: (collectionId: ID) =>
      dispatch(setFavorite(collectionId, FavoriteType.CONTENT_LIST))
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ConnectedContentListTile)
