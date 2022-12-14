import { useCallback, useMemo } from 'react'

import type { Collection, DigitalContent, User } from '@coliving/common'
import {
  FavoriteSource,
  PlaybackSource,
  RepostSource,
  ShareSource,
  FavoriteType,
  SquareSizes
} from '@coliving/common'
import { getUserId } from '@coliving/web/src/common/store/account/selectors'
import type { EnhancedCollectionDigitalContent } from '@coliving/web/src/common/store/cache/collections/selectors'
import {
  getCollection,
  getDigitalContentsFromCollection
} from '@coliving/web/src/common/store/cache/collections/selectors'
import { getUserFromCollection } from '@coliving/web/src/common/store/cache/users/selectors'
import {
  repostCollection,
  saveCollection,
  undoRepostCollection,
  unsaveCollection
} from '@coliving/web/src/common/store/social/collections/actions'
import {
  OverflowAction,
  OverflowSource
} from '@coliving/web/src/common/store/ui/mobile-overflow-menu/types'
import { requestOpen as requestOpenShareModal } from '@coliving/web/src/common/store/ui/share-modal/slice'
import { RepostType } from '@coliving/web/src/common/store/user-list/reposts/types'
import { albumPage, contentListPage } from '@coliving/web/src/utils/route'
import { open as openOverflowMenu } from 'common/store/ui/mobile-overflow-menu/slice'
import { useSelector } from 'react-redux'

import { useCollectionCoverArt } from 'app/hooks/useCollectionCoverArt'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useNavigation } from 'app/hooks/useNavigation'
import { isEqual, useSelectorWeb } from 'app/hooks/useSelectorWeb'
import type { AppState } from 'app/store'
import { getPlayingUid } from 'app/store/digitalcoin/selectors'

import { CollectionTileDigitalContentList } from './CollectionTileDigitalContentList'
import { LineupTile } from './lineupTile'
import type { LineupItemProps } from './types'

export const CollectionTile = (props: LineupItemProps) => {
  const { uid } = props

  const collection = useSelectorWeb(
    (state) => getCollection(state, { uid }),
    isEqual
  )

  const digitalContents = useSelectorWeb(
    (state) => getDigitalContentsFromCollection(state, { uid }),
    isEqual
  )

  const user = useSelectorWeb(
    (state) => getUserFromCollection(state, { uid }),
    isEqual
  )

  if (!collection || !digitalContents || !user) {
    console.warn(
      'Collection, digitalContents, or user missing for CollectionTile, preventing render'
    )
    return null
  }

  if (collection.is_delete || user?.is_deactivated) {
    return null
  }

  return (
    <CollectionTileComponent
      {...props}
      collection={collection}
      digitalContents={digitalContents}
      user={user}
    />
  )
}

type CollectionTileProps = LineupItemProps & {
  collection: Collection
  digitalContents: EnhancedCollectionDigitalContent[]
  user: User
}

