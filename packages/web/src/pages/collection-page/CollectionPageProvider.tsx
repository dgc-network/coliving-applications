import { ChangeEvent, Component, ComponentType } from 'react'

import {
  ID,
  UID,
  PlayableType,
  RepostSource,
  FavoriteSource,
  Name,
  PlaybackSource,
  ShareSource,
  FollowSource,
  Collection,
  SmartCollection,
  FavoriteType,
  Kind,
  Status,
  Uid
} from '@coliving/common'
import { push as pushRoute, replace } from 'connected-react-router'
import { UnregisterCallback } from 'history'
import { connect } from 'react-redux'
import { withRouter, RouteComponentProps } from 'react-router-dom'
import { Dispatch } from 'redux'

import {
  getUserId,
  getAccountCollections
} from 'common/store/account/selectors'
import {
  editPlaylist,
  removeAgreementFromPlaylist,
  orderPlaylist,
  publishPlaylist,
  deletePlaylist
} from 'common/store/cache/collections/actions'
import {
  makeGetTableMetadatas,
  makeGetLineupOrder
} from 'common/store/lineup/selectors'
import { updatePlaylistLastViewedAt } from 'common/store/notifications/actions'
import { getPlaylistUpdates } from 'common/store/notifications/selectors'
import * as collectionActions from 'common/store/pages/collection/actions'
import { agreementsActions } from 'common/store/pages/collection/lineup/actions'
import {
  getCollection,
  getCollectionStatus,
  getCollectionAgreementsLineup,
  getCollectionUid,
  getUser,
  getUserUid
} from 'common/store/pages/collection/selectors'
import {
  AgreementRecord,
  CollectionAgreement,
  CollectionsPageType
} from 'common/store/pages/collection/types'
import { makeGetCurrent } from 'common/store/queue/selectors'
import * as socialCollectionsActions from 'common/store/social/collections/actions'
import * as socialAgreementsActions from 'common/store/social/agreements/actions'
import * as socialUsersActions from 'common/store/social/users/actions'
import { open } from 'common/store/ui/mobile-overflow-menu/slice'
import {
  OverflowAction,
  OverflowSource
} from 'common/store/ui/mobile-overflow-menu/types'
import { requestOpen as requestOpenShareModal } from 'common/store/ui/share-modal/slice'
import { setFavorite } from 'common/store/user-list/favorites/actions'
import { setRepost } from 'common/store/user-list/reposts/actions'
import { RepostType } from 'common/store/user-list/reposts/types'
import { formatUrlName } from 'common/utils/formatUtil'
import DeletedPage from 'pages/deleted-page/DeletedPage'
import { AgreementEvent, make } from 'store/analytics/actions'
import { open as openEditCollectionModal } from 'store/application/ui/editPlaylistModal/slice'
import {
  setUsers,
  setVisibility
} from 'store/application/ui/userListModal/slice'
import {
  UserListType,
  UserListEntityType
} from 'store/application/ui/userListModal/types'
import { getPlaying, getBuffering } from 'store/player/selectors'
import { getLocationPathname } from 'store/routing/selectors'
import { AppState } from 'store/types'
import {
  profilePage,
  NOT_FOUND_PAGE,
  REPOSTING_USERS_ROUTE,
  FAVORITING_USERS_ROUTE,
  fullPlaylistPage,
  playlistPage,
  albumPage,
  getPathname
} from 'utils/route'
import { parseCollectionRoute } from 'utils/route/collectionRouteParser'

import { CollectionPageProps as DesktopCollectionPageProps } from './components/desktop/CollectionPage'
import { CollectionPageProps as MobileCollectionPageProps } from './components/mobile/CollectionPage'

type OwnProps = {
  type: CollectionsPageType
  isMobile: boolean
  children:
    | ComponentType<MobileCollectionPageProps>
    | ComponentType<DesktopCollectionPageProps>

  // Smart collection props
  smartCollection?: SmartCollection
}

