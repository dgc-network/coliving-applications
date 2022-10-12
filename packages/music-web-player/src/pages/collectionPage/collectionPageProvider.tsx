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
  editContentList,
  removeDigitalContentFromContentList,
  orderContentList,
  publishContentList,
  deleteContentList
} from 'common/store/cache/collections/actions'
import {
  makeGetTableMetadatas,
  makeGetLineupOrder
} from 'common/store/lineup/selectors'
import { updateContentListLastViewedAt } from 'common/store/notifications/actions'
import { getContentListUpdates } from 'common/store/notifications/selectors'
import * as collectionActions from 'common/store/pages/collection/actions'
import { digitalContentsActions } from 'common/store/pages/collection/lineup/actions'
import {
  getCollection,
  getCollectionStatus,
  getCollectionDigitalContentsLineup,
  getCollectionUid,
  getUser,
  getUserUid
} from 'common/store/pages/collection/selectors'
import {
  DigitalContentRecord,
  CollectionDigitalContent,
  CollectionsPageType
} from 'common/store/pages/collection/types'
import { makeGetCurrent } from 'common/store/queue/selectors'
import * as socialCollectionsActions from 'common/store/social/collections/actions'
import * as socialDigitalContentsActions from 'common/store/social/digital_contents/actions'
import * as socialUsersActions from 'common/store/social/users/actions'
import { open } from 'common/store/ui/mobileOverflowMenu/slice'
import {
  OverflowAction,
  OverflowSource
} from 'common/store/ui/mobileOverflowMenu/types'
import { requestOpen as requestOpenShareModal } from 'common/store/ui/shareModal/slice'
import { setFavorite } from 'common/store/userList/favorites/actions'
import { setRepost } from 'common/store/userList/reposts/actions'
import { RepostType } from 'common/store/userList/reposts/types'
import { formatUrlName } from 'common/utils/formatUtil'
import DeletedPage from 'pages/deletedPage/deletedPage'
import { DigitalContentEvent, make } from 'store/analytics/actions'
import { open as openEditCollectionModal } from 'store/application/ui/editContentListModal/slice'
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
  fullContentListPage,
  contentListPage,
  albumPage,
  getPathname
} from 'utils/route'
import { parseCollectionRoute } from 'utils/route/collectionRouteParser'

import { CollectionPageProps as DesktopCollectionPageProps } from './components/desktop/collectionPage'
import { CollectionPageProps as MobileCollectionPageProps } from './components/mobile/collectionPage'

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
  contentListId: number | null
  reordering: string[] | null
  allowReordering: boolean
  updatingRoute: boolean
}

type ContentListDigitalContent = { time: number; digital_content: ID; uid?: UID }

class CollectionPage extends Component<
  CollectionPageProps,
  CollectionPageState
