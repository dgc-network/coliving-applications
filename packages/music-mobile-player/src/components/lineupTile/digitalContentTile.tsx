import { useCallback } from 'react'

import type { DigitalContent, User } from '@coliving/common'
import {
  PlaybackSource,
  FavoriteSource,
  RepostSource,
  ShareSource,
  FavoriteType,
  SquareSizes
} from '@coliving/common'
import { getUserId } from '@coliving/web/src/common/store/account/selectors'
import { getDigitalContent } from '@coliving/web/src/common/store/cache/digital_contents/selectors'
import { getUserFromDigitalContent } from '@coliving/web/src/common/store/cache/users/selectors'
import {
  repostDigitalContent,
  saveDigitalContent,
  undoRepostDigitalContent,
  unsaveDigitalContent
} from '@coliving/web/src/common/store/social/digital_contents/actions'
import {
  OverflowAction,
  OverflowSource
} from '@coliving/web/src/common/store/ui/mobile-overflow-menu/types'
import { requestOpen as requestOpenShareModal } from '@coliving/web/src/common/store/ui/share-modal/slice'
import { RepostType } from '@coliving/web/src/common/store/user-list/reposts/types'
import { open as openOverflowMenu } from 'common/store/ui/mobile-overflow-menu/slice'
import { useSelector } from 'react-redux'

import type { LineupItemProps } from 'app/components/lineupTile/types'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useNavigation } from 'app/hooks/useNavigation'
import { isEqual, useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { useDigitalContentCoverArt } from 'app/hooks/useDigitalContentCoverArt'
import type { AppState } from 'app/store'
import { getPlayingUid } from 'app/store/digitalcoin/selectors'

import { LineupTile } from './lineupTile'

export const DigitalContentTile = (props: LineupItemProps) => {
  const { uid } = props

  // Using isEqual as the equality function to prevent rerenders due to object references
  // not being preserved when syncing redux state from client.
  // This can be removed when no longer dependent on web client
  const digital_content = useSelectorWeb((state) => getDigitalContent(state, { uid }), isEqual)

  const user = useSelectorWeb(
    (state) => getUserFromDigitalContent(state, { uid }),
    isEqual
  )

  if (!digital_content || !user) {
    console.warn('DigitalContent or user missing for DigitalContentTile, preventing render')
    return null
  }

  if (digital_content.is_delete || user?.is_deactivated) {
    return null
  }

  return <DigitalContentTileComponent {...props} digital_content={digital_content} user={user} />
}

type DigitalContentTileProps = LineupItemProps & {
  digital_content: DigitalContent
  user: User
}

const DigitalContentTileComponent = ({
  togglePlay,
  digital_content,
  user,
  ...lineupTileProps
}: DigitalContentTileProps) => {
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
    digital_content_id
  } = digital_content

  const { user_id } = user

  const isOwner = user_id === currentUserId

  const imageUrl = useDigitalContentCoverArt({
    id: digital_content_id,
    sizes: _cover_art_sizes,
    size: SquareSizes.SIZE_150_BY_150
  })

  const handlePress = useCallback(
    ({ isPlaying }) => {
      togglePlay({
        uid: lineupTileProps.uid,
        id: digital_content_id,
        source: PlaybackSource.DIGITAL_CONTENT_TILE,
        isPlaying,
        isPlayingUid
      })
    },
    [togglePlay, lineupTileProps.uid, digital_content_id, isPlayingUid]
  )

  const handlePressTitle = useCallback(() => {
    navigation.push({
      native: { screen: 'DigitalContent', params: { id: digital_content_id } },
      web: { route: permalink }
    })
  }, [navigation, permalink, digital_content_id])

  const handlePressOverflow = useCallback(() => {
    if (digital_content_id === undefined) {
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
      OverflowAction.VIEW_DIGITAL_CONTENT_PAGE,
      OverflowAction.VIEW_LANDLORD_PAGE
    ].filter(Boolean) as OverflowAction[]

    dispatchWeb(
      openOverflowMenu({
        source: OverflowSource.DIGITAL_CONTENTS,
        id: digital_content_id,
        overflowActions
      })
    )
  }, [
    digital_content_id,
    dispatchWeb,
    has_current_user_reposted,
    has_current_user_saved,
    isOwner
  ])

  const handlePressShare = useCallback(() => {
    if (digital_content_id === undefined) {
      return
    }
    dispatchWeb(
      requestOpenShareModal({
        type: 'digital_content',
        digitalContentId: digital_content_id,
        source: ShareSource.TILE
      })
    )
  }, [dispatchWeb, digital_content_id])

  const handlePressSave = useCallback(() => {
    if (digital_content_id === undefined) {
      return
    }
    if (has_current_user_saved) {
      dispatchWeb(unsaveDigitalContent(digital_content_id, FavoriteSource.TILE))
    } else {
      dispatchWeb(saveDigitalContent(digital_content_id, FavoriteSource.TILE))
    }
  }, [digital_content_id, dispatchWeb, has_current_user_saved])

  const handlePressRepost = useCallback(() => {
    if (digital_content_id === undefined) {
      return
    }
    if (has_current_user_reposted) {
      dispatchWeb(undoRepostDigitalContent(digital_content_id, RepostSource.TILE))
    } else {
      dispatchWeb(repostDigitalContent(digital_content_id, RepostSource.TILE))
    }
  }, [digital_content_id, dispatchWeb, has_current_user_reposted])

  const hideShare = field_visibility?.share === false
  const hidePlays = field_visibility?.play_count === false

  return (
    <LineupTile
      {...lineupTileProps}
      isPlayingUid={isPlayingUid}
      duration={duration}
      favoriteType={FavoriteType.DIGITAL_CONTENT}
      repostType={RepostType.DIGITAL_CONTENT}
      hideShare={hideShare}
      hidePlays={hidePlays}
      id={digital_content_id}
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
      item={digital_content}
      user={user}
    />
  )
}
