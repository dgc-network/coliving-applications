import { useCallback, useMemo } from 'react'

import type { Collection, User } from '@/common'
import {
  FavoriteSource,
  RepostSource,
  ShareSource,
  FavoriteType,
  SquareSizes
} from '@/common'
import { getUserId } from '-client/src/common/store/account/selectors'
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
import { setFavorite } from '-client/src/common/store/user-list/favorites/actions'
import { setRepost } from '-client/src/common/store/user-list/reposts/actions'
import { RepostType } from '-client/src/common/store/user-list/reposts/types'
import { formatDate } from '-client/src/common/utils/timeUtil'
import {
  FAVORITING_USERS_ROUTE,
  REPOSTING_USERS_ROUTE
} from '-client/src/utils/route'
import { getCollection, getUser } from 'common/store/pages/collection/selectors'
import { open as openOverflowMenu } from 'common/store/ui/mobile-overflow-menu/slice'

import { Screen, VirtualizedScrollView } from 'app/components/core'
import { useCollectionCoverArt } from 'app/hooks/useCollectionCoverArt'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useNavigation } from 'app/hooks/useNavigation'
import { useRoute } from 'app/hooks/useRoute'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import type { SearchContentList, SearchUser } from 'app/store/search/types'
import { makeStyles } from 'app/styles'

import { CollectionScreenDetailsTile } from './CollectionScreenDetailsTile'

const useStyles = makeStyles(({ spacing }) => ({
  root: {
    padding: spacing(3)
  }
}))

/**
 * `CollectionScreen` displays the details of a collection
 */
export const CollectionScreen = () => {
  const { params } = useRoute<'Collection'>()

  // params is incorrectly typed and can sometimes be undefined
  const { id, searchCollection } = params ?? {}

  const cachedCollection = useSelectorWeb((state) =>
    getCollection(state, { id })
  ) as Collection

  const cachedUser = useSelectorWeb((state) =>
    getUser(state, { id: cachedCollection?.contentList_owner_id })
  )

  const collection = cachedCollection ?? searchCollection
  const user = cachedUser ?? searchCollection?.user

  if (!collection || !user) {
    console.warn(
      'Collection or user missing for CollectionScreen, preventing render'
    )
    return null
  }

  return <CollectionScreenComponent collection={collection} user={user} />
}

type CollectionScreenComponentProps = {
  collection: Collection | SearchContentList
  user: User | SearchUser
}

const CollectionScreenComponent = ({
  collection,
  user
}: CollectionScreenComponentProps) => {
  const styles = useStyles()
  const dispatchWeb = useDispatchWeb()
  const navigation = useNavigation()
  const {
    _cover_art_sizes,
    _is_publishing,
    description,
    has_current_user_reposted,
    has_current_user_saved,
    is_album,
    is_private,
    contentList_id,
    contentList_name,
    contentList_owner_id,
    repost_count,
    save_count,
    updated_at
  } = collection

  const imageUrl = useCollectionCoverArt({
    id: contentList_id,
    sizes: _cover_art_sizes,
    size: SquareSizes.SIZE_480_BY_480
  })

  const currentUserId = useSelectorWeb(getUserId)
  const isOwner = currentUserId === contentList_owner_id

  const extraDetails = useMemo(
    () => [
      {
        label: 'Modified',
        value: formatDate(updated_at)
      }
    ],
    [updated_at]
  )

  const handlePressOverflow = useCallback(() => {
    const overflowActions = [
      isOwner || is_private
        ? null
        : has_current_user_reposted
        ? OverflowAction.UNREPOST
        : OverflowAction.REPOST,
      isOwner || is_private
        ? null
        : has_current_user_saved
        ? OverflowAction.UNFAVORITE
        : OverflowAction.FAVORITE,
      !is_album && isOwner ? OverflowAction.EDIT_CONTENT_LIST : null,
      isOwner && !is_album && is_private
        ? OverflowAction.PUBLISH_CONTENT_LIST
        : null,
      isOwner && !is_album ? OverflowAction.DELETE_CONTENT_LIST : null,
      OverflowAction.VIEW_LANDLORD_PAGE
    ].filter(Boolean) as OverflowAction[]

    dispatchWeb(
      openOverflowMenu({
        source: OverflowSource.COLLECTIONS,
        id: contentList_id,
        overflowActions
      })
    )
  }, [
    dispatchWeb,
    contentList_id,
    isOwner,
    is_album,
    is_private,
    has_current_user_reposted,
    has_current_user_saved
  ])

  const handlePressSave = useCallback(() => {
    if (has_current_user_saved) {
      dispatchWeb(unsaveCollection(contentList_id, FavoriteSource.COLLECTION_PAGE))
    } else {
      dispatchWeb(saveCollection(contentList_id, FavoriteSource.COLLECTION_PAGE))
    }
  }, [dispatchWeb, contentList_id, has_current_user_saved])

  const handlePressShare = useCallback(() => {
    dispatchWeb(
      requestOpenShareModal({
        type: 'collection',
        collectionId: contentList_id,
        source: ShareSource.PAGE
      })
    )
  }, [dispatchWeb, contentList_id])

  const handlePressRepost = useCallback(() => {
    if (has_current_user_reposted) {
      dispatchWeb(
        undoRepostCollection(contentList_id, RepostSource.COLLECTION_PAGE)
      )
    } else {
      dispatchWeb(repostCollection(contentList_id, RepostSource.COLLECTION_PAGE))
    }
  }, [dispatchWeb, contentList_id, has_current_user_reposted])

  const handlePressFavorites = useCallback(() => {
    dispatchWeb(setFavorite(contentList_id, FavoriteType.CONTENT_LIST))
    navigation.push({
      native: {
        screen: 'Favorited',
        params: { id: contentList_id, favoriteType: FavoriteType.CONTENT_LIST }
      },
      web: { route: FAVORITING_USERS_ROUTE }
    })
  }, [dispatchWeb, contentList_id, navigation])

  const handlePressReposts = useCallback(() => {
    dispatchWeb(setRepost(contentList_id, RepostType.COLLECTION))
    navigation.push({
      native: {
        screen: 'Reposts',
        params: { id: contentList_id, repostType: RepostType.COLLECTION }
      },
      web: { route: REPOSTING_USERS_ROUTE }
    })
  }, [dispatchWeb, contentList_id, navigation])

  return (
    <Screen>
      <VirtualizedScrollView
        listKey={`contentList-${collection.contentList_id}`}
        style={styles.root}
      >
        <CollectionScreenDetailsTile
          description={description ?? ''}
          extraDetails={extraDetails}
          hasReposted={has_current_user_reposted}
          hasSaved={has_current_user_saved}
          imageUrl={imageUrl}
          isAlbum={is_album}
          isPrivate={is_private}
          isPublishing={_is_publishing ?? false}
          onPressFavorites={handlePressFavorites}
          onPressOverflow={handlePressOverflow}
          onPressRepost={handlePressRepost}
          onPressReposts={handlePressReposts}
          onPressSave={handlePressSave}
          onPressShare={handlePressShare}
          repostCount={repost_count}
          saveCount={save_count}
          title={contentList_name}
          user={user}
        />
      </VirtualizedScrollView>
    </Screen>
  )
}
