import { ComponentType, PureComponent } from 'react'

import {
  ID,
  UID,
  RepostSource,
  FavoriteSource,
  PlaybackSource,
  Name
} from '@coliving/common'
import { push as pushRoute } from 'connected-react-router'
import { connect } from 'react-redux'
import { withRouter, RouteComponentProps } from 'react-router-dom'
import { Dispatch } from 'redux'

import * as accountActions from 'common/store/account/reducer'
import { getAccountWithSavedContentListsAndAlbums } from 'common/store/account/selectors'
import { makeGetTableMetadatas } from 'common/store/lineup/selectors'
import { updateContentListLastViewedAt } from 'common/store/notifications/actions'
import { getContentListUpdates } from 'common/store/notifications/selectors'
import * as saveActions from 'common/store/pages/savedPage/actions'
import { digitalContentsActions } from 'common/store/pages/savedPage/lineups/digital_contents/actions'
import { getSavedDigitalContentsLineup } from 'common/store/pages/savedPage/selectors'
import {
  Tabs as ProfileTabs,
  SavedPageDigitalContent,
  DigitalContentRecord,
  SavedPageCollection
} from 'common/store/pages/savedPage/types'
import { makeGetCurrent } from 'common/store/queue/selectors'
import * as socialActions from 'common/store/social/digital_contents/actions'
import { formatCount } from 'common/utils/formatUtil'
import { DigitalContentEvent, make } from 'store/analytics/actions'
import { getPlaying, getBuffering } from 'store/player/selectors'
import { AppState } from 'store/types'
import { isMobile } from 'utils/clientUtil'
import { profilePage } from 'utils/route'

import { SavedPageProps as DesktopSavedPageProps } from './components/desktop/savedPage'
import { SavedPageProps as MobileSavedPageProps } from './components/mobile/savedPage'

const IS_NATIVE_MOBILE = process.env.REACT_APP_NATIVE_MOBILE

const messages = {
  title: 'Favorites',
  description: "View digitalContents that you've favorited"
}

type OwnProps = {
  children:
    | ComponentType<MobileSavedPageProps>
    | ComponentType<DesktopSavedPageProps>
}

type SavedPageProps = OwnProps &
  ReturnType<ReturnType<typeof makeMapStateToProps>> &
  ReturnType<typeof mapDispatchToProps> &
  RouteComponentProps

type SavedPageState = {
  currentTab: ProfileTabs
  filterText: string
  initialOrder: UID[] | null
  reordering?: UID[] | null
  allowReordering?: boolean
}

class SavedPage extends PureComponent<SavedPageProps, SavedPageState> {
  state: SavedPageState = {
    filterText: '',
    initialOrder: null,
    currentTab: ProfileTabs.DIGITAL_CONTENTS
  }

  componentDidMount() {
    this.props.fetchSavedDigitalContents()
    this.props.fetchSavedAlbums()
    if (isMobile()) {
      this.props.fetchSavedContentLists()
    }
  }

  componentWillUnmount() {
    if (!IS_NATIVE_MOBILE) {
      this.props.resetSavedDigitalContents()
    }
  }

  componentDidUpdate() {
    const { digitalContents } = this.props

    if (!this.state.initialOrder && digitalContents.entries.length > 0) {
      const initialOrder = digitalContents.entries.map((digital_content: any) => digital_content.uid)
      this.setState({
        initialOrder,
        reordering: initialOrder
      })
    }
  }

  onFilterChange = (e: any) => {
    this.setState({ filterText: e.target.value })
  }

  formatMetadata = (digitalContentMetadatas: SavedPageDigitalContent[]) => {
    return digitalContentMetadatas.map((entry, i) => ({
      ...entry,
      key: `${entry.title}_${entry.uid}_${i}`,
      name: entry.title,
      author: entry.user.name,
      handle: entry.user.handle,
      date: entry.dateSaved,
      time: entry.duration,
      plays: entry.play_count
    }))
  }

  isQueued = () => {
    const { digitalContents, currentQueueItem } = this.props
    return digitalContents.entries.some(
      (entry: any) => currentQueueItem.uid === entry.uid
    )
  }

  getPlayingUid = () => {
    const { currentQueueItem } = this.props
    return currentQueueItem.uid
  }

  getPlayingId = () => {
    const { currentQueueItem } = this.props
    return currentQueueItem.digital_content ? currentQueueItem.digital_content.digital_content_id : null
  }

