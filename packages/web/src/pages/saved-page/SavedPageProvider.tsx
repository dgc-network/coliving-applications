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
import { agreementsActions } from 'common/store/pages/savedPage/lineups/agreements/actions'
import { getSavedAgreementsLineup } from 'common/store/pages/savedPage/selectors'
import {
  Tabs as ProfileTabs,
  SavedPageAgreement,
  AgreementRecord,
  SavedPageCollection
} from 'common/store/pages/savedPage/types'
import { makeGetCurrent } from 'common/store/queue/selectors'
import * as socialActions from 'common/store/social/agreements/actions'
import { formatCount } from 'common/utils/formatUtil'
import { AgreementEvent, make } from 'store/analytics/actions'
import { getPlaying, getBuffering } from 'store/player/selectors'
import { AppState } from 'store/types'
import { isMobile } from 'utils/clientUtil'
import { profilePage } from 'utils/route'

import { SavedPageProps as DesktopSavedPageProps } from './components/desktop/SavedPage'
import { SavedPageProps as MobileSavedPageProps } from './components/mobile/SavedPage'

const IS_NATIVE_MOBILE = process.env.REACT_APP_NATIVE_MOBILE

const messages = {
  title: 'Favorites',
  description: "View agreements that you've favorited"
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
    currentTab: ProfileTabs.AGREEMENTS
  }

  componentDidMount() {
    this.props.fetchSavedAgreements()
    this.props.fetchSavedAlbums()
    if (isMobile()) {
      this.props.fetchSavedContentLists()
    }
  }

  componentWillUnmount() {
    if (!IS_NATIVE_MOBILE) {
      this.props.resetSavedAgreements()
    }
  }

  componentDidUpdate() {
    const { agreements } = this.props

    if (!this.state.initialOrder && agreements.entries.length > 0) {
      const initialOrder = agreements.entries.map((agreement: any) => agreement.uid)
      this.setState({
        initialOrder,
        reordering: initialOrder
      })
    }
  }

  onFilterChange = (e: any) => {
    this.setState({ filterText: e.target.value })
  }

  formatMetadata = (agreementMetadatas: SavedPageAgreement[]) => {
    return agreementMetadatas.map((entry, i) => ({
      ...entry,
      key: `${entry.title}_${entry.uid}_${i}`,
      name: entry.title,
      landlord: entry.user.name,
      handle: entry.user.handle,
      date: entry.dateSaved,
      time: entry.duration,
      plays: entry.play_count
    }))
  }

  isQueued = () => {
    const { agreements, currentQueueItem } = this.props
    return agreements.entries.some(
      (entry: any) => currentQueueItem.uid === entry.uid
    )
  }

  getPlayingUid = () => {
    const { currentQueueItem } = this.props
    return currentQueueItem.uid
  }

  getPlayingId = () => {
    const { currentQueueItem } = this.props
    return currentQueueItem.agreement ? currentQueueItem.agreement.agreement_id : null
  }

  getFilteredData = (
    agreementMetadatas: SavedPageAgreement[]
  ): [SavedPageAgreement[], number] => {
    const filterText = this.state.filterText
    const { agreements } = this.props
    const playingUid = this.getPlayingUid()
    const playingIndex = agreements.entries.findIndex(
      ({ uid }: any) => uid === playingUid
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

  onClickRow = (agreementRecord: AgreementRecord) => {
    const { playing, play, pause, record } = this.props
    const playingUid = this.getPlayingUid()
    if (playing && playingUid === agreementRecord.uid) {
      pause()
      record(
        make(Name.PLAYBACK_PAUSE, {
          id: `${agreementRecord.agreement_id}`,
          source: PlaybackSource.FAVORITES_PAGE
        })
      )
    } else if (playingUid !== agreementRecord.uid) {
      play(agreementRecord.uid)
      record(
        make(Name.PLAYBACK_PLAY, {
          id: `${agreementRecord.agreement_id}`,
          source: PlaybackSource.FAVORITES_PAGE
        })
      )
    } else {
      play()
      record(
        make(Name.PLAYBACK_PLAY, {
          id: `${agreementRecord.agreement_id}`,
          source: PlaybackSource.FAVORITES_PAGE
        })
      )
    }
  }

  onTogglePlay = (uid: string, agreementId: ID) => {
    const { playing, play, pause, record } = this.props
    const playingUid = this.getPlayingUid()
    if (playing && playingUid === uid) {
      pause()
      record(
        make(Name.PLAYBACK_PAUSE, {
          id: `${agreementId}`,
          source: PlaybackSource.FAVORITES_PAGE
        })
      )
    } else if (playingUid !== uid) {
      play(uid)
      record(
        make(Name.PLAYBACK_PLAY, {
          id: `${agreementId}`,
          source: PlaybackSource.FAVORITES_PAGE
        })
      )
    } else {
      play()
      record(
        make(Name.PLAYBACK_PLAY, {
          id: `${agreementId}`,
          source: PlaybackSource.FAVORITES_PAGE
        })
      )
    }
  }

  onClickSave = (record: AgreementRecord) => {
    if (!record.has_current_user_saved) {
      this.props.saveAgreement(record.agreement_id)
    } else {
      this.props.unsaveAgreement(record.agreement_id)
    }
  }

  onSave = (isSaved: boolean, agreementId: ID) => {
    if (!isSaved) {
      this.props.saveAgreement(agreementId)
    } else {
      this.props.unsaveAgreement(agreementId)
    }
  }

  onClickAgreementName = (record: AgreementRecord) => {
    this.props.goToRoute(record.permalink)
  }

  onClickLandlordName = (record: AgreementRecord) => {
    this.props.goToRoute(profilePage(record.handle))
  }

  onClickRepost = (record: AgreementRecord) => {
    if (!record.has_current_user_reposted) {
      this.props.repostAgreement(record.agreement_id)
    } else {
      this.props.undoRepostAgreement(record.agreement_id)
    }
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

  onSortAgreements = (sorters: any) => {
    const { column, order } = sorters
    const {
      agreements: { entries }
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

  formatCardSecondaryText = (saves: number, agreements: number) => {
    const savesText = saves === 1 ? 'Favorite' : 'Favorites'
    const agreementsText = agreements === 1 ? 'Agreement' : 'Agreements'
    return `${formatCount(saves)} ${savesText} • ${agreements} ${agreementsText}`
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
      agreements: this.props.agreements,
      currentQueueItem: this.props.currentQueueItem,
      playing: this.props.playing,
      buffering: this.props.buffering,

      // Props from dispatch
      fetchSavedAgreements: this.props.fetchSavedAgreements,
      resetSavedAgreements: this.props.resetSavedAgreements,
      updateLineupOrder: this.props.updateLineupOrder,
      fetchSavedAlbums: this.props.fetchSavedAlbums,
      goToRoute: this.props.goToRoute,
      play: this.props.play,
      pause: this.props.pause,
      repostAgreement: this.props.repostAgreement,
      undoRepostAgreement: this.props.undoRepostAgreement,
      saveAgreement: this.props.saveAgreement,
      unsaveAgreement: this.props.unsaveAgreement,

      // Calculated Props
      isQueued,
      playingUid,

      // Methods
      onFilterChange: this.onFilterChange,
      formatMetadata: this.formatMetadata,
      getFilteredData: this.getFilteredData,
      onPlay: this.onPlay,
      onSortAgreements: this.onSortAgreements,
      onChangeTab: this.onChangeTab,
      formatCardSecondaryText: this.formatCardSecondaryText,
      onReorderAgreements: () => {},
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
      onClickAgreementName: this.onClickAgreementName,
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
  const getLineupMetadatas = makeGetTableMetadatas(getSavedAgreementsLineup)
  const getCurrentQueueItem = makeGetCurrent()
  const mapStateToProps = (state: AppState) => {
    return {
      account: getAccountWithSavedContentListsAndAlbums(state),
      agreements: getLineupMetadatas(state),
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
    fetchSavedAgreements: () => dispatch(saveActions.fetchSaves()),
    resetSavedAgreements: () => dispatch(agreementsActions.reset()),
    updateLineupOrder: (updatedOrderIndices: UID[]) =>
      dispatch(agreementsActions.updateLineupOrder(updatedOrderIndices)),
    fetchSavedAlbums: () => dispatch(accountActions.fetchSavedAlbums()),
    fetchSavedContentLists: () => dispatch(accountActions.fetchSavedContentLists()),
    updateContentListLastViewedAt: (contentListId: number) =>
      dispatch(updateContentListLastViewedAt(contentListId)),
    goToRoute: (route: string) => dispatch(pushRoute(route)),
    play: (uid?: UID) => dispatch(agreementsActions.play(uid)),
    pause: () => dispatch(agreementsActions.pause()),
    repostAgreement: (agreementId: ID) =>
      dispatch(socialActions.repostAgreement(agreementId, RepostSource.FAVORITES_PAGE)),
    undoRepostAgreement: (agreementId: ID) =>
      dispatch(
        socialActions.undoRepostAgreement(agreementId, RepostSource.FAVORITES_PAGE)
      ),
    saveAgreement: (agreementId: ID) =>
      dispatch(socialActions.saveAgreement(agreementId, FavoriteSource.FAVORITES_PAGE)),
    unsaveAgreement: (agreementId: ID) =>
      dispatch(
        socialActions.unsaveAgreement(agreementId, FavoriteSource.FAVORITES_PAGE)
      ),
    record: (event: AgreementEvent) => dispatch(event)
  }
}

export default withRouter(
  connect(makeMapStateToProps, mapDispatchToProps)(SavedPage)
)
