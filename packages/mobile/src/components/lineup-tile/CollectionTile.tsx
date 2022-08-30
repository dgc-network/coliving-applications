import { useCallback, useMemo } from 'react'

import type { Collection, Agreement, User } from '@coliving/common'
import {
  FavoriteSource,
  PlaybackSource,
  RepostSource,
  ShareSource,
  FavoriteType,
  SquareSizes
} from '@coliving/common'
import { getUserId } from '-client/src/common/store/account/selectors'
import type { EnhancedCollectionAgreement } from '-client/src/common/store/cache/collections/selectors'
import {
  getCollection,
  getAgreementsFromCollection
} from '-client/src/common/store/cache/collections/selectors'
import { getUserFromCollection } from '-client/src/common/store/cache/users/selectors'
import {
  repostCollection,
  saveCollection,
  undoRepostCollection,
  unsaveCollection
} from '-client/src/common/store/social/collections/actions'
import {
  OverflowAction,
  OverflowSource
} from '-client/src/common/store/ui/mobile-overflow-menu/types'
import { requestOpen as requestOpenShareModal } from '-client/src/common/store/ui/share-modal/slice'
import { RepostType } from '-client/src/common/store/user-list/reposts/types'
import { albumPage, contentListPage } from '-client/src/utils/route'
import { open as openOverflowMenu } from 'common/store/ui/mobile-overflow-menu/slice'
import { useSelector } from 'react-redux'

import { useCollectionCoverArt } from 'app/hooks/useCollectionCoverArt'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useNavigation } from 'app/hooks/useNavigation'
import { isEqual, useSelectorWeb } from 'app/hooks/useSelectorWeb'
import type { AppState } from 'app/store'
import { getPlayingUid } from 'app/store/live/selectors'

import { CollectionTileAgreementList } from './CollectionTileAgreementList'
import { LineupTile } from './LineupTile'
import type { LineupItemProps } from './types'

export const CollectionTile = (props: LineupItemProps) => {
  const { uid } = props

  const collection = useSelectorWeb(
    (state) => getCollection(state, { uid }),
    isEqual
  )

  const agreements = useSelectorWeb(
    (state) => getAgreementsFromCollection(state, { uid }),
    isEqual
  )

  const user = useSelectorWeb(
    (state) => getUserFromCollection(state, { uid }),
    isEqual
  )

  if (!collection || !agreements || !user) {
    console.warn(
      'Collection, agreements, or user missing for CollectionTile, preventing render'
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
      agreements={agreements}
      user={user}
    />
  )
}

type CollectionTileProps = LineupItemProps & {
  collection: Collection
  agreements: EnhancedCollectionAgreement[]
  user: User
}

const CollectionTileComponent = ({
  collection,
  togglePlay,
  agreements,
  user,
  ...lineupTileProps
}: CollectionTileProps) => {
  const dispatchWeb = useDispatchWeb()
  const navigation = useNavigation()
  const currentUserId = useSelectorWeb(getUserId)
  const currentAgreement = useSelector((state: AppState) => {
    const uid = getPlayingUid(state)
    return agreements.find((agreement) => agreement.uid === uid) ?? null
  })
  const isPlayingUid = useSelector((state: AppState) => {
    const uid = getPlayingUid(state)
    return agreements.some((agreement) => agreement.uid === uid)
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
      if (!agreements.length) return

      togglePlay({
        uid: currentAgreement?.uid ?? agreements[0]?.uid ?? null,
        id: currentAgreement?.agreement_id ?? agreements[0]?.agreement_id ?? null,
        source: PlaybackSource.CONTENT_LIST_TILE_AGREEMENT,
        isPlaying,
        isPlayingUid
      })
    },
    [isPlayingUid, currentAgreement, togglePlay, agreements]
  )

  const handlePressTitle = useCallback(() => {
    navigation.push({
      native: { screen: 'Collection', params: { id: content_list_id } },
      web: { route: routeWeb }
    })
  }, [content_list_id, routeWeb, navigation])

  const duration = useMemo(() => {
    return agreements.reduce(
      (duration: number, agreement: Agreement) => duration + agreement.duration,
      0
    )
  }, [agreements])

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
      <CollectionTileAgreementList agreements={agreements} onPress={handlePressTitle} />
    </LineupTile>
  )
}
