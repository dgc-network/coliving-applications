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
import * as embedModalActions from 'components/embedModal/store/actions'
import { open as openEditCollectionModal } from 'store/application/ui/editContentListModal/slice'
import { AppState } from 'store/types'
import { albumPage, contentListPage, profilePage } from 'utils/route'

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
  contentListId: ContentListId
  contentListName: string
  type: 'album' | 'contentList'
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
      contentListName,
      contentListId,
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
      isLandlord,
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

    const routePage = type === 'album' ? albumPage : contentListPage
    const shareMenuItem = {
      text: 'Share',
      onClick: () => {
        shareCollection(contentListId)
        if (onShare) onShare()
      }
    }

    const typeName = type === 'album' ? 'Album' : 'ContentList'
    const favoriteMenuItem = {
      text: isFavorited ? `Unfavorite ${typeName}` : `Favorite ${typeName}`,
      onClick: () =>
        isFavorited ? unsaveCollection(contentListId) : saveCollection(contentListId)
    }

    const repostMenuItem = {
      text: isReposted ? 'Undo Repost' : 'Repost',
      onClick: () => {
        if (isReposted) {
          undoRepostCollection(contentListId)
        } else {
          repostCollection(contentListId)
          if (onRepost) onRepost()
        }
      }
    }

    const landlordPageMenuItem = {
      text: `Visit ${isLandlord ? 'Author' : 'User'} Page`,
      onClick: () => goToRoute(profilePage(handle))
    }

    const contentListPageMenuItem = {
      text: `Visit ${typeName} Page`,
      onClick: () => goToRoute(routePage(handle, contentListName, contentListId))
    }

    const editCollectionMenuItem = {
      text: `Edit ${typeName}`,
      onClick: () => editCollection(contentListId)
    }

    const embedMenuItem = {
      text: messages.embed,
      onClick: () =>
        openEmbedModal(
          contentListId,
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
    menu.items.push(landlordPageMenuItem)
    if (includeVisitPage) {
      menu.items.push(contentListPageMenuItem)
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
    isLandlord: user ? user.digital_content_count > 0 : false
  }
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    goToRoute: (route: string) => dispatch(pushRoute(route)),
    shareCollection: (contentListId: ContentListId) =>
      dispatch(socialActions.shareCollection(contentListId, ShareSource.OVERFLOW)),
    editCollection: (contentListId: ID) =>
      dispatch(openEditCollectionModal(contentListId)),
    saveCollection: (contentListId: ContentListId) =>
      dispatch(
        socialActions.saveCollection(contentListId, FavoriteSource.OVERFLOW)
      ),
    unsaveCollection: (contentListId: ContentListId) =>
      dispatch(
        socialActions.unsaveCollection(contentListId, FavoriteSource.OVERFLOW)
      ),
    repostCollection: (contentListId: ContentListId) =>
      dispatch(
        socialActions.repostCollection(contentListId, RepostSource.OVERFLOW)
      ),
    undoRepostCollection: (contentListId: ContentListId) =>
      dispatch(
        socialActions.undoRepostCollection(contentListId, RepostSource.OVERFLOW)
      ),
    openEmbedModal: (contentListId: ID, kind: PlayableType) =>
      dispatch(embedModalActions.open(contentListId, kind))
  }
}

CollectionMenu.defaultProps = {
  handle: '',
  mount: 'page',
  isFavorited: false,
  isReposted: false,
  includeFavorite: true,
  isLandlord: false,
  includeVisitPage: true,
  includeEmbed: true,
  extraMenuItems: []
}

export default connect(mapStateToProps, mapDispatchToProps)(CollectionMenu)