type CollectionPageProps = OwnProps &
  ReturnType<ReturnType<typeof makeMapStateToProps>> &
  ReturnType<typeof mapDispatchToProps> &
  RouteComponentProps

type CollectionPageState = {
  filterText: string
  initialOrder: string[] | null
  playlistId: number | null
  reordering: string[] | null
  allowReordering: boolean
  updatingRoute: boolean
}

type PlaylistAgreement = { time: number; agreement: ID; uid?: UID }

class CollectionPage extends Component<
  CollectionPageProps,
  CollectionPageState
> {
  state: CollectionPageState = {
    filterText: '',
    initialOrder: null,
    playlistId: null,
    // For drag + drop reordering
    reordering: null,
    allowReordering: true,

    // Whether the collection is updating its own route.
    // When a user creates a playlist, we eagerly cache it with a fake uid.
    // When the collection is available, a new cache entry is added with the actual id and
    // the existing collection is marked as moved, triggering this component to re-route if rendered.
    updatingRoute: false
  }

  unlisten!: UnregisterCallback

  componentDidMount() {
    this.fetchCollection(getPathname(this.props.location))
    this.unlisten = this.props.history.listen((location, action) => {
      if (
        action !== 'REPLACE' &&
        getPathname(this.props.location) !== getPathname(location)
      ) {
        // If the action is not replace (e.g. we are not trying to update
        // the URL for the same playlist. Reset it.)
        this.resetCollection()
      }
      this.fetchCollection(getPathname(location))
      this.setState({
        initialOrder: null,
        reordering: null
      })
    })
  }

  componentDidUpdate(prevProps: CollectionPageProps) {
    const {
      collection: metadata,
      userUid,
      status,
      user,
      smartCollection,
      agreements,
      pathname,
      fetchCollectionSucceeded,
      type,
      playlistUpdates,
      updatePlaylistLastViewedAt
    } = this.props

    if (
      type === 'playlist' &&
      this.state.playlistId &&
      playlistUpdates.includes(this.state.playlistId)
    ) {
      updatePlaylistLastViewedAt(this.state.playlistId)
    }

    if (!prevProps.smartCollection && smartCollection) {
      this.fetchCollection(pathname)
    }

    const { updatingRoute, initialOrder } = this.state

    // Reset the initial order if it is unset OR
    // if the uids of the agreements in the lineup are changing with this
    // update (initialOrder should contain ALL of the uids, so it suffices to check the first one).
    const newInitialOrder = agreements.entries.map((agreement) => agreement.uid)
    const noInitialOrder = !initialOrder && agreements.entries.length > 0
    const entryIds = new Set(newInitialOrder)
    const newUids =
      Array.isArray(initialOrder) &&
      initialOrder.length > 0 &&
      newInitialOrder.length > 0 &&
      !initialOrder.every((id) => entryIds.has(id))

    if (noInitialOrder || newUids) {
      this.setState({
        initialOrder: newInitialOrder,
        reordering: newInitialOrder
      })
    }

    const params = parseCollectionRoute(pathname)

    if (!params) return
    if (status === Status.ERROR) {
      if (
        params &&
        params.collectionId === this.state.playlistId &&
        metadata?.playlist_owner_id !== this.props.userId
      ) {
        // Only route to not found page if still on the collection page and
        // it is erroring on the correct playlistId
        // and it's not our playlist
        this.props.goToRoute(NOT_FOUND_PAGE)
      }
      return
    }

    // Redirect to user tombstone if creator deactivated their account
    if (user && user.is_deactivated) {
      this.props.goToRoute(profilePage(user.handle))
      return
    }

    // Check if the collection has moved in the cache and redirect as needed.
    if (metadata && metadata._moved && !updatingRoute) {
      this.setState({ updatingRoute: true })
      const collectionId = Uid.fromString(metadata._moved).id
      // TODO: Put fetch collection succeeded and then replace route
      fetchCollectionSucceeded(collectionId, metadata._moved, userUid)
      const newPath = pathname.replace(
        `${metadata.playlist_id}`,
        collectionId.toString()
      )
      this.setState(
        {
          playlistId: collectionId,
          initialOrder: null,
          reordering: null
        },
        () => {
          this.props.replaceRoute(newPath)
        }
      )
    }
    if (metadata && !metadata._moved && updatingRoute) {
      this.setState({ updatingRoute: false })
    }

    const { collection: prevMetadata } = prevProps
    if (metadata) {
      const params = parseCollectionRoute(pathname)
      if (params) {
        const { collectionId, title, collectionType, handle } = params
        const newCollectionName = formatUrlName(metadata.playlist_name)

        const routeLacksCollectionInfo =
          (title === null || handle === null || collectionType === null) && user
        if (routeLacksCollectionInfo) {
          // Check if we are coming from a non-canonical route and replace route if necessary.
          const newPath = metadata.is_album
            ? albumPage(user!.handle, metadata.playlist_name, collectionId)
            : playlistPage(user!.handle, metadata.playlist_name, collectionId)
          this.props.replaceRoute(newPath)
        } else {
          // Id matches or temp id matches
          const idMatches =
            collectionId === metadata.playlist_id ||
            (metadata._temp && `${collectionId}` === `${metadata.playlist_id}`)
          // Check that the playlist name hasn't changed. If so, update url.
          if (idMatches && title) {
            if (newCollectionName !== title) {
              const newPath = pathname.replace(title, newCollectionName)
              this.props.replaceRoute(newPath)
            }
          }
        }
      }
    }

    // check that the collection content hasn't changed
    if (
      metadata &&
      prevMetadata &&
      !this.playListContentsEqual(
        metadata.playlist_contents.agreement_ids,
        prevMetadata.playlist_contents.agreement_ids
      )
    ) {
      this.props.fetchAgreements()
    }
  }

  componentWillUnmount() {
    if (this.unlisten) this.unlisten()
    // On mobile, because the transitioning-out collection page unmounts
    // after the transitioning-in collection page mounts, we do not want to reset
    // the collection in unmount. That would end up clearing the content AFTER
    // new content is loaded.
    if (!this.props.isMobile) {
      this.resetCollection()
    }
  }

  playListContentsEqual(
    prevPlaylistContents: PlaylistAgreement[],
    curPlaylistContents: PlaylistAgreement[]
  ) {
    return (
      prevPlaylistContents.length === curPlaylistContents.length &&
      prevPlaylistContents.reduce(
        (acc, cur, idx) => acc && cur.agreement === curPlaylistContents[idx].agreement,
        true
      )
    )
  }

  maybeParseInt = (s: string) => {
    const i = parseInt(s, 10)
    if (i.toString() === s) return i
    return s
  }

  fetchCollection = (pathname: string, forceFetch = false) => {
    const params = parseCollectionRoute(pathname)
    if (params) {
      const { handle, collectionId } = params
      if (forceFetch || collectionId !== this.state.playlistId) {
        this.setState({ playlistId: collectionId as number })
        this.props.fetchCollection(handle, collectionId as number)
        this.props.fetchAgreements()
      }
    }

    if (
      this.props.smartCollection &&
      this.props.smartCollection.playlist_contents
    ) {
      this.props.fetchAgreements()
    }
  }

  resetCollection = () => {
    const { collectionUid, userUid } = this.props
    this.props.resetCollection(collectionUid, userUid)
  }

  refreshCollection = () => {
    this.fetchCollection(getPathname(this.props.location), true)
  }

  onFilterChange = (e: ChangeEvent<HTMLInputElement>) => {
    this.setState({ filterText: e.target.value })
  }

  isQueued = () => {
    const { agreements, currentQueueItem } = this.props
    return agreements.entries.some((entry) => currentQueueItem.uid === entry.uid)
  }

  getPlayingUid = () => {
    const { currentQueueItem } = this.props
    return currentQueueItem.uid
  }

  getPlayingId = () => {
    const { currentQueueItem } = this.props
    return currentQueueItem.agreement ? currentQueueItem.agreement.agreement_id : null
  }

  formatMetadata = (agreementMetadatas: CollectionAgreement[]): AgreementRecord[] => {
    return agreementMetadatas.map((metadata, i) => ({
      ...metadata,
      key: `${metadata.title}_${metadata.uid}_${i}`,
      name: metadata.title,
      artist: metadata.user.name,
      handle: metadata.user.handle,
      date: metadata.dateAdded || metadata.created_at,
      time: metadata.duration,
      plays: metadata.play_count
    }))
  }

  getFilteredData = (agreementMetadatas: CollectionAgreement[]) => {
    const filterText = this.state.filterText
    const { agreements } = this.props
    const playingUid = this.getPlayingUid()
    const playingIndex = agreements.entries.findIndex(
      ({ uid }) => uid === playingUid
    )
    const filteredMetadata = this.formatMetadata(agreementMetadatas).filter(
      (item) =>
        item.title.toLowerCase().indexOf(filterText.toLowerCase()) > -1 ||
        item.user.name.toLowerCase().indexOf(filterText.toLowerCase()) > -1
    )
    const filteredIndex =
      playingIndex > -1
        ? filteredMetadata.findIndex((metadata) => metadata.uid === playingUid)
        : playingIndex
    return [filteredMetadata, filteredIndex] as [
      typeof filteredMetadata,
      number
    ]
  }

  onClickRow = (agreementRecord: AgreementRecord) => {
    const { playing, play, pause, record } = this.props
    const playingUid = this.getPlayingUid()
    if (playing && playingUid === agreementRecord.uid) {
      pause()
      record(
        make(Name.PLAYBACK_PAUSE, {
          id: `${agreementRecord.agreement_id}`,
          source: PlaybackSource.PLAYLIST_AGREEMENT
        })
      )
    } else if (playingUid !== agreementRecord.uid) {
      play(agreementRecord.uid)
      record(
        make(Name.PLAYBACK_PLAY, {
          id: `${agreementRecord.agreement_id}`,
          source: PlaybackSource.PLAYLIST_AGREEMENT
        })
      )
    } else {
      play()
      record(
        make(Name.PLAYBACK_PLAY, {
          id: `${agreementRecord.agreement_id}`,
          source: PlaybackSource.PLAYLIST_AGREEMENT
        })
      )
    }
  }

  onClickDescriptionExternalLink = (event: any) => {
    const { record } = this.props
    record(
      make(Name.LINK_CLICKING, {
        url: event.target.href,
        source: 'collection page'
      })
    )
  }

  onClickSave = (record: AgreementRecord) => {
    if (!record.has_current_user_saved) {
      this.props.saveAgreement(record.agreement_id)
    } else {
      this.props.unsaveAgreement(record.agreement_id)
    }
  }

  onClickAgreementName = (record: AgreementRecord) => {
    this.props.goToRoute(record.permalink)
  }

  onClickArtistName = (record: AgreementRecord) => {
    this.props.goToRoute(profilePage(record.handle))
  }

  onClickRepostAgreement = (record: AgreementRecord) => {
    if (!record.has_current_user_reposted) {
      this.props.repostAgreement(record.agreement_id)
    } else {
      this.props.undoRepostAgreement(record.agreement_id)
    }
  }

  onClickRemove = (
    agreementId: number,
    index: number,
    uid: string,
    timestamp: number
  ) => {
    const { playlistId } = this.state
    this.props.removeAgreementFromPlaylist(
      agreementId,
      playlistId as number,
      uid,
      timestamp
    )

    // Remove the agreement from the initial order,
    // because reorder uses initial order as a starting point
    const initialOrder = this.state.initialOrder
      ? [
          ...this.state.initialOrder.slice(0, index),
          ...this.state.initialOrder.slice(index + 1)
        ]
      : null
    this.setState({ initialOrder })
  }

  onPlay = () => {
    const {
      playing,
      play,
      pause,
      agreements: { entries },
      record
    } = this.props
    const isQueued = this.isQueued()
    const playingId = this.getPlayingId()
    if (playing && isQueued) {
      pause()
      record(
        make(Name.PLAYBACK_PAUSE, {
          id: `${playingId}`,
          source: PlaybackSource.PLAYLIST_PAGE
        })
      )
    } else if (!playing && isQueued) {
      play()
      record(
        make(Name.PLAYBACK_PLAY, {
          id: `${playingId}`,
          source: PlaybackSource.PLAYLIST_PAGE
        })
      )
    } else if (entries.length > 0) {
      play(entries[0].uid)
      record(
        make(Name.PLAYBACK_PLAY, {
          id: `${entries[0].agreement_id}`,
          source: PlaybackSource.PLAYLIST_PAGE
        })
      )
    }
  }

  onSortAgreements = (sorters: any) => {
    const { column, order } = sorters
    const {
      agreements: { entries }
    } = this.props
    const dataSource = this.formatMetadata(entries)
    let updatedOrder
    if (!column) {
      updatedOrder = this.state.initialOrder
      this.setState({ allowReordering: true })
    } else {
      updatedOrder = dataSource
        .sort((a, b) =>
          order === 'ascend' ? column.sorter(a, b) : column.sorter(b, a)
        )
        .map((metadata) => metadata.uid)
      this.setState({ allowReordering: false })
    }
    this.props.updateLineupOrder(updatedOrder)
  }

  onReorderAgreements = (source: number, destination: number) => {
    const { agreements, order } = this.props

    const newOrder = Array.from(this.state.initialOrder!)
    newOrder.splice(source, 1)
    newOrder.splice(destination, 0, this.state.initialOrder![source])

    const agreementIdAndTimes = newOrder.map((uid: any) => ({
      id: agreements.entries[order[uid]].agreement_id,
      time: agreements.entries[order[uid]].dateAdded.unix()
    }))

    this.props.updateLineupOrder(newOrder)
    this.setState({ initialOrder: newOrder })
    this.props.orderPlaylist(this.state.playlistId!, agreementIdAndTimes, newOrder)
  }

  onPublish = () => {
    this.props.publishPlaylist(this.state.playlistId!)
  }

  onSavePlaylist = (isSaved: boolean, playlistId: number) => {
    if (isSaved) {
      this.props.unsaveCollection(playlistId)
    } else {
      this.props.saveCollection(playlistId)
    }
  }

  onSaveSmartCollection = (isSaved: boolean, smartCollectionName: string) => {
    if (isSaved) {
      this.props.unsaveSmartCollection(smartCollectionName)
    } else {
      this.props.saveSmartCollection(smartCollectionName)
    }
  }

  onRepostPlaylist = (isReposted: boolean, playlistId: number) => {
    if (isReposted) {
      this.props.undoRepostCollection(playlistId)
    } else {
      this.props.repostCollection(playlistId)
    }
  }

  onSharePlaylist = (playlistId: number) => {
    this.props.shareCollection(playlistId)
  }

  onHeroAgreementClickArtistName = () => {
    const { goToRoute, user } = this.props
    const playlistOwnerHandle = user ? user.handle : ''
    goToRoute(profilePage(playlistOwnerHandle))
  }

  onHeroAgreementEdit = () => {
    if (this.state.playlistId)
      this.props.onEditCollection(this.state.playlistId)
  }

  onHeroAgreementShare = () => {
    const { playlistId } = this.state
    this.onSharePlaylist(playlistId!)
  }

  onHeroAgreementSave = () => {
    const { userPlaylists, collection: metadata, smartCollection } = this.props
    const { playlistId } = this.state
    const isSaved =
      (metadata && playlistId
        ? metadata.has_current_user_saved || playlistId in userPlaylists
        : false) ||
      (smartCollection && smartCollection.has_current_user_saved)

    if (smartCollection && metadata) {
      this.onSaveSmartCollection(!!isSaved, metadata.playlist_name)
    } else {
      this.onSavePlaylist(!!isSaved, playlistId!)
    }
  }

  onHeroAgreementRepost = () => {
    const { collection: metadata } = this.props
    const { playlistId } = this.state
    const isReposted = metadata ? metadata.has_current_user_reposted : false
    this.onRepostPlaylist(isReposted, playlistId!)
  }

  onClickReposts = () => {
    const {
      collection: metadata,
      setRepostPlaylistId,
      goToRoute,
      isMobile,
      setRepostUsers,
      setModalVisibility
    } = this.props
    if (!metadata) return
    if (isMobile) {
      setRepostPlaylistId(metadata.playlist_id)
      goToRoute(REPOSTING_USERS_ROUTE)
    } else {
      setRepostUsers(metadata.playlist_id)
      setModalVisibility()
    }
  }

  onClickFavorites = () => {
    const {
      collection: metadata,
      setFavoritePlaylistId,
      goToRoute,
      isMobile,
      setFavoriteUsers,
      setModalVisibility
    } = this.props
    if (!metadata) return
    if (isMobile) {
      setFavoritePlaylistId(metadata.playlist_id)
      goToRoute(FAVORITING_USERS_ROUTE)
    } else {
      setFavoriteUsers(metadata.playlist_id)
      setModalVisibility()
    }
  }

  onFollow = () => {
    const { onFollow, collection: metadata } = this.props
    if (metadata) onFollow(metadata.playlist_owner_id)
  }

  onUnfollow = () => {
    const { onUnfollow, collection: metadata } = this.props
    if (metadata) onUnfollow(metadata.playlist_owner_id)
  }

  render() {
    const {
      playing,
      type,
      status,
      collection: metadata,
      user,
      agreements,
      userId,
      userPlaylists,
      smartCollection
    } = this.props

    const { playlistId, allowReordering } = this.state

    const title = metadata?.playlist_name ?? ''
    const description = metadata?.description ?? ''
    const canonicalUrl =
      user && metadata
        ? fullPlaylistPage(
            user?.handle,
            metadata?.playlist_name,
            metadata?.playlist_id
          )
        : ''

    const childProps = {
      title,
      description,
      canonicalUrl,
      playlistId: playlistId!,
      allowReordering,
      playing,
      type,
      collection: smartCollection
        ? { status: Status.SUCCESS, metadata: smartCollection, user: null }
        : { status, metadata, user },
      agreements,
      userId,
      userPlaylists,
      getPlayingUid: this.getPlayingUid,
      getFilteredData: this.getFilteredData,
      isQueued: this.isQueued,
      onHeroAgreementClickArtistName: this.onHeroAgreementClickArtistName,
      onFilterChange: this.onFilterChange,
      onPlay: this.onPlay,
      onHeroAgreementEdit: this.onHeroAgreementEdit,
      onPublish: this.onPublish,
      onHeroAgreementShare: this.onHeroAgreementShare,
      onHeroAgreementSave: this.onHeroAgreementSave,
      onHeroAgreementRepost: this.onHeroAgreementRepost,
      onClickRow: this.onClickRow,
      onClickSave: this.onClickSave,
      onClickAgreementName: this.onClickAgreementName,
      onClickArtistName: this.onClickArtistName,
      onClickRepostAgreement: this.onClickRepostAgreement,
      onClickDescriptionExternalLink: this.onClickDescriptionExternalLink,
      onSortAgreements: this.onSortAgreements,
      onReorderAgreements: this.onReorderAgreements,
      onClickRemove: this.onClickRemove,
      onClickMobileOverflow: this.props.clickOverflow,
      onClickFavorites: this.onClickFavorites,
      onClickReposts: this.onClickReposts,
      onFollow: this.onFollow,
      onUnfollow: this.onUnfollow,
      refresh: this.refreshCollection
    }

    if ((metadata?.is_delete || metadata?._marked_deleted) && user) {
      return (
        <DeletedPage
          title={title}
          description={description}
          canonicalUrl={canonicalUrl}
          playable={{
            metadata,
            type: metadata?.is_album
              ? PlayableType.ALBUM
              : PlayableType.PLAYLIST
          }}
          user={user}
        />
      )
    }

    // Note:
    // While some of our other page components key by playlist id, etc.
    // here to allow for multiple pages to be in view at the same time while
    // animating. Because we use temporary ids (which impact the URL) for
    // playlists during creation, we can't simply key here by path or playlistId
    // because we do not want a playlist transitioning from temp => not temp
    // to trigger a rerender of everything
    return <this.props.children {...childProps} />
  }
}