  getFilteredData = (
    digitalContentMetadatas: SavedPageDigitalContent[]
  ): [SavedPageDigitalContent[], number] => {
    const filterText = this.state.filterText
    const { digitalContents } = this.props
    const playingUid = this.getPlayingUid()
    const playingIndex = digitalContents.entries.findIndex(
      ({ uid }: any) => uid === playingUid
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
    return [filteredMetadata, filteredIndex]
  }

  getFilteredAlbums = (
    albums: SavedPageCollection[]
  ): SavedPageCollection[] => {
    const filterText = this.state.filterText
    return albums.filter(
      (item: SavedPageCollection) =>
        item.content_list_name.toLowerCase().indexOf(filterText.toLowerCase()) >
          -1 ||
        item.ownerHandle.toLowerCase().indexOf(filterText.toLowerCase()) > -1
    )
  }

  getFilteredContentLists = (
    contentLists: SavedPageCollection[]
  ): SavedPageCollection[] => {
    const filterText = this.state.filterText
    return contentLists.filter(
      (item: SavedPageCollection) =>
        item.content_list_name.toLowerCase().indexOf(filterText.toLowerCase()) >
          -1 ||
        item.ownerHandle.toLowerCase().indexOf(filterText.toLowerCase()) > -1
    )
  }

  onClickRow = (digitalContentRecord: DigitalContentRecord) => {
    const { playing, play, pause, record } = this.props
    const playingUid = this.getPlayingUid()
    if (playing && playingUid === digitalContentRecord.uid) {
      pause()
      record(
        make(Name.PLAYBACK_PAUSE, {
          id: `${digitalContentRecord.digital_content_id}`,
          source: PlaybackSource.FAVORITES_PAGE
        })
      )
    } else if (playingUid !== digitalContentRecord.uid) {
      play(digitalContentRecord.uid)
      record(
        make(Name.PLAYBACK_PLAY, {
          id: `${digitalContentRecord.digital_content_id}`,
          source: PlaybackSource.FAVORITES_PAGE
        })
      )
    } else {
      play()
      record(
        make(Name.PLAYBACK_PLAY, {
          id: `${digitalContentRecord.digital_content_id}`,
          source: PlaybackSource.FAVORITES_PAGE
        })
      )
    }
  }

  onTogglePlay = (uid: string, digitalContentId: ID) => {
    const { playing, play, pause, record } = this.props
    const playingUid = this.getPlayingUid()
    if (playing && playingUid === uid) {
      pause()
      record(
        make(Name.PLAYBACK_PAUSE, {
          id: `${digitalContentId}`,
          source: PlaybackSource.FAVORITES_PAGE
        })
      )
    } else if (playingUid !== uid) {
      play(uid)
      record(
        make(Name.PLAYBACK_PLAY, {
          id: `${digitalContentId}`,
          source: PlaybackSource.FAVORITES_PAGE
        })
      )
    } else {
      play()
      record(
        make(Name.PLAYBACK_PLAY, {
          id: `${digitalContentId}`,
          source: PlaybackSource.FAVORITES_PAGE
        })
      )
    }
  }

  onClickSave = (record: DigitalContentRecord) => {
    if (!record.has_current_user_saved) {
      this.props.saveDigitalContent(record.digital_content_id)
    } else {
      this.props.unsaveDigitalContent(record.digital_content_id)
    }
  }

  onSave = (isSaved: boolean, digitalContentId: ID) => {
    if (!isSaved) {
      this.props.saveDigitalContent(digitalContentId)
    } else {
      this.props.unsaveDigitalContent(digitalContentId)
    }
  }

  onClickDigitalContentName = (record: DigitalContentRecord) => {
    this.props.goToRoute(record.permalink)
  }

  onClickLandlordName = (record: DigitalContentRecord) => {
    this.props.goToRoute(profilePage(record.handle))
  }

  onClickRepost = (record: DigitalContentRecord) => {
    if (!record.has_current_user_reposted) {
      this.props.repostDigitalContent(record.digital_content_id)
    } else {
      this.props.undoRepostDigitalContent(record.digital_content_id)
    }
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
          source: PlaybackSource.FAVORITES_PAGE
        })
      )
    } else if (!playing && isQueued) {
      play()
      record(
        make(Name.PLAYBACK_PLAY, {
          id: `${playingId}`,
          source: PlaybackSource.FAVORITES_PAGE
        })
      )
    } else if (entries.length > 0) {
      play(entries[0].uid)
      record(
        make(Name.PLAYBACK_PLAY, {
          id: `${playingId}`,
          source: PlaybackSource.FAVORITES_PAGE
        })
      )
    }
  }

  onSortDigitalContents = (sorters: any) => {
    const { column, order } = sorters
    const {
      digitalContents: { entries }
    } = this.props
    // @ts-ignore
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
    this.props.updateLineupOrder(updatedOrder!)
  }

  onChangeTab = (tab: ProfileTabs) => {
    this.setState({
      currentTab: tab
    })
  }

  formatCardSecondaryText = (saves: number, digitalContents: number) => {
    const savesText = saves === 1 ? 'Favorite' : 'Favorites'
    const digitalContentsText = digitalContents === 1 ? 'DigitalContent' : 'DigitalContents'
    return `${formatCount(saves)} ${savesText} • ${digitalContents} ${digitalContentsText}`
  }

  render() {
    const isQueued = this.isQueued()
    const playingUid = this.getPlayingUid()

    const childProps = {
      title: messages.title,
      description: messages.description,

      // State
      currentTab: this.state.currentTab,
      filterText: this.state.filterText,
      initialOrder: this.state.initialOrder,
      reordering: this.state.reordering,
      allowReordering: this.state.allowReordering,

      // Props from AppState
      account: this.props.account,
      digitalContents: this.props.digitalContents,
      currentQueueItem: this.props.currentQueueItem,
      playing: this.props.playing,
      buffering: this.props.buffering,

      // Props from dispatch
      fetchSavedDigitalContents: this.props.fetchSavedDigitalContents,
      resetSavedDigitalContents: this.props.resetSavedDigitalContents,
      updateLineupOrder: this.props.updateLineupOrder,
      fetchSavedAlbums: this.props.fetchSavedAlbums,
      goToRoute: this.props.goToRoute,
      play: this.props.play,
      pause: this.props.pause,
      repostDigitalContent: this.props.repostDigitalContent,
      undoRepostDigitalContent: this.props.undoRepostDigitalContent,
      saveDigitalContent: this.props.saveDigitalContent,
      unsaveDigitalContent: this.props.unsaveDigitalContent,

      // Calculated Props
      isQueued,
      playingUid,

      // Methods
      onFilterChange: this.onFilterChange,
      formatMetadata: this.formatMetadata,
      getFilteredData: this.getFilteredData,
      onPlay: this.onPlay,
      onSortDigitalContents: this.onSortDigitalContents,
      onChangeTab: this.onChangeTab,
      formatCardSecondaryText: this.formatCardSecondaryText,
      onReorderDigitalContents: () => {},
      onClickRemove: null
    }

    const mobileProps = {
      contentListUpdates: this.props.contentListUpdates,
      updateContentListLastViewedAt: this.props.updateContentListLastViewedAt,

      onSave: this.onSave,
      onTogglePlay: this.onTogglePlay,
      getFilteredAlbums: this.getFilteredAlbums,
      getFilteredContentLists: this.getFilteredContentLists
    }

    const desktopProps = {
      onClickRow: this.onClickRow,
      onClickSave: this.onClickSave,
      onClickDigitalContentName: this.onClickDigitalContentName,
      onClickLandlordName: this.onClickLandlordName,
      onClickRepost: this.onClickRepost
    }

    return (
      // @ts-ignore
      <this.props.children {...childProps} {...mobileProps} {...desktopProps} />
    )
  }
}

