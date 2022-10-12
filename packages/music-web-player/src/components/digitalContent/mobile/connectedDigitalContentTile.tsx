import { memo, MouseEvent } from 'react'

import {
  ID,
  FavoriteSource,
  RepostSource,
  ShareSource,
  FavoriteType
} from '@coliving/common'
import { push as pushRoute } from 'connected-react-router'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'

import { getUserId } from 'common/store/account/selectors'
import { getDigitalContent } from 'common/store/cache/digital_contents/selectors'
import { getUserFromDigitalContent } from 'common/store/cache/users/selectors'
import {
  saveDigitalContent,
  unsaveDigitalContent,
  repostDigitalContent,
  undoRepostDigitalContent
} from 'common/store/social/digital_contents/actions'
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
import { DigitalContentTileProps } from 'components/digital_content/types'
import { getUid, getPlaying, getBuffering } from 'store/player/selectors'
import { AppState } from 'store/types'
import {
  profilePage,
  REPOSTING_USERS_ROUTE,
  FAVORITING_USERS_ROUTE
} from 'utils/route'
import { isMatrix, shouldShowDark } from 'utils/theme/theme'

import { getDigitalContentWithFallback, getUserWithFallback } from '../helpers'

import DigitalContentTile from './digitalContentTile'

type ConnectedDigitalContentTileProps = DigitalContentTileProps &
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
    digitalContentTileStyles,
    showLandlordPick,
    goToRoute,
    togglePlay,
    isBuffering,
    isPlaying,
    playingUid,
    isLoading,
    hasLoaded,
    currentUserId,
    saveDigitalContent,
    unsaveDigitalContent,
    repostDigitalContent,
    unrepostDigitalContent,
    shareDigitalContent,
    setRepostDigitalContentId,
    setFavoriteDigitalContentId,
    clickOverflow,
    darkMode,
    isTrending,
    showRankIcon
  }: ConnectedDigitalContentTileProps) => {
    const {
      is_delete,
      is_unlisted,
      digital_content_id,
      title,
      permalink,
      repost_count,
      save_count,
      field_visibility,
      followee_reposts,
      followee_saves,
      has_current_user_reposted,
      has_current_user_saved,
      _cover_art_sizes,
      activity_timestamp,
      play_count,
      _co_sign,
      duration
    } = getDigitalContentWithFallback(digital_content)

    const { _landlord_pick, user_id, handle, name, is_verified } =
      getUserWithFallback(user)

    const isOwner = user_id === currentUserId

    const toggleSave = (digitalContentId: ID) => {
      if (has_current_user_saved) {
        unsaveDigitalContent(digitalContentId)
      } else {
        saveDigitalContent(digitalContentId)
      }
    }

    const toggleRepost = (digitalContentId: ID) => {
      if (has_current_user_reposted) {
        unrepostDigitalContent(digitalContentId)
      } else {
        repostDigitalContent(digitalContentId)
      }
    }

    const goToDigitalContentPage = (e: MouseEvent<HTMLElement>) => {
      e.stopPropagation()
      goToRoute(permalink)
    }

    const goToLandlordPage = (e: MouseEvent<HTMLElement>) => {
      e.stopPropagation()
      goToRoute(profilePage(handle))
    }

    const onShare = (id: ID) => {
      shareDigitalContent(id)
    }

    const makeGoToRepostsPage =
      (digitalContentId: ID) => (e: MouseEvent<HTMLElement>) => {
        e.stopPropagation()
        setRepostDigitalContentId(digitalContentId)
        goToRoute(REPOSTING_USERS_ROUTE)
      }

    const makeGoToFavoritesPage =
      (digitalContentId: ID) => (e: MouseEvent<HTMLElement>) => {
        e.stopPropagation()
        setFavoriteDigitalContentId(digitalContentId)
        goToRoute(FAVORITING_USERS_ROUTE)
      }

    const onClickOverflow = (digitalContentId: ID) => {
      const overflowActions = [
        !isOwner
          ? has_current_user_reposted
            ? OverflowAction.UNREPOST
            : OverflowAction.REPOST
          : null,
        !isOwner
          ? has_current_user_saved
            ? OverflowAction.UNFAVORITE
            : OverflowAction.FAVORITE
          : null,
        OverflowAction.ADD_TO_CONTENT_LIST,
        OverflowAction.VIEW_AGREEMENT_PAGE,
        OverflowAction.VIEW_LANDLORD_PAGE
      ].filter(Boolean) as OverflowAction[]

      clickOverflow(digitalContentId, overflowActions)
    }

    if (is_delete || user?.is_deactivated) return null

    return (
      <DigitalContentTile
        uid={uid}
        id={digital_content_id}
        userId={user_id}
        index={index}
        key={`${index}`}
        showSkeleton={isLoading}
        hasLoaded={hasLoaded}
        ordered={ordered}
        title={title}
        repostCount={repost_count}
        saveCount={save_count}
        followeeReposts={followee_reposts}
        followeeSaves={followee_saves}
        hasCurrentUserReposted={has_current_user_reposted}
        hasCurrentUserSaved={has_current_user_saved}
        duration={duration}
        coverArtSizes={_cover_art_sizes}
        activityTimestamp={activity_timestamp}
        digitalContentTileStyles={digitalContentTileStyles}
        size={size}
        listenCount={play_count}
        fieldVisibility={field_visibility}
        coSign={_co_sign}
        // Author Pick
        showLandlordPick={showLandlordPick}
        isLandlordPick={_landlord_pick === digital_content_id}
        // Author
        landlordHandle={handle}
        landlordName={name}
        landlordIsVerified={is_verified}
        // Playback
        togglePlay={togglePlay}
        isActive={uid === playingUid}
        isLoading={isBuffering}
        isPlaying={uid === playingUid && isPlaying}
        goToLandlordPage={goToLandlordPage}
        goToDigitalContentPage={goToDigitalContentPage}
        toggleSave={toggleSave}
        onShare={onShare}
        onClickOverflow={onClickOverflow}
        toggleRepost={toggleRepost}
        makeGoToRepostsPage={makeGoToRepostsPage}
        makeGoToFavoritesPage={makeGoToFavoritesPage}
        goToRoute={goToRoute}
        isOwner={isOwner}
        darkMode={darkMode}
        isMatrix={isMatrix()}
        isTrending={isTrending}
        isUnlisted={is_unlisted}
        showRankIcon={showRankIcon}
      />
    )
  }
)

