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
import { getAgreement } from 'common/store/cache/agreements/selectors'
import { getUserFromAgreement } from 'common/store/cache/users/selectors'
import {
  saveAgreement,
  unsaveAgreement,
  repostAgreement,
  undoRepostAgreement
} from 'common/store/social/agreements/actions'
import { open } from 'common/store/ui/mobile-overflow-menu/slice'
import {
  OverflowAction,
  OverflowSource
} from 'common/store/ui/mobile-overflow-menu/types'
import { requestOpen as requestOpenShareModal } from 'common/store/ui/share-modal/slice'
import { getTheme } from 'common/store/ui/theme/selectors'
import { setFavorite } from 'common/store/user-list/favorites/actions'
import { setRepost } from 'common/store/user-list/reposts/actions'
import { RepostType } from 'common/store/user-list/reposts/types'
import { AgreementTileProps } from 'components/agreement/types'
import { getUid, getPlaying, getBuffering } from 'store/player/selectors'
import { AppState } from 'store/types'
import {
  profilePage,
  REPOSTING_USERS_ROUTE,
  FAVORITING_USERS_ROUTE
} from 'utils/route'
import { isMatrix, shouldShowDark } from 'utils/theme/theme'

import { getAgreementWithFallback, getUserWithFallback } from '../helpers'

import AgreementTile from './AgreementTile'

type ConnectedAgreementTileProps = AgreementTileProps &
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
    agreementTileStyles,
    showLandlordPick,
    goToRoute,
    togglePlay,
    isBuffering,
    isPlaying,
    playingUid,
    isLoading,
    hasLoaded,
    currentUserId,
    saveAgreement,
    unsaveAgreement,
    repostAgreement,
    unrepostAgreement,
    shareAgreement,
    setRepostAgreementId,
    setFavoriteAgreementId,
    clickOverflow,
    darkMode,
    isTrending,
    showRankIcon
  }: ConnectedAgreementTileProps) => {
    const {
      is_delete,
      is_unlisted,
      agreement_id,
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
    } = getAgreementWithFallback(agreement)

    const { _landlord_pick, user_id, handle, name, is_verified } =
      getUserWithFallback(user)

    const isOwner = user_id === currentUserId

    const toggleSave = (agreementId: ID) => {
      if (has_current_user_saved) {
        unsaveAgreement(agreementId)
      } else {
        saveAgreement(agreementId)
      }
    }

    const toggleRepost = (agreementId: ID) => {
      if (has_current_user_reposted) {
        unrepostAgreement(agreementId)
      } else {
        repostAgreement(agreementId)
      }
    }

    const goToAgreementPage = (e: MouseEvent<HTMLElement>) => {
      e.stopPropagation()
      goToRoute(permalink)
    }

    const goToLandlordPage = (e: MouseEvent<HTMLElement>) => {
      e.stopPropagation()
      goToRoute(profilePage(handle))
    }

    const onShare = (id: ID) => {
      shareAgreement(id)
    }

    const makeGoToRepostsPage =
      (agreementId: ID) => (e: MouseEvent<HTMLElement>) => {
        e.stopPropagation()
        setRepostAgreementId(agreementId)
        goToRoute(REPOSTING_USERS_ROUTE)
      }

    const makeGoToFavoritesPage =
      (agreementId: ID) => (e: MouseEvent<HTMLElement>) => {
        e.stopPropagation()
        setFavoriteAgreementId(agreementId)
        goToRoute(FAVORITING_USERS_ROUTE)
      }

    const onClickOverflow = (agreementId: ID) => {
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

      clickOverflow(agreementId, overflowActions)
    }

    if (is_delete || user?.is_deactivated) return null

    return (
      <AgreementTile
        uid={uid}
        id={agreement_id}
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
        agreementTileStyles={agreementTileStyles}
        size={size}
        listenCount={play_count}
        fieldVisibility={field_visibility}
        coSign={_co_sign}
        // Landlord Pick
        showLandlordPick={showLandlordPick}
        isLandlordPick={_landlord_pick === agreement_id}
        // Landlord
        landlordHandle={handle}
        landlordName={name}
        landlordIsVerified={is_verified}
        // Playback
        togglePlay={togglePlay}
        isActive={uid === playingUid}
        isLoading={isBuffering}
        isPlaying={uid === playingUid && isPlaying}
        goToLandlordPage={goToLandlordPage}
        goToAgreementPage={goToAgreementPage}
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

function mapStateToProps(state: AppState, ownProps: AgreementTileProps) {
  return {
    agreement: getAgreement(state, { uid: ownProps.uid }),
    user: getUserFromAgreement(state, { uid: ownProps.uid }),
    playingUid: getUid(state),
    isBuffering: getBuffering(state),
    isPlaying: getPlaying(state),

    currentUserId: getUserId(state),
    darkMode: shouldShowDark(getTheme(state))
  }
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    shareAgreement: (agreementId: ID) =>
      dispatch(
        requestOpenShareModal({
          type: 'agreement',
          agreementId,
          source: ShareSource.TILE
        })
      ),
    saveAgreement: (agreementId: ID) =>
      dispatch(saveAgreement(agreementId, FavoriteSource.TILE)),
    unsaveAgreement: (agreementId: ID) =>
      dispatch(unsaveAgreement(agreementId, FavoriteSource.TILE)),
    repostAgreement: (agreementId: ID) =>
      dispatch(repostAgreement(agreementId, RepostSource.TILE)),
    unrepostAgreement: (agreementId: ID) =>
      dispatch(undoRepostAgreement(agreementId, RepostSource.TILE)),
    clickOverflow: (agreementId: ID, overflowActions: OverflowAction[]) =>
      dispatch(
        open({ source: OverflowSource.AGREEMENTS, id: agreementId, overflowActions })
      ),
    setRepostAgreementId: (agreementId: ID) =>
      dispatch(setRepost(agreementId, RepostType.AGREEMENT)),
    setFavoriteAgreementId: (agreementId: ID) =>
      dispatch(setFavorite(agreementId, FavoriteType.AGREEMENT)),
    goToRoute: (route: string) => dispatch(pushRoute(route))
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ConnectedAgreementTile)