const CollectionTileComponent = ({
  collection,
  togglePlay,
  digitalContents,
  user,
  ...lineupTileProps
}: CollectionTileProps) => {
  const dispatchWeb = useDispatchWeb()
  const navigation = useNavigation()
  const currentUserId = useSelectorWeb(getUserId)
  const currentDigitalContent = useSelector((state: AppState) => {
    const uid = getPlayingUid(state)
    return digitalContents.find((digital_content) => digital_content.uid === uid) ?? null
  })
  const isPlayingUid = useSelector((state: AppState) => {
    const uid = getPlayingUid(state)
    return digitalContents.some((digital_content) => digital_content.uid === uid)
  })

  const {
    _cover_art_sizes,
    has_current_user_reposted,
    has_current_user_saved,
    is_album,
    content_list_id,
    content_list_name,
    content_list_owner_id
  } = collection

  const isOwner = content_list_owner_id === currentUserId

  const imageUrl = useCollectionCoverArt({
    id: content_list_id,
    sizes: _cover_art_sizes,
    size: SquareSizes.SIZE_150_BY_150
  })

  const routeWeb = useMemo(() => {
    return collection.is_album
      ? albumPage(user.handle, collection.content_list_name, collection.content_list_id)
      : contentListPage(
          user.handle,
          collection.content_list_name,
          collection.content_list_id
        )
  }, [collection, user])

  const handlePress = useCallback(
    ({ isPlaying }) => {
      if (!digitalContents.length) return

      togglePlay({
        uid: currentDigitalContent?.uid ?? digitalContents[0]?.uid ?? null,
        id: currentDigitalContent?.digital_content_id ?? digitalContents[0]?.digital_content_id ?? null,
        source: PlaybackSource.CONTENT_LIST_TILE_DIGITAL_CONTENT,
        isPlaying,
        isPlayingUid
      })
    },
    [isPlayingUid, currentDigitalContent, togglePlay, digitalContents]
  )

  const handlePressTitle = useCallback(() => {
    navigation.push({
      native: { screen: 'Collection', params: { id: content_list_id } },
      web: { route: routeWeb }
    })
  }, [content_list_id, routeWeb, navigation])

  const duration = useMemo(() => {
    return digitalContents.reduce(
      (duration: number, digital_content: DigitalContent) => duration + digital_content.duration,
      0
    )
  }, [digitalContents])

  const handlePressOverflow = useCallback(() => {
    if (content_list_id === undefined) {
      return
    }
    const overflowActions = [
      has_current_user_reposted
        ? OverflowAction.UNREPOST
        : OverflowAction.REPOST,
      has_current_user_saved
        ? OverflowAction.UNFAVORITE
        : OverflowAction.FAVORITE,
      is_album
        ? OverflowAction.VIEW_ALBUM_PAGE
        : OverflowAction.VIEW_CONTENT_LIST_PAGE,
      isOwner && !is_album ? OverflowAction.PUBLISH_CONTENT_LIST : null,
      isOwner && !is_album ? OverflowAction.DELETE_CONTENT_LIST : null,
      OverflowAction.VIEW_LANDLORD_PAGE
    ].filter(Boolean) as OverflowAction[]

    dispatchWeb(
      openOverflowMenu({
        source: OverflowSource.COLLECTIONS,
        id: content_list_id,
        overflowActions
      })
    )
  }, [
    content_list_id,
    dispatchWeb,
    isOwner,
    has_current_user_reposted,
    has_current_user_saved,
    is_album
  ])

  const handlePressShare = useCallback(() => {
    if (content_list_id === undefined) {
      return
    }
    dispatchWeb(
      requestOpenShareModal({
        type: 'collection',
        collectionId: content_list_id,
        source: ShareSource.TILE
      })
    )
  }, [dispatchWeb, content_list_id])

  const handlePressSave = useCallback(() => {
    if (content_list_id === undefined) {
      return
    }
    if (has_current_user_saved) {
      dispatchWeb(unsaveCollection(content_list_id, FavoriteSource.TILE))
    } else {
      dispatchWeb(saveCollection(content_list_id, FavoriteSource.TILE))
    }
  }, [content_list_id, dispatchWeb, has_current_user_saved])

  const handlePressRepost = useCallback(() => {
    if (content_list_id === undefined) {
      return
    }
    if (has_current_user_reposted) {
      dispatchWeb(undoRepostCollection(content_list_id, RepostSource.TILE))
    } else {
      dispatchWeb(repostCollection(content_list_id, RepostSource.TILE))
    }
  }, [content_list_id, dispatchWeb, has_current_user_reposted])

  return (
    <LineupTile
      {...lineupTileProps}
      duration={duration}
      favoriteType={FavoriteType.CONTENT_LIST}
      repostType={RepostType.COLLECTION}
      id={content_list_id}
      imageUrl={imageUrl}
      isPlayingUid={isPlayingUid}
      onPress={handlePress}
      onPressOverflow={handlePressOverflow}
      onPressRepost={handlePressRepost}
      onPressSave={handlePressSave}
      onPressShare={handlePressShare}
      onPressTitle={handlePressTitle}
      title={content_list_name}
      item={collection}
      user={user}
    >
      <CollectionTileDigitalContentList digitalContents={digitalContents} onPress={handlePressTitle} />
    </LineupTile>
  )
}