function makeMapStateToProps() {
  const getAgreementsLineup = makeGetTableMetadatas(getCollectionAgreementsLineup)
  const getLineupOrder = makeGetLineupOrder(getCollectionAgreementsLineup)
  const getCurrentQueueItem = makeGetCurrent()

  const mapStateToProps = (state: AppState) => {
    return {
      agreements: getAgreementsLineup(state),
      collectionUid: getCollectionUid(state) || '',
      collection: getCollection(state) as Collection,
      user: getUser(state),
      userUid: getUserUid(state) || '',
      status: getCollectionStatus(state) || '',
      order: getLineupOrder(state),
      userId: getUserId(state),
      userPlaylists: getAccountCollections(state),
      currentQueueItem: getCurrentQueueItem(state),
      playing: getPlaying(state),
      buffering: getBuffering(state),
      pathname: getLocationPathname(state),
      playlistUpdates: getPlaylistUpdates(state)
    }
  }
  return mapStateToProps
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    fetchCollection: (handle: string | null, id: number) =>
      dispatch(collectionActions.fetchCollection(handle, id)),
    fetchAgreements: () =>
      dispatch(agreementsActions.fetchLineupMetadatas(0, 200, false, undefined)),
    resetCollection: (collectionUid: string, userUid: string) =>
      dispatch(collectionActions.resetCollection(collectionUid, userUid)),
    goToRoute: (route: string) => dispatch(pushRoute(route)),
    replaceRoute: (route: string) => dispatch(replace(route)),
    play: (uid?: string) => dispatch(agreementsActions.play(uid)),
    pause: () => dispatch(agreementsActions.pause()),
    updateLineupOrder: (updatedOrderIndices: any) =>
      dispatch(agreementsActions.updateLineupOrder(updatedOrderIndices)),
    editPlaylist: (playlistId: number, formFields: any) =>
      dispatch(editPlaylist(playlistId, formFields)),
    removeAgreementFromPlaylist: (
      agreementId: number,
      playlistId: number,
      uid: string,
      timestamp: number
    ) => {
      dispatch(removeAgreementFromPlaylist(agreementId, playlistId, timestamp))
      dispatch(agreementsActions.remove(Kind.AGREEMENTS, uid))
    },
    orderPlaylist: (playlistId: number, agreementIds: any, agreementUids: string[]) =>
      dispatch(orderPlaylist(playlistId, agreementIds, agreementUids)),
    publishPlaylist: (playlistId: number) =>
      dispatch(publishPlaylist(playlistId)),
    deletePlaylist: (playlistId: number) =>
      dispatch(deletePlaylist(playlistId)),

    saveCollection: (playlistId: number) =>
      dispatch(
        socialCollectionsActions.saveCollection(
          playlistId,
          FavoriteSource.COLLECTION_PAGE
        )
      ),
    saveSmartCollection: (smartCollectionName: string) =>
      dispatch(
        socialCollectionsActions.saveSmartCollection(
          smartCollectionName,
          FavoriteSource.COLLECTION_PAGE
        )
      ),

    unsaveCollection: (playlistId: number) =>
      dispatch(
        socialCollectionsActions.unsaveCollection(
          playlistId,
          FavoriteSource.COLLECTION_PAGE
        )
      ),
    unsaveSmartCollection: (smartCollectionName: string) =>
      dispatch(
        socialCollectionsActions.unsaveSmartCollection(
          smartCollectionName,
          FavoriteSource.COLLECTION_PAGE
        )
      ),

    repostCollection: (playlistId: number) =>
      dispatch(
        socialCollectionsActions.repostCollection(
          playlistId,
          RepostSource.COLLECTION_PAGE
        )
      ),
    undoRepostCollection: (playlistId: number) =>
      dispatch(
        socialCollectionsActions.undoRepostCollection(
          playlistId,
          RepostSource.COLLECTION_PAGE
        )
      ),
    shareCollection: (playlistId: number) =>
      dispatch(
        requestOpenShareModal({
          type: 'collection',
          collectionId: playlistId,
          source: ShareSource.TILE
        })
      ),
    repostAgreement: (agreementId: number) =>
      dispatch(
        socialAgreementsActions.repostAgreement(agreementId, RepostSource.COLLECTION_PAGE)
      ),
    undoRepostAgreement: (agreementId: number) =>
      dispatch(
        socialAgreementsActions.undoRepostAgreement(
          agreementId,
          RepostSource.COLLECTION_PAGE
        )
      ),
    saveAgreement: (agreementId: number) =>
      dispatch(
        socialAgreementsActions.saveAgreement(agreementId, FavoriteSource.COLLECTION_PAGE)
      ),
    unsaveAgreement: (agreementId: number) =>
      dispatch(
        socialAgreementsActions.unsaveAgreement(agreementId, FavoriteSource.COLLECTION_PAGE)
      ),
    fetchCollectionSucceeded: (
      collectionId: ID,
      collectionUid: string,
      userId: string
    ) =>
      dispatch(
        collectionActions.fetchCollectionSucceeded(
          collectionId,
          collectionUid,
          userId
        )
      ),
    onFollow: (userId: ID) =>
      dispatch(
        socialUsersActions.followUser(userId, FollowSource.COLLECTION_PAGE)
      ),
    onUnfollow: (userId: ID) =>
      dispatch(
        socialUsersActions.unfollowUser(userId, FollowSource.COLLECTION_PAGE)
      ),
    clickOverflow: (collectionId: ID, overflowActions: OverflowAction[]) =>
      dispatch(
        open({
          source: OverflowSource.COLLECTIONS,
          id: collectionId,
          overflowActions
        })
      ),
    setRepostPlaylistId: (collectionId: ID) =>
      dispatch(setRepost(collectionId, RepostType.COLLECTION)),
    setFavoritePlaylistId: (collectionId: ID) =>
      dispatch(setFavorite(collectionId, FavoriteType.PLAYLIST)),
    record: (event: AgreementEvent) => dispatch(event),
    setRepostUsers: (agreementID: ID) =>
      dispatch(
        setUsers({
          userListType: UserListType.REPOST,
          entityType: UserListEntityType.COLLECTION,
          id: agreementID
        })
      ),
    setFavoriteUsers: (agreementID: ID) =>
      dispatch(
        setUsers({
          userListType: UserListType.FAVORITE,
          entityType: UserListEntityType.COLLECTION,
          id: agreementID
        })
      ),
    setModalVisibility: () => dispatch(setVisibility(true)),
    onEditCollection: (playlistId: ID) =>
      dispatch(openEditCollectionModal(playlistId)),
    updatePlaylistLastViewedAt: (playlistId: ID) =>
      dispatch(updatePlaylistLastViewedAt(playlistId))
  }
}

export default withRouter(
  connect(makeMapStateToProps, mapDispatchToProps)(CollectionPage)
)