function makeMapStateToProps() {
  const getLineupMetadatas = makeGetTableMetadatas(getSavedDigitalContentsLineup)
  const getCurrentQueueItem = makeGetCurrent()
  const mapStateToProps = (state: AppState) => {
    return {
      account: getAccountWithSavedContentListsAndAlbums(state),
      digitalContents: getLineupMetadatas(state),
      currentQueueItem: getCurrentQueueItem(state),
      playing: getPlaying(state),
      buffering: getBuffering(state),
      contentListUpdates: getContentListUpdates(state)
    }
  }
  return mapStateToProps
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    fetchSavedDigitalContents: () => dispatch(saveActions.fetchSaves()),
    resetSavedDigitalContents: () => dispatch(digitalContentsActions.reset()),
    updateLineupOrder: (updatedOrderIndices: UID[]) =>
      dispatch(digitalContentsActions.updateLineupOrder(updatedOrderIndices)),
    fetchSavedAlbums: () => dispatch(accountActions.fetchSavedAlbums()),
    fetchSavedContentLists: () => dispatch(accountActions.fetchSavedContentLists()),
    updateContentListLastViewedAt: (contentListId: number) =>
      dispatch(updateContentListLastViewedAt(contentListId)),
    goToRoute: (route: string) => dispatch(pushRoute(route)),
    play: (uid?: UID) => dispatch(digitalContentsActions.play(uid)),
    pause: () => dispatch(digitalContentsActions.pause()),
    repostDigitalContent: (digitalContentId: ID) =>
      dispatch(socialActions.repostDigitalContent(digitalContentId, RepostSource.FAVORITES_PAGE)),
    undoRepostDigitalContent: (digitalContentId: ID) =>
      dispatch(
        socialActions.undoRepostDigitalContent(digitalContentId, RepostSource.FAVORITES_PAGE)
      ),
    saveDigitalContent: (digitalContentId: ID) =>
      dispatch(socialActions.saveDigitalContent(digitalContentId, FavoriteSource.FAVORITES_PAGE)),
    unsaveDigitalContent: (digitalContentId: ID) =>
      dispatch(
        socialActions.unsaveDigitalContent(digitalContentId, FavoriteSource.FAVORITES_PAGE)
      ),
    record: (event: DigitalContentEvent) => dispatch(event)
  }
}

export default withRouter(
  connect(makeMapStateToProps, mapDispatchToProps)(SavedPage)
)