function mapStateToProps(state: AppState, ownProps: DigitalContentTileProps) {
  return {
    digital_content: getDigitalContent(state, { uid: ownProps.uid }),
    user: getUserFromDigitalContent(state, { uid: ownProps.uid }),
    playingUid: getUid(state),
    isBuffering: getBuffering(state),
    isPlaying: getPlaying(state),

    currentUserId: getUserId(state),
    darkMode: shouldShowDark(getTheme(state))
  }
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    shareDigitalContent: (digitalContentId: ID) =>
      dispatch(
        requestOpenShareModal({
          type: 'digital_content',
          digitalContentId,
          source: ShareSource.TILE
        })
      ),
    saveDigitalContent: (digitalContentId: ID) =>
      dispatch(saveDigitalContent(digitalContentId, FavoriteSource.TILE)),
    unsaveDigitalContent: (digitalContentId: ID) =>
      dispatch(unsaveDigitalContent(digitalContentId, FavoriteSource.TILE)),
    repostDigitalContent: (digitalContentId: ID) =>
      dispatch(repostDigitalContent(digitalContentId, RepostSource.TILE)),
    unrepostDigitalContent: (digitalContentId: ID) =>
      dispatch(undoRepostDigitalContent(digitalContentId, RepostSource.TILE)),
    clickOverflow: (digitalContentId: ID, overflowActions: OverflowAction[]) =>
      dispatch(
        open({ source: OverflowSource.AGREEMENTS, id: digitalContentId, overflowActions })
      ),
    setRepostDigitalContentId: (digitalContentId: ID) =>
      dispatch(setRepost(digitalContentId, RepostType.AGREEMENT)),
    setFavoriteDigitalContentId: (digitalContentId: ID) =>
      dispatch(setFavorite(digitalContentId, FavoriteType.AGREEMENT)),
    goToRoute: (route: string) => dispatch(pushRoute(route))
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ConnectedDigitalContentTile)
