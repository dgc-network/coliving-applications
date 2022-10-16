import { useContext } from 'react'

import {
  ID,
  PlayableType,
  FavoriteSource,
  RepostSource,
  ShareSource,
  CreateContentListSource
} from '@coliving/common'
import { PopupMenuItem } from '@coliving/stems'
import { push as pushRoute } from 'connected-react-router'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'

import { getAccountOwnedContentLists } from 'common/store/account/selectors'
import {
  createContentList,
  addDigitalContentToContentList
} from 'common/store/cache/collections/actions'
import { getCollectionId } from 'common/store/pages/collection/selectors'
import {
  saveDigitalContent,
  unsaveDigitalContent,
  repostDigitalContent,
  undoRepostDigitalContent,
  shareDigitalContent
} from 'common/store/social/digital_contents/actions'
import { requestOpen as openAddToContentList } from 'common/store/ui/addToContentList/actions'
import * as embedModalActions from 'components/embedModal/store/actions'
import { ToastContext } from 'components/toast/toastContext'
import { newCollectionMetadata } from 'schemas'
import * as editDigitalContentModalActions from 'store/application/ui/editDigitalContentModal/actions'
import { showSetAsLandlordPickConfirmation } from 'store/application/ui/setAsAuthorPickConfirmation/actions'
import { AppState } from 'store/types'
import { profilePage } from 'utils/route'

const messages = {
  addToNewContentList: 'Add to New ContentList',
  addToContentList: 'Add to ContentList',
  copiedToClipboard: 'Copied To Clipboard!',
  embed: 'Embed',
  favorite: 'Favorite',
  repost: 'Repost',
  reposted: 'Reposted!',
  setLandlordPick: 'Set as Author Pick',
  share: 'Share',
  undoRepost: 'Undo Repost',
  unfavorite: 'Unfavorite',
  unreposted: 'Un-Reposted!',
  unsetLandlordPick: 'Unset as Author Pick',
  visitLandlordPage: 'Visit Author Page',
  visitDigitalContentPage: 'Visit DigitalContent Page'
}

export type OwnProps = {
  children: (items: PopupMenuItem[]) => JSX.Element
  extraMenuItems?: PopupMenuItem[]
  handle: string
  includeAddToContentList: boolean
  includeLandlordPick: boolean
  includeEdit: boolean
  includeEmbed?: boolean
  includeFavorite: boolean
  includeRepost: boolean
  includeShare: boolean
  includeDigitalContentPage: boolean
  isLandlordPick: boolean
  isDeleted: boolean
  isFavorited: boolean
  isOwner: boolean
  isOwnerDeactivated?: boolean
  isReposted: boolean
  digitalContentId: ID
  digitalContentTitle: string
  digitalContentPermalink: string
  type: 'digital_content'
}

export type DigitalContentMenuProps = OwnProps &
  ReturnType<typeof mapDispatchToProps> &
  ReturnType<typeof mapStateToProps>

