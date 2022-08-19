import { useContext } from 'react'

import {
  ID,
  PlayableType,
  FavoriteSource,
  RepostSource,
  ShareSource,
  CreatePlaylistSource
} from '@coliving/common'
import { PopupMenuItem } from '@coliving/stems'
import { push as pushRoute } from 'connected-react-router'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'

import { getAccountOwnedPlaylists } from 'common/store/account/selectors'
import {
  createPlaylist,
  addAgreementToPlaylist
} from 'common/store/cache/collections/actions'
import { getCollectionId } from 'common/store/pages/collection/selectors'
import {
  saveAgreement,
  unsaveAgreement,
  repostAgreement,
  undoRepostAgreement,
  shareAgreement
} from 'common/store/social/agreements/actions'
import { requestOpen as openAddToPlaylist } from 'common/store/ui/add-to-playlist/actions'
import * as embedModalActions from 'components/embed-modal/store/actions'
import { ToastContext } from 'components/toast/ToastContext'
import { newCollectionMetadata } from 'schemas'
import * as editAgreementModalActions from 'store/application/ui/editAgreementModal/actions'
import { showSetAsArtistPickConfirmation } from 'store/application/ui/setAsArtistPickConfirmation/actions'
import { AppState } from 'store/types'
import { profilePage } from 'utils/route'

const messages = {
  addToNewPlaylist: 'Add to New Playlist',
  addToPlaylist: 'Add to Playlist',
  copiedToClipboard: 'Copied To Clipboard!',
  embed: 'Embed',
  favorite: 'Favorite',
  repost: 'Repost',
  reposted: 'Reposted!',
  setArtistPick: 'Set as Artist Pick',
  share: 'Share',
  undoRepost: 'Undo Repost',
  unfavorite: 'Unfavorite',
  unreposted: 'Un-Reposted!',
  unsetArtistPick: 'Unset as Artist Pick',
  visitArtistPage: 'Visit Artist Page',
  visitAgreementPage: 'Visit Agreement Page'
}

export type OwnProps = {
  children: (items: PopupMenuItem[]) => JSX.Element
  extraMenuItems?: PopupMenuItem[]
  handle: string
  includeAddToPlaylist: boolean
  includeArtistPick: boolean
  includeEdit: boolean
  includeEmbed?: boolean
  includeFavorite: boolean
  includeRepost: boolean
  includeShare: boolean
  includeAgreementPage: boolean
  isArtistPick: boolean
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
      includeAddToPlaylist,
      includeArtistPick,
      includeEdit,
      includeEmbed,
      includeFavorite,
      includeRepost,
      includeShare,
      includeAgreementPage,
      isArtistPick,
      isDeleted,
      isFavorited,
      isOwner,
      isOwnerDeactivated,
      isReposted,
      openAddToPlaylistModal,
      openEditAgreementModal,
      openEmbedModal,
      repostAgreement,
      saveAgreement,
      setArtistPick,
      shareAgreement,
      agreementId,
      agreementTitle,
      agreementPermalink,
      undoRepostAgreement,
      unsaveAgreement,
      unsetArtistPick
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

    const addToPlaylistMenuItem = {
      text: messages.addToPlaylist,
      onClick: () => {
        openAddToPlaylistModal(agreementId, agreementTitle)
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

    const artistPageMenuItem = {
      text: messages.visitArtistPage,
      onClick: () => goToRoute(profilePage(handle))
    }

    const artistPickMenuItem = {
      text: isArtistPick ? messages.unsetArtistPick : messages.setArtistPick,
      onClick: isArtistPick
        ? () => unsetArtistPick()
        : () => setArtistPick(agreementId)
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
    if (includeAddToPlaylist && !isDeleted) {
      menu.items.push(addToPlaylistMenuItem)
    }
    if (agreementId && agreementTitle && includeAgreementPage && !isDeleted) {
      menu.items.push(agreementPageMenuItem)
    }
    if (agreementId && isOwner && includeArtistPick && !isDeleted) {
      menu.items.push(artistPickMenuItem)
    }
    // TODO: Add back go to album when we have better album linking.
    // if (albumId && albumName) {
    //   menu.items.push(albumPageMenuItem)
    // }
    if (handle && !isOwnerDeactivated) {
      menu.items.push(artistPageMenuItem)
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
    playlists: getAccountOwnedPlaylists(state),
    currentCollectionId: getCollectionId(state)
  }
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    goToRoute: (route: string) => dispatch(pushRoute(route)),
    addAgreementToPlaylist: (agreementId: ID, playlistId: ID) =>
      dispatch(addAgreementToPlaylist(agreementId, playlistId)),
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
    setArtistPick: (agreementId: ID) =>
      dispatch(showSetAsArtistPickConfirmation(agreementId)),
    unsetArtistPick: () => dispatch(showSetAsArtistPickConfirmation()),
    createEmptyPlaylist: (tempId: ID, name: string, agreementId: ID) =>
      dispatch(
        createPlaylist(
          tempId,
          newCollectionMetadata({ playlist_name: name }),
          CreatePlaylistSource.FROM_AGREEMENT,
          agreementId
        )
      ),
    openAddToPlaylistModal: (agreementId: ID, title: string) =>
      dispatch(openAddToPlaylist(agreementId, title)),
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
  includeAddToPlaylist: true,
  includeArtistPick: true,
  extraMenuItems: []
}

export default connect(mapStateToProps, mapDispatchToProps)(AgreementMenu)
