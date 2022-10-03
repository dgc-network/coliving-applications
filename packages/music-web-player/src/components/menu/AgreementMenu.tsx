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
  addAgreementToContentList
} from 'common/store/cache/collections/actions'
import { getCollectionId } from 'common/store/pages/collection/selectors'
import {
  saveAgreement,
  unsaveAgreement,
  repostAgreement,
  undoRepostAgreement,
  shareAgreement
} from 'common/store/social/agreements/actions'
import { requestOpen as openAddToContentList } from 'common/store/ui/addToContentList/actions'
import * as embedModalActions from 'components/embedModal/store/actions'
import { ToastContext } from 'components/toast/toastContext'
import { newCollectionMetadata } from 'schemas'
import * as editAgreementModalActions from 'store/application/ui/editAgreementModal/actions'
import { showSetAsLandlordPickConfirmation } from 'store/application/ui/setAsLandlordPickConfirmation/actions'
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
  setLandlordPick: 'Set as Landlord Pick',
  share: 'Share',
  undoRepost: 'Undo Repost',
  unfavorite: 'Unfavorite',
  unreposted: 'Un-Reposted!',
  unsetLandlordPick: 'Unset as Landlord Pick',
  visitLandlordPage: 'Visit Landlord Page',
  visitAgreementPage: 'Visit Agreement Page'
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
  includeAgreementPage: boolean
  isLandlordPick: boolean
  isDeleted: boolean
  isFavorited: boolean
  isOwner: boolean
  isOwnerDeactivated?: boolean
  isReposted: boolean
  agreementId: ID
  agreementTitle: string
  agreementPermalink: string
  type: 'agreement'
}

export type AgreementMenuProps = OwnProps &
  ReturnType<typeof mapDispatchToProps> &
  ReturnType<typeof mapStateToProps>

const AgreementMenu = (props: AgreementMenuProps) => {
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
      includeAgreementPage,
      isLandlordPick,
      isDeleted,
      isFavorited,
      isOwner,
      isOwnerDeactivated,
      isReposted,
      openAddToContentListModal,
      openEditAgreementModal,
      openEmbedModal,
      repostAgreement,
      saveAgreement,
      setLandlordPick,
      shareAgreement,
      agreementId,
      agreementTitle,
      agreementPermalink,
      undoRepostAgreement,
      unsaveAgreement,
      unsetLandlordPick
    } = props

    const shareMenuItem = {
      text: messages.share,
      onClick: () => {
        if (agreementId) {
          shareAgreement(agreementId)
          toast(messages.copiedToClipboard)
        }
      }
    }

    const repostMenuItem = {
      text: isReposted ? messages.undoRepost : messages.repost,
      // Set timeout so the menu has time to close before we propagate the change.
      onClick: () =>
        setTimeout(() => {
          isReposted ? undoRepostAgreement(agreementId) : repostAgreement(agreementId)
          toast(isReposted ? messages.unreposted : messages.reposted)
        }, 0)
    }

    const favoriteMenuItem = {
      text: isFavorited ? messages.unfavorite : messages.favorite,
      // Set timeout so the menu has time to close before we propagate the change.
      onClick: () =>
        setTimeout(() => {
          isFavorited ? unsaveAgreement(agreementId) : saveAgreement(agreementId)
        }, 0)
    }

    const addToContentListMenuItem = {
      text: messages.addToContentList,
      onClick: () => {
        openAddToContentListModal(agreementId, agreementTitle)
      }
    }

    const agreementPageMenuItem = {
      text: messages.visitAgreementPage,
      onClick: () => goToRoute(agreementPermalink)
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
        : () => setLandlordPick(agreementId)
    }

    const editAgreementMenuItem = {
      text: 'Edit Agreement',
      onClick: () => openEditAgreementModal(agreementId)
    }

    const embedMenuItem = {
      text: messages.embed,
      onClick: () => openEmbedModal(agreementId)
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
    if (agreementId && agreementTitle && includeAgreementPage && !isDeleted) {
      menu.items.push(agreementPageMenuItem)
    }
    if (agreementId && isOwner && includeLandlordPick && !isDeleted) {
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
      menu.items.push(editAgreementMenuItem)
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
    addAgreementToContentList: (agreementId: ID, contentListId: ID) =>
      dispatch(addAgreementToContentList(agreementId, contentListId)),
    shareAgreement: (agreementId: ID) =>
      dispatch(shareAgreement(agreementId, ShareSource.OVERFLOW)),
    saveAgreement: (agreementId: ID) =>
      dispatch(saveAgreement(agreementId, FavoriteSource.OVERFLOW)),
    unsaveAgreement: (agreementId: ID) =>
      dispatch(unsaveAgreement(agreementId, FavoriteSource.OVERFLOW)),
    repostAgreement: (agreementId: ID) =>
      dispatch(repostAgreement(agreementId, RepostSource.OVERFLOW)),
    undoRepostAgreement: (agreementId: ID) =>
      dispatch(undoRepostAgreement(agreementId, RepostSource.OVERFLOW)),
    setLandlordPick: (agreementId: ID) =>
      dispatch(showSetAsLandlordPickConfirmation(agreementId)),
    unsetLandlordPick: () => dispatch(showSetAsLandlordPickConfirmation()),
    createEmptyContentList: (tempId: ID, name: string, agreementId: ID) =>
      dispatch(
        createContentList(
          tempId,
          newCollectionMetadata({ content_list_name: name }),
          CreateContentListSource.FROM_AGREEMENT,
          agreementId
        )
      ),
    openAddToContentListModal: (agreementId: ID, title: string) =>
      dispatch(openAddToContentList(agreementId, title)),
    openEditAgreementModal: (agreementId: ID) =>
      dispatch(editAgreementModalActions.open(agreementId)),
    openEmbedModal: (agreementId: ID) =>
      dispatch(embedModalActions.open(agreementId, PlayableType.AGREEMENT))
  }
}

AgreementMenu.defaultProps = {
  includeShare: false,
  includeRepost: false,
  isFavorited: false,
  isReposted: false,
  includeEdit: true,
  includeEmbed: true,
  includeFavorite: true,
  includeAgreementPage: true,
  includeAddToContentList: true,
  includeLandlordPick: true,
  extraMenuItems: []
}

export default connect(mapStateToProps, mapDispatchToProps)(AgreementMenu)
