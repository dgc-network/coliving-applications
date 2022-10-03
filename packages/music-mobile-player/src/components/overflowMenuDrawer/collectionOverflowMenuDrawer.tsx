import type { ID } from '@coliving/common'
import { FavoriteSource, RepostSource, ShareSource } from '@coliving/common'
import type { CommonState } from '@coliving/web/src/common/store'
import { publishContentList } from '@coliving/web/src/common/store/cache/collections/actions'
import { getCollection } from '@coliving/web/src/common/store/cache/collections/selectors'
import { getUser } from '@coliving/web/src/common/store/cache/users/selectors'
// Importing directly from -client for now, this will be removed
// when the profile page is implemented in RN
import {
  repostCollection,
  undoRepostCollection,
  saveCollection,
  unsaveCollection,
  shareCollection
} from '@coliving/web/src/common/store/social/collections/actions'
import { open as openEditContentList } from '@coliving/web/src/common/store/ui/createContentListModal/actions'
import { requestOpen as openDeleteContentList } from '@coliving/web/src/common/store/ui/delete-content-list-confirmation-modal/slice'
import { getMobileOverflowModal } from '@coliving/web/src/common/store/ui/mobile-overflow-menu/selectors'
import type { OverflowActionCallbacks } from '@coliving/web/src/common/store/ui/mobile-overflow-menu/types'
import { OverflowAction } from '@coliving/web/src/common/store/ui/mobile-overflow-menu/types'
import {
  profilePage,
  contentListPage,
  albumPage
} from '@coliving/web/src/utils/route'

import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useNavigation } from 'app/hooks/useNavigation'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'

type Props = {
  render: (callbacks: OverflowActionCallbacks) => React.ReactNode
}

const CollectionOverflowMenuDrawer = ({ render }: Props) => {
  const dispatchWeb = useDispatchWeb()
  const navigation = useNavigation()
  const { id: modalId } = useSelectorWeb(getMobileOverflowModal)
  const id = modalId as ID

  const contentList = useSelectorWeb((state: CommonState) =>
    getCollection(state, { id })
  )

  const user = useSelectorWeb((state: CommonState) =>
    getUser(state, { id: contentList?.content_list_owner_id })
  )

  if (!contentList || !user) {
    return null
  }
  const { content_list_name, is_album } = contentList
  const { handle } = user

  if (!id || !handle || !content_list_name || is_album === undefined) {
    return null
  }

  const callbacks = {
    [OverflowAction.REPOST]: () =>
      dispatchWeb(repostCollection(id, RepostSource.OVERFLOW)),
    [OverflowAction.UNREPOST]: () =>
      dispatchWeb(undoRepostCollection(id, RepostSource.OVERFLOW)),
    [OverflowAction.FAVORITE]: () =>
      dispatchWeb(saveCollection(id, FavoriteSource.OVERFLOW)),
    [OverflowAction.UNFAVORITE]: () =>
      dispatchWeb(unsaveCollection(id, FavoriteSource.OVERFLOW)),
    [OverflowAction.SHARE]: () =>
      dispatchWeb(shareCollection(id, ShareSource.OVERFLOW)),
    [OverflowAction.VIEW_ALBUM_PAGE]: () => {
      navigation.navigate({
        native: { screen: 'Collection', params: { id } },
        web: {
          route: (is_album ? albumPage : contentListPage)(
            handle,
            content_list_name,
            id
          )
        }
      })
    },
    [OverflowAction.VIEW_LANDLORD_PAGE]: () => {
      navigation.navigate({
        native: { screen: 'Profile', params: { handle } },
        web: { route: profilePage(handle) }
      })
    },
    [OverflowAction.EDIT_CONTENT_LIST]: () => {
      navigation.navigate({
        native: { screen: 'EditContentList', params: { id } }
      })
      dispatchWeb(openEditContentList(id))
    },
    [OverflowAction.DELETE_CONTENT_LIST]: () =>
      dispatchWeb(openDeleteContentList({ contentListId: id })),
    [OverflowAction.PUBLISH_CONTENT_LIST]: () =>
      is_album ? () => {} : dispatchWeb(publishContentList(Number(id)))
  }

  return render(callbacks)
}

export default CollectionOverflowMenuDrawer