> {
  state: CollectionPageState = {
    filterText: '',
    initialOrder: null,
    contentListId: null,
    // For drag + drop reordering
    reordering: null,
    allowReordering: true,

    // Whether the collection is updating its own route.
    // When a user creates a contentList, we eagerly cache it with a fake uid.
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
        // the URL for the same contentList. Reset it.)
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
      digitalContents,
      pathname,
      fetchCollectionSucceeded,
      type,
      contentListUpdates,
      updateContentListLastViewedAt
    } = this.props

    if (
      type === 'contentList' &&
      this.state.contentListId &&
      contentListUpdates.includes(this.state.contentListId)
    ) {
      updateContentListLastViewedAt(this.state.contentListId)
    }

    if (!prevProps.smartCollection && smartCollection) {
      this.fetchCollection(pathname)
    }

    const { updatingRoute, initialOrder } = this.state

    // Reset the initial order if it is unset OR
    // if the uids of the digitalContents in the lineup are changing with this
    // update (initialOrder should contain ALL of the uids, so it suffices to check the first one).
    const newInitialOrder = digitalContents.entries.map((digital_content) => digital_content.uid)
    const noInitialOrder = !initialOrder && digitalContents.entries.length > 0
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
        params.collectionId === this.state.contentListId &&
        metadata?.content_list_owner_id !== this.props.userId
      ) {
        // Only route to not found page if still on the collection page and
        // it is erroring on the correct contentListId
        // and it's not our contentList
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
        `${metadata.content_list_id}`,
        collectionId.toString()
      )
      this.setState(
        {
          contentListId: collectionId,
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
        const newCollectionName = formatUrlName(metadata.content_list_name)

        const routeLacksCollectionInfo =
          (title === null || handle === null || collectionType === null) && user
        if (routeLacksCollectionInfo) {
          // Check if we are coming from a non-canonical route and replace route if necessary.
          const newPath = metadata.is_album
            ? albumPage(user!.handle, metadata.content_list_name, collectionId)
            : contentListPage(user!.handle, metadata.content_list_name, collectionId)
          this.props.replaceRoute(newPath)
        } else {
          // Id matches or temp id matches
          const idMatches =
            collectionId === metadata.content_list_id ||
            (metadata._temp && `${collectionId}` === `${metadata.content_list_id}`)
          // Check that the contentList name hasn't changed. If so, update url.
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
        metadata.content_list_contents.digital_content_ids,
        prevMetadata.content_list_contents.digital_content_ids
      )
    ) {
      this.props.fetchDigitalContents()
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
    prevContentListContents: ContentListDigitalContent[],
    curContentListContents: ContentListDigitalContent[]
  ) {
    return (
      prevContentListContents.length === curContentListContents.length &&
      prevContentListContents.reduce(
        (acc, cur, idx) => acc && cur.digital_content === curContentListContents[idx].digital_content,
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
      if (forceFetch || collectionId !== this.state.contentListId) {
        this.setState({ contentListId: collectionId as number })
        this.props.fetchCollection(handle, collectionId as number)
        this.props.fetchDigitalContents()
      }
    }

    if (
      this.props.smartCollection &&
      this.props.smartCollection.content_list_contents
    ) {
      this.props.fetchDigitalContents()
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
    const { digitalContents, currentQueueItem } = this.props
    return digitalContents.entries.some((entry) => currentQueueItem.uid === entry.uid)
  }

  getPlayingUid = () => {
    const { currentQueueItem } = this.props
    return currentQueueItem.uid
  }

  getPlayingId = () => {
    const { currentQueueItem } = this.props
    return currentQueueItem.digital_content ? currentQueueItem.digital_content.digital_content_id : null
  }

  formatMetadata = (digitalContentMetadatas: CollectionDigitalContent[]): DigitalContentRecord[] => {
    return digitalContentMetadatas.map((metadata, i) => ({
      ...metadata,
      key: `${metadata.title}_${metadata.uid}_${i}`,
      name: metadata.title,
      author: metadata.user.name,
      handle: metadata.user.handle,
      date: metadata.dateAdded || metadata.created_at,
      time: metadata.duration,
      plays: metadata.play_count
    }))
  }

  getFilteredData = (digitalContentMetadatas: CollectionDigitalContent[]) => {
    const filterText = this.state.filterText
    const { digitalContents } = this.props
    const playingUid = this.getPlayingUid()
    const playingIndex = digitalContents.entries.findIndex(
      ({ uid }) => uid === playingUid
    )
    const filteredMetadata = this.formatMetadata(digitalContentMetadatas).filter(
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

  onClickRow = (digitalContentRecord: DigitalContentRecord) => {
    const { playing, play, pause, record } = this.props
    const playingUid = this.getPlayingUid()
    if (playing && playingUid === digitalContentRecord.uid) {
      pause()
      record(
        make(Name.PLAYBACK_PAUSE, {
          id: `${digitalContentRecord.digital_content_id}`,
          source: PlaybackSource.CONTENT_LIST_AGREEMENT
        })
      )
    } else if (playingUid !== digitalContentRecord.uid) {
      play(digitalContentRecord.uid)
      record(
        make(Name.PLAYBACK_PLAY, {
          id: `${digitalContentRecord.digital_content_id}`,
          source: PlaybackSource.CONTENT_LIST_AGREEMENT
        })
      )
    } else {
      play()
      record(
        make(Name.PLAYBACK_PLAY, {
          id: `${digitalContentRecord.digital_content_id}`,
          source: PlaybackSource.CONTENT_LIST_AGREEMENT
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

  onClickSave = (record: DigitalContentRecord) => {
    if (!record.has_current_user_saved) {
      this.props.saveDigitalContent(record.digital_content_id)
    } else {
      this.props.unsaveDigitalContent(record.digital_content_id)
    }
  }

  onClickDigitalContentName = (record: DigitalContentRecord) => {
    this.props.goToRoute(record.permalink)
  }

  onClickLandlordName = (record: DigitalContentRecord) => {
    this.props.goToRoute(profilePage(record.handle))
  }

  onClickRepostDigitalContent = (record: DigitalContentRecord) => {
    if (!record.has_current_user_reposted) {
      this.props.repostDigitalContent(record.digital_content_id)
    } else {
      this.props.undoRepostDigitalContent(record.digital_content_id)
    }
  }

  onClickRemove = (
    digitalContentId: number,
    index: number,
    uid: string,
    timestamp: number
  ) => {
    const { contentListId } = this.state
    this.props.removeDigitalContentFromContentList(
      digitalContentId,
      contentListId as number,
      uid,
      timestamp
    )

    // Remove the digital_content from the initial order,
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
      digitalContents: { entries },
      record
    } = this.props
    const isQueued = this.isQueued()
    const playingId = this.getPlayingId()
    if (playing && isQueued) {
      pause()
      record(
        make(Name.PLAYBACK_PAUSE, {
          id: `${playingId}`,
          source: PlaybackSource.CONTENT_LIST_PAGE
        })
      )
    } else if (!playing && isQueued) {
      play()
      record(
        make(Name.PLAYBACK_PLAY, {
          id: `${playingId}`,
          source: PlaybackSource.CONTENT_LIST_PAGE
        })
      )
    } else if (entries.length > 0) {
      play(entries[0].uid)
      record(
        make(Name.PLAYBACK_PLAY, {
          id: `${entries[0].digital_content_id}`,
          source: PlaybackSource.CONTENT_LIST_PAGE
        })
      )
    }
  }

  onSortDigitalContents = (sorters: any) => {
    const { column, order } = sorters
    const {
      digitalContents: { entries }
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

  onReorderDigitalContents = (source: number, destination: number) => {
    const { digitalContents, order } = this.props

    const newOrder = Array.from(this.state.initialOrder!)
    newOrder.splice(source, 1)
    newOrder.splice(destination, 0, this.state.initialOrder![source])

    const digitalContentIdAndTimes = newOrder.map((uid: any) => ({
      id: digitalContents.entries[order[uid]].digital_content_id,
      time: digitalContents.entries[order[uid]].dateAdded.unix()
    }))

    this.props.updateLineupOrder(newOrder)
    this.setState({ initialOrder: newOrder })
    this.props.orderContentList(this.state.contentListId!, digitalContentIdAndTimes, newOrder)
  }

  onPublish = () => {
    this.props.publishContentList(this.state.contentListId!)
  }

  onSaveContentList = (isSaved: boolean, contentListId: number) => {
    if (isSaved) {
      this.props.unsaveCollection(contentListId)
    } else {
      this.props.saveCollection(contentListId)
    }
  }

  onSaveSmartCollection = (isSaved: boolean, smartCollectionName: string) => {
    if (isSaved) {
      this.props.unsaveSmartCollection(smartCollectionName)
    } else {
      this.props.saveSmartCollection(smartCollectionName)
    }
  }

  onRepostContentList = (isReposted: boolean, contentListId: number) => {
    if (isReposted) {
      this.props.undoRepostCollection(contentListId)
    } else {
      this.props.repostCollection(contentListId)
    }
  }

  onShareContentList = (contentListId: number) => {
    this.props.shareCollection(contentListId)
  }

  onHeroDigitalContentClickLandlordName = () => {
    const { goToRoute, user } = this.props
    const contentListOwnerHandle = user ? user.handle : ''
    goToRoute(profilePage(contentListOwnerHandle))
  }

  onHeroDigitalContentEdit = () => {
    if (this.state.contentListId)
      this.props.onEditCollection(this.state.contentListId)
  }

  onHeroDigitalContentShare = () => {
    const { contentListId } = this.state
    this.onShareContentList(contentListId!)
  }

  onHeroDigitalContentSave = () => {
    const { userContentLists, collection: metadata, smartCollection } = this.props
    const { contentListId } = this.state
    const isSaved =
      (metadata && contentListId
        ? metadata.has_current_user_saved || contentListId in userContentLists
        : false) ||
      (smartCollection && smartCollection.has_current_user_saved)

    if (smartCollection && metadata) {
      this.onSaveSmartCollection(!!isSaved, metadata.content_list_name)
    } else {
      this.onSaveContentList(!!isSaved, contentListId!)
    }
  }

  onHeroDigitalContentRepost = () => {
    const { collection: metadata } = this.props
    const { contentListId } = this.state
    const isReposted = metadata ? metadata.has_current_user_reposted : false
    this.onRepostContentList(isReposted, contentListId!)
  }

  onClickReposts = () => {
    const {
      collection: metadata,
      setRepostContentListId,
      goToRoute,
      isMobile,
      setRepostUsers,
      setModalVisibility
    } = this.props
    if (!metadata) return
    if (isMobile) {
      setRepostContentListId(metadata.content_list_id)
      goToRoute(REPOSTING_USERS_ROUTE)
    } else {
      setRepostUsers(metadata.content_list_id)
      setModalVisibility()
    }
  }

  onClickFavorites = () => {
    const {
      collection: metadata,
      setFavoriteContentListId,
      goToRoute,
      isMobile,
      setFavoriteUsers,
      setModalVisibility
    } = this.props
    if (!metadata) return
    if (isMobile) {
      setFavoriteContentListId(metadata.content_list_id)
      goToRoute(FAVORITING_USERS_ROUTE)
    } else {
      setFavoriteUsers(metadata.content_list_id)
      setModalVisibility()
    }
  }

  onFollow = () => {
    const { onFollow, collection: metadata } = this.props
    if (metadata) onFollow(metadata.content_list_owner_id)
  }

  onUnfollow = () => {
    const { onUnfollow, collection: metadata } = this.props
    if (metadata) onUnfollow(metadata.content_list_owner_id)
  }

  render() {
    const {
      playing,
      type,
      status,
      collection: metadata,
      user,
      digitalContents,
      userId,
      userContentLists,
      smartCollection
    } = this.props

    const { contentListId, allowReordering } = this.state

    const title = metadata?.content_list_name ?? ''
    const description = metadata?.description ?? ''
    const canonicalUrl =
      user && metadata
        ? fullContentListPage(
            user?.handle,
            metadata?.content_list_name,
            metadata?.content_list_id
          )
        : ''

    const childProps = {
      title,
      description,
      canonicalUrl,
      contentListId: contentListId!,
      allowReordering,
      playing,
      type,
      collection: smartCollection
        ? { status: Status.SUCCESS, metadata: smartCollection, user: null }
        : { status, metadata, user },
      digitalContents,
      userId,
      userContentLists,
      getPlayingUid: this.getPlayingUid,
      getFilteredData: this.getFilteredData,
      isQueued: this.isQueued,
      onHeroDigitalContentClickLandlordName: this.onHeroDigitalContentClickLandlordName,
      onFilterChange: this.onFilterChange,
      onPlay: this.onPlay,
      onHeroDigitalContentEdit: this.onHeroDigitalContentEdit,
      onPublish: this.onPublish,
      onHeroDigitalContentShare: this.onHeroDigitalContentShare,
      onHeroDigitalContentSave: this.onHeroDigitalContentSave,
      onHeroDigitalContentRepost: this.onHeroDigitalContentRepost,
      onClickRow: this.onClickRow,
      onClickSave: this.onClickSave,
      onClickDigitalContentName: this.onClickDigitalContentName,
      onClickLandlordName: this.onClickLandlordName,
      onClickRepostDigitalContent: this.onClickRepostDigitalContent,
      onClickDescriptionExternalLink: this.onClickDescriptionExternalLink,
      onSortDigitalContents: this.onSortDigitalContents,
      onReorderDigitalContents: this.onReorderDigitalContents,
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
              : PlayableType.CONTENT_LIST
          }}
          user={user}
        />
      )
    }

    // Note:
    // While some of our other page components key by contentList id, etc.
    // here to allow for multiple pages to be in view at the same time while
    // animating. Because we use temporary ids (which impact the URL) for
    // contentLists during creation, we can't simply key here by path or contentListId
    // because we do not want a contentList transitioning from temp => not temp
    // to trigger a rerender of everything
    return <this.props.children {...childProps} />
  }
}

function makeMapStateToProps() {
  const getDigitalContentsLineup = makeGetTableMetadatas(getCollectionDigitalContentsLineup)
  const getLineupOrder = makeGetLineupOrder(getCollectionDigitalContentsLineup)
  const getCurrentQueueItem = makeGetCurrent()

  const mapStateToProps = (state: AppState) => {
    return {
      digitalContents: getDigitalContentsLineup(state),
      collectionUid: getCollectionUid(state) || '',
      collection: getCollection(state) as Collection,
      user: getUser(state),
      userUid: getUserUid(state) || '',
      status: getCollectionStatus(state) || '',
      order: getLineupOrder(state),
      userId: getUserId(state),
      userContentLists: getAccountCollections(state),
      currentQueueItem: getCurrentQueueItem(state),
      playing: getPlaying(state),
      buffering: getBuffering(state),
      pathname: getLocationPathname(state),
      contentListUpdates: getContentListUpdates(state)
    }
  }
  return mapStateToProps
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    fetchCollection: (handle: string | null, id: number) =>
      dispatch(collectionActions.fetchCollection(handle, id)),
    fetchDigitalContents: () =>
      dispatch(digitalContentsActions.fetchLineupMetadatas(0, 200, false, undefined)),
    resetCollection: (collectionUid: string, userUid: string) =>
      dispatch(collectionActions.resetCollection(collectionUid, userUid)),
    goToRoute: (route: string) => dispatch(pushRoute(route)),
    replaceRoute: (route: string) => dispatch(replace(route)),
    play: (uid?: string) => dispatch(digitalContentsActions.play(uid)),
    pause: () => dispatch(digitalContentsActions.pause()),
    updateLineupOrder: (updatedOrderIndices: any) =>
      dispatch(digitalContentsActions.updateLineupOrder(updatedOrderIndices)),
    editContentList: (contentListId: number, formFields: any) =>
      dispatch(editContentList(contentListId, formFields)),
    removeDigitalContentFromContentList: (
      digitalContentId: number,
      contentListId: number,
      uid: string,
      timestamp: number
    ) => {
      dispatch(removeDigitalContentFromContentList(digitalContentId, contentListId, timestamp))
      dispatch(digitalContentsActions.remove(Kind.AGREEMENTS, uid))
    },
    orderContentList: (contentListId: number, digitalContentIds: any, digitalContentUids: string[]) =>
      dispatch(orderContentList(contentListId, digitalContentIds, digitalContentUids)),
    publishContentList: (contentListId: number) =>
      dispatch(publishContentList(contentListId)),
    deleteContentList: (contentListId: number) =>
      dispatch(deleteContentList(contentListId)),

    saveCollection: (contentListId: number) =>
      dispatch(
        socialCollectionsActions.saveCollection(
          contentListId,
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

    unsaveCollection: (contentListId: number) =>
      dispatch(
        socialCollectionsActions.unsaveCollection(
          contentListId,
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

    repostCollection: (contentListId: number) =>
      dispatch(
        socialCollectionsActions.repostCollection(
          contentListId,
          RepostSource.COLLECTION_PAGE
        )
      ),
    undoRepostCollection: (contentListId: number) =>
      dispatch(
        socialCollectionsActions.undoRepostCollection(
          contentListId,
          RepostSource.COLLECTION_PAGE
        )
      ),
    shareCollection: (contentListId: number) =>
      dispatch(
        requestOpenShareModal({
          type: 'collection',
          collectionId: contentListId,
          source: ShareSource.TILE
        })
      ),
    repostDigitalContent: (digitalContentId: number) =>
      dispatch(
        socialDigitalContentsActions.repostDigitalContent(digitalContentId, RepostSource.COLLECTION_PAGE)
      ),
    undoRepostDigitalContent: (digitalContentId: number) =>
      dispatch(
        socialDigitalContentsActions.undoRepostDigitalContent(
          digitalContentId,
          RepostSource.COLLECTION_PAGE
        )
      ),
    saveDigitalContent: (digitalContentId: number) =>
      dispatch(
        socialDigitalContentsActions.saveDigitalContent(digitalContentId, FavoriteSource.COLLECTION_PAGE)
      ),
    unsaveDigitalContent: (digitalContentId: number) =>
      dispatch(
        socialDigitalContentsActions.unsaveDigitalContent(digitalContentId, FavoriteSource.COLLECTION_PAGE)
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
    setRepostContentListId: (collectionId: ID) =>
      dispatch(setRepost(collectionId, RepostType.COLLECTION)),
    setFavoriteContentListId: (collectionId: ID) =>
      dispatch(setFavorite(collectionId, FavoriteType.CONTENT_LIST)),
    record: (event: DigitalContentEvent) => dispatch(event),
    setRepostUsers: (digitalContentID: ID) =>
      dispatch(
        setUsers({
          userListType: UserListType.REPOST,
          entityType: UserListEntityType.COLLECTION,
          id: digitalContentID
        })
      ),
    setFavoriteUsers: (digitalContentID: ID) =>
      dispatch(
        setUsers({
          userListType: UserListType.FAVORITE,
          entityType: UserListEntityType.COLLECTION,
          id: digitalContentID
        })
      ),
    setModalVisibility: () => dispatch(setVisibility(true)),
    onEditCollection: (contentListId: ID) =>
      dispatch(openEditCollectionModal(contentListId)),
    updateContentListLastViewedAt: (contentListId: ID) =>
      dispatch(updateContentListLastViewedAt(contentListId))
  }
}

export default withRouter(
  connect(makeMapStateToProps, mapDispatchToProps)(CollectionPage)
)