const DigitalContentMenu = (props: DigitalContentMenuProps) => {
  const { toast } = useContext(ToastContext)

  const getMenu = () => {
    const {
      extraMenuItems,
      goToRoute,
      handle,
      includeAddToContentList,
      includeLandlordPick,
      includeEdit,
      includeEmbed,
      includeFavorite,
      includeRepost,
      includeShare,
      includeDigitalContentPage,
      isLandlordPick,
      isDeleted,
      isFavorited,
      isOwner,
      isOwnerDeactivated,
      isReposted,
      openAddToContentListModal,
      openEditDigitalContentModal,
      openEmbedModal,
      repostDigitalContent,
      saveDigitalContent,
      setLandlordPick,
      shareDigitalContent,
      digitalContentId,
      digitalContentTitle,
      digitalContentPermalink,
      undoRepostDigitalContent,
      unsaveDigitalContent,
      unsetLandlordPick
    } = props

    const shareMenuItem = {
      text: messages.share,
      onClick: () => {
        if (digitalContentId) {
          shareDigitalContent(digitalContentId)
          toast(messages.copiedToClipboard)
        }
      }
    }

    const repostMenuItem = {
      text: isReposted ? messages.undoRepost : messages.repost,
      // Set timeout so the menu has time to close before we propagate the change.
      onClick: () =>
        setTimeout(() => {
          isReposted ? undoRepostDigitalContent(digitalContentId) : repostDigitalContent(digitalContentId)
          toast(isReposted ? messages.unreposted : messages.reposted)
        }, 0)
    }

    const favoriteMenuItem = {
      text: isFavorited ? messages.unfavorite : messages.favorite,
      // Set timeout so the menu has time to close before we propagate the change.
      onClick: () =>
        setTimeout(() => {
          isFavorited ? unsaveDigitalContent(digitalContentId) : saveDigitalContent(digitalContentId)
        }, 0)
    }

    const addToContentListMenuItem = {
      text: messages.addToContentList,
      onClick: () => {
        openAddToContentListModal(digitalContentId, digitalContentTitle)
      }
    }

    const digitalContentPageMenuItem = {
      text: messages.visitDigitalContentPage,
      onClick: () => goToRoute(digitalContentPermalink)
    }

    // TODO: Add back go to album when we have better album linking.
    // const albumPageMenuItem = {
    //   text: 'Visit Album Page',
    //   onClick: () => goToRoute(albumPage(handle, albumName, albumId))
    // }

    const landlordPageMenuItem = {
      text: messages.visitLandlordPage,
      onClick: () => goToRoute(profilePage(handle))
    }

    const landlordPickMenuItem = {
      text: isLandlordPick ? messages.unsetLandlordPick : messages.setLandlordPick,
      onClick: isLandlordPick
        ? () => unsetLandlordPick()
        : () => setLandlordPick(digitalContentId)
    }

    const editDigitalContentMenuItem = {
      text: 'Edit DigitalContent',
      onClick: () => openEditDigitalContentModal(digitalContentId)
    }

    const embedMenuItem = {
      text: messages.embed,
      onClick: () => openEmbedModal(digitalContentId)
    }

    const menu: { items: PopupMenuItem[] } = { items: [] }

    if (includeShare && !isDeleted) {
      menu.items.push(shareMenuItem)
    }
    if (includeRepost && !isOwner && !isDeleted) {
      menu.items.push(repostMenuItem)
    }
    if (includeFavorite && !isOwner && (!isDeleted || isFavorited)) {
      menu.items.push(favoriteMenuItem)
    }
    if (includeAddToContentList && !isDeleted) {
      menu.items.push(addToContentListMenuItem)
    }
    if (digitalContentId && digitalContentTitle && includeDigitalContentPage && !isDeleted) {
      menu.items.push(digitalContentPageMenuItem)
    }
    if (digitalContentId && isOwner && includeLandlordPick && !isDeleted) {
      menu.items.push(landlordPickMenuItem)
    }
    // TODO: Add back go to album when we have better album linking.
    // if (albumId && albumName) {
    //   menu.items.push(albumPageMenuItem)
    // }
    if (handle && !isOwnerDeactivated) {
      menu.items.push(landlordPageMenuItem)
    }
    if (includeEdit && isOwner && !isDeleted) {
      menu.items.push(editDigitalContentMenuItem)
    }
    if (extraMenuItems && extraMenuItems.length > 0) {
      menu.items = menu.items.concat(extraMenuItems)
    }
    if (includeEmbed && !isDeleted) {
      menu.items.push(embedMenuItem)
    }

    return menu
  }

  const menu = getMenu()

  return props.children(menu.items)
}

function mapStateToProps(state: AppState) {
  return {
    contentLists: getAccountOwnedContentLists(state),
    currentCollectionId: getCollectionId(state)
  }
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    goToRoute: (route: string) => dispatch(pushRoute(route)),
    addDigitalContentToContentList: (digitalContentId: ID, contentListId: ID) =>
      dispatch(addDigitalContentToContentList(digitalContentId, contentListId)),
    shareDigitalContent: (digitalContentId: ID) =>
      dispatch(shareDigitalContent(digitalContentId, ShareSource.OVERFLOW)),
    saveDigitalContent: (digitalContentId: ID) =>
      dispatch(saveDigitalContent(digitalContentId, FavoriteSource.OVERFLOW)),
    unsaveDigitalContent: (digitalContentId: ID) =>
      dispatch(unsaveDigitalContent(digitalContentId, FavoriteSource.OVERFLOW)),
    repostDigitalContent: (digitalContentId: ID) =>
      dispatch(repostDigitalContent(digitalContentId, RepostSource.OVERFLOW)),
    undoRepostDigitalContent: (digitalContentId: ID) =>
      dispatch(undoRepostDigitalContent(digitalContentId, RepostSource.OVERFLOW)),
    setLandlordPick: (digitalContentId: ID) =>
      dispatch(showSetAsLandlordPickConfirmation(digitalContentId)),
    unsetLandlordPick: () => dispatch(showSetAsLandlordPickConfirmation()),
    createEmptyContentList: (tempId: ID, name: string, digitalContentId: ID) =>
      dispatch(
        createContentList(
          tempId,
          newCollectionMetadata({ content_list_name: name }),
          CreateContentListSource.FROM_DIGITAL_CONTENT,
          digitalContentId
        )
      ),
    openAddToContentListModal: (digitalContentId: ID, title: string) =>
      dispatch(openAddToContentList(digitalContentId, title)),
    openEditDigitalContentModal: (digitalContentId: ID) =>
      dispatch(editDigitalContentModalActions.open(digitalContentId)),
    openEmbedModal: (digitalContentId: ID) =>
      dispatch(embedModalActions.open(digitalContentId, PlayableType.DIGITAL_CONTENT))
  }
}

DigitalContentMenu.defaultProps = {
  includeShare: false,
  includeRepost: false,
  isFavorited: false,
  isReposted: false,
  includeEdit: true,
  includeEmbed: true,
  includeFavorite: true,
  includeDigitalContentPage: true,
  includeAddToContentList: true,
  includeLandlordPick: true,
  extraMenuItems: []
}

export default connect(mapStateToProps, mapDispatchToProps)(DigitalContentMenu)
