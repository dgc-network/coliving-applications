import {
  PlayableType,
  ID,
  ShareSource,
  FavoriteSource,
  RepostSource
} from '@coliving/common'
import { PopupMenuItem } from '@coliving/stems'
import { push as pushRoute } from 'connected-react-router'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'

import { getUser } from 'common/store/cache/users/selectors'
import * as socialActions from 'common/store/social/collections/actions'
import * as embedModalActions from 'components/embed-modal/store/actions'
import { open as openEditCollectionModal } from 'store/application/ui/editContentListModal/slice'
import { AppState } from 'store/types'
import { albumPage, content listPage, profilePage } from 'utils/route'

type ContentListId = number

export type OwnProps = {
  children: (items: PopupMenuItem[]) => JSX.Element
  extraMenuItems: PopupMenuItem[]
  handle: string
  includeEdit?: boolean
  includeEmbed: boolean
  includeFavorite: boolean
  includeRepost: boolean
  includeShare: boolean
  includeVisitPage: boolean
  isFavorited: boolean
  isOwner: boolean
  isPublic: boolean
  isReposted: boolean
  onClose?: () => void
  onRepost?: () => void
  onShare?: () => void
  content listId: ContentListId
  content listName: string
  type: 'album' | 'content list'
}

export type CollectionMenuProps = OwnProps &
  ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps>

const messages = {
  embed: 'Embed'
}

const CollectionMenu = (props: CollectionMenuProps) => {
  const getMenu = () => {
    const {
      type,
      handle,
      content listName,
      content listId,
      isOwner,
      isFavorited,
      isReposted,
      includeEdit,
      includeShare,
      includeRepost,
      includeFavorite,
      includeEmbed,
      includeVisitPage,
      isPublic,
      isArtist,
      onShare,
      goToRoute,
      openEmbedModal,
      editCollection,
      shareCollection,
      saveCollection,
      unsaveCollection,
      repostCollection,
      undoRepostCollection,
      onRepost,
      extraMenuItems
    } = props

    const routePage = type === 'album' ? albumPage : content listPage
    const shareMenuItem = {
      text: 'Share',
      onClick: () => {
        shareCollection(content listId)
        if (onShare) onShare()
      }
    }

    const typeName = type === 'album' ? 'Album' : 'ContentList'
    const favoriteMenuItem = {
      text: isFavorited ? `Unfavorite ${typeName}` : `Favorite ${typeName}`,
      onClick: () =>
        isFavorited ? unsaveCollection(content listId) : saveCollection(content listId)
    }

    const repostMenuItem = {
      text: isReposted ? 'Undo Repost' : 'Repost',
      onClick: () => {
        if (isReposted) {
          undoRepostCollection(content listId)
        } else {
          repostCollection(content listId)
          if (onRepost) onRepost()
        }
      }
    }

    const artistPageMenuItem = {
      text: `Visit ${isArtist ? 'Artist' : 'User'} Page`,
      onClick: () => goToRoute(profilePage(handle))
    }

    const content listPageMenuItem = {
      text: `Visit ${typeName} Page`,
      onClick: () => goToRoute(routePage(handle, content listName, content listId))
    }

    const editCollectionMenuItem = {
      text: `Edit ${typeName}`,
      onClick: () => editCollection(content listId)
    }

    const embedMenuItem = {
      text: messages.embed,
      onClick: () =>
        openEmbedModal(
          content listId,
          type === 'album' ? PlayableType.ALBUM : PlayableType.CONTENT_LIST
        )
    }

    const menu: { items: PopupMenuItem[] } = { items: [] }

    if (menu) {
      if (includeShare) menu.items.push(shareMenuItem)
    }
    if (!isOwner) {
      if (includeRepost) menu.items.push(repostMenuItem)
      if (includeFavorite) menu.items.push(favoriteMenuItem)
    }
    menu.items.push(artistPageMenuItem)
    if (includeVisitPage) {
      menu.items.push(content listPageMenuItem)
    }
    if (extraMenuItems.length > 0) {
      menu.items = menu.items.concat(extraMenuItems)
    }
    if (includeEmbed && isPublic) {
      menu.items.push(embedMenuItem)
    }
    if (includeEdit && isOwner) {
      menu.items.push(editCollectionMenuItem)
    }

    return menu
  }

  const menu = getMenu()

  return props.children(menu.items)
}

function mapStateToProps(state: AppState, props: OwnProps) {
  const user = getUser(state, {
    handle: props.handle ? props.handle.toLowerCase() : null
  })
  return {
    isArtist: user ? user.agreement_count > 0 : false
  }
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    goToRoute: (route: string) => dispatch(pushRoute(route)),
    shareCollection: (content listId: ContentListId) =>
      dispatch(socialActions.shareCollection(content listId, ShareSource.OVERFLOW)),
    editCollection: (content listId: ID) =>
      dispatch(openEditCollectionModal(content listId)),
    saveCollection: (content listId: ContentListId) =>
      dispatch(
        socialActions.saveCollection(content listId, FavoriteSource.OVERFLOW)
      ),
    unsaveCollection: (content listId: ContentListId) =>
      dispatch(
        socialActions.unsaveCollection(content listId, FavoriteSource.OVERFLOW)
      ),
    repostCollection: (content listId: ContentListId) =>
      dispatch(
        socialActions.repostCollection(content listId, RepostSource.OVERFLOW)
      ),
    undoRepostCollection: (content listId: ContentListId) =>
      dispatch(
        socialActions.undoRepostCollection(content listId, RepostSource.OVERFLOW)
      ),
    openEmbedModal: (content listId: ID, kind: PlayableType) =>
      dispatch(embedModalActions.open(content listId, kind))
  }
}

CollectionMenu.defaultProps = {
  handle: '',
  mount: 'page',
  isFavorited: false,
  isReposted: false,
  includeFavorite: true,
  isArtist: false,
  includeVisitPage: true,
  includeEmbed: true,
  extraMenuItems: []
}

export default connect(mapStateToProps, mapDispatchToProps)(CollectionMenu)
