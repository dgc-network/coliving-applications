import { useCallback } from 'react'

import type { Agreement, User } from '@coliving/common'
import {
  PlaybackSource,
  FavoriteSource,
  RepostSource,
  ShareSource,
  FavoriteType,
  SquareSizes
} from '@coliving/common'
import { getUserId } from '@coliving/web/src/common/store/account/selectors'
import { getAgreement } from '@coliving/web/src/common/store/cache/agreements/selectors'
import { getUserFromAgreement } from '@coliving/web/src/common/store/cache/users/selectors'
import {
  repostAgreement,
  saveAgreement,
  undoRepostAgreement,
  unsaveAgreement
} from '@coliving/web/src/common/store/social/agreements/actions'
import {
  OverflowAction,
  OverflowSource
} from '@coliving/web/src/common/store/ui/mobile-overflow-menu/types'
import { requestOpen as requestOpenShareModal } from '@coliving/web/src/common/store/ui/share-modal/slice'
import { RepostType } from '@coliving/web/src/common/store/user-list/reposts/types'
import { open as openOverflowMenu } from 'common/store/ui/mobile-overflow-menu/slice'
import { useSelector } from 'react-redux'

import type { LineupItemProps } from 'app/components/lineup-tile/types'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useNavigation } from 'app/hooks/useNavigation'
import { isEqual, useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { useAgreementCoverArt } from 'app/hooks/useAgreementCoverArt'
import type { AppState } from 'app/store'
import { getPlayingUid } from 'app/store/live/selectors'

import { LineupTile } from './LineupTile'

export const AgreementTile = (props: LineupItemProps) => {
  const { uid } = props

  // Using isEqual as the equality function to prevent rerenders due to object references
  // not being preserved when syncing redux state from client.
  // This can be removed when no longer dependent on web client
  const agreement = useSelectorWeb((state) => getAgreement(state, { uid }), isEqual)

  const user = useSelectorWeb(
    (state) => getUserFromAgreement(state, { uid }),
    isEqual
  )

  if (!agreement || !user) {
    console.warn('Agreement or user missing for AgreementTile, preventing render')
    return null
  }

  if (agreement.is_delete || user?.is_deactivated) {
    return null
  }

  return <AgreementTileComponent {...props} agreement={agreement} user={user} />
}

type AgreementTileProps = LineupItemProps & {
  agreement: Agreement
  user: User
}

const AgreementTileComponent = ({
  togglePlay,
  agreement,
  user,
  ...lineupTileProps
}: AgreementTileProps) => {
  const dispatchWeb = useDispatchWeb()
  const navigation = useNavigation()
  const currentUserId = useSelectorWeb(getUserId)
  const isPlayingUid = useSelector(
    (state: AppState) => getPlayingUid(state) === lineupTileProps.uid
  )

  const {
    _cover_art_sizes,
    duration,
    field_visibility,
    is_unlisted,
    has_current_user_reposted,
    has_current_user_saved,
    permalink,
    play_count,
    title,
    agreement_id
  } = agreement

  const { user_id } = user

  const isOwner = user_id === currentUserId

  const imageUrl = useAgreementCoverArt({
    id: agreement_id,
    sizes: _cover_art_sizes,
    size: SquareSizes.SIZE_150_BY_150
  })

  const handlePress = useCallback(
    ({ isPlaying }) => {
      togglePlay({
        uid: lineupTileProps.uid,
        id: agreement_id,
        source: PlaybackSource.AGREEMENT_TILE,
        isPlaying,
        isPlayingUid
      })
    },
    [togglePlay, lineupTileProps.uid, agreement_id, isPlayingUid]
  )

  const handlePressTitle = useCallback(() => {
    navigation.push({
      native: { screen: 'Agreement', params: { id: agreement_id } },
      web: { route: permalink }
    })
  }, [navigation, permalink, agreement_id])

  const handlePressOverflow = useCallback(() => {
    if (agreement_id === undefined) {
      return
    }
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
      OverflowAction.SHARE,
      OverflowAction.ADD_TO_CONTENT_LIST,
      OverflowAction.VIEW_AGREEMENT_PAGE,
      OverflowAction.VIEW_LANDLORD_PAGE
    ].filter(Boolean) as OverflowAction[]

    dispatchWeb(
      openOverflowMenu({
        source: OverflowSource.AGREEMENTS,
        id: agreement_id,
        overflowActions
      })
    )
  }, [
    agreement_id,
    dispatchWeb,
    has_current_user_reposted,
    has_current_user_saved,
    isOwner
  ])

  const handlePressShare = useCallback(() => {
    if (agreement_id === undefined) {
      return
    }
    dispatchWeb(
      requestOpenShareModal({
        type: 'agreement',
        agreementId: agreement_id,
        source: ShareSource.TILE
      })
    )
  }, [dispatchWeb, agreement_id])

  const handlePressSave = useCallback(() => {
    if (agreement_id === undefined) {
      return
    }
    if (has_current_user_saved) {
      dispatchWeb(unsaveAgreement(agreement_id, FavoriteSource.TILE))
    } else {
      dispatchWeb(saveAgreement(agreement_id, FavoriteSource.TILE))
    }
  }, [agreement_id, dispatchWeb, has_current_user_saved])

  const handlePressRepost = useCallback(() => {
    if (agreement_id === undefined) {
      return
    }
    if (has_current_user_reposted) {
      dispatchWeb(undoRepostAgreement(agreement_id, RepostSource.TILE))
    } else {
      dispatchWeb(repostAgreement(agreement_id, RepostSource.TILE))
    }
  }, [agreement_id, dispatchWeb, has_current_user_reposted])

  const hideShare = field_visibility?.share === false
  const hidePlays = field_visibility?.play_count === false

  return (
    <LineupTile
      {...lineupTileProps}
      isPlayingUid={isPlayingUid}
      duration={duration}
      favoriteType={FavoriteType.AGREEMENT}
      repostType={RepostType.AGREEMENT}
      hideShare={hideShare}
      hidePlays={hidePlays}
      id={agreement_id}
      imageUrl={imageUrl}
      isUnlisted={is_unlisted}
      onPress={handlePress}
      onPressOverflow={handlePressOverflow}
      onPressRepost={handlePressRepost}
      onPressSave={handlePressSave}
      onPressShare={handlePressShare}
      onPressTitle={handlePressTitle}
      playCount={play_count}
      title={title}
      item={agreement}
      user={user}
    />
  )
}
