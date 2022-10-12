import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  ChangeEvent,
  ComponentType
} from 'react'

import {
  ID,
  UID,
  RepostSource,
  FavoriteSource,
  Name,
  PlaybackSource,
  Status
} from '@coliving/common'
import { push as pushRoute } from 'connected-react-router'
import { connect } from 'react-redux'
import { withRouter, RouteComponentProps } from 'react-router-dom'
import { Dispatch } from 'redux'

import { getUserId } from 'common/store/account/selectors'
import { makeGetTableMetadatas } from 'common/store/lineup/selectors'
import { digitalContentsActions } from 'common/store/pages/historyPage/lineups/digital_contents/actions'
import { getHistoryDigitalContentsLineup } from 'common/store/pages/historyPage/selectors'
import { makeGetCurrent } from 'common/store/queue/selectors'
import * as socialActions from 'common/store/social/digital_contents/actions'
import { useRecord, make } from 'store/analytics/actions'
import { getPlaying, getBuffering } from 'store/player/selectors'
import { AppState } from 'store/types'
import { profilePage } from 'utils/route'
import { withNullGuard } from 'utils/withNullGuard'

import { HistoryPageProps as DesktopHistoryPageProps } from './components/desktop/historyPage'
import { HistoryPageProps as MobileHistoryPageProps } from './components/mobile/historyPage'

const messages = {
  title: 'History',
  description: 'View your listening history'
}

type OwnProps = {
  children:
    | ComponentType<MobileHistoryPageProps>
    | ComponentType<DesktopHistoryPageProps>
}

type HistoryPageProps = OwnProps &
  ReturnType<ReturnType<typeof makeMapStateToProps>> &
  ReturnType<typeof mapDispatchToProps> &
  RouteComponentProps

const g = withNullGuard(
  ({ userId, ...p }: HistoryPageProps) => userId !== null && { ...p, userId }
)

const HistoryPage = g((props) => {
  const {
    pause,
    play,
    playing,
    userId,
    goToRoute,
    digitalContents,
    currentQueueItem,
    updateLineupOrder,
    fetchHistoryDigitalContentMetadata,
    saveDigitalContent,
    unsaveDigitalContent,
    repostDigitalContent,
    undoRepostDigitalContent
  } = props

  const { entries, status } = digitalContents
  const record = useRecord()

  const [filterText, setFilterText] = useState('')
  const onFilterChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setFilterText(e.target.value)
    },
    [setFilterText]
  )

  useEffect(() => {
    fetchHistoryDigitalContentMetadata()
  }, [fetchHistoryDigitalContentMetadata])

  const formatMetadata = (lineupEntries: any) => {
    return lineupEntries.map((entry: any, i: number) => ({
      ...entry,
      key: `${entry.title}_${entry.dateListened}_${i}`,
      name: entry.title,
      author: entry.user.name,
      handle: entry.user.handle,
      date: entry.dateListened,
      time: entry.duration,
      plays: entry.play_count
    }))
  }

  const getFilteredData = useCallback(
    (digitalContentMetadatas: any) => {
      const filteredMetadata = formatMetadata(digitalContentMetadatas).filter(
        (entry: any) =>
          entry.title.toLowerCase().indexOf(filterText.toLowerCase()) > -1 ||
          entry.user.name.toLowerCase().indexOf(filterText.toLowerCase()) > -1
      )
      const filteredIndex = filteredMetadata.findIndex(
        (metadata: any) => metadata.uid === currentQueueItem.uid
      )
      return [filteredMetadata, filteredIndex]
    },
    [currentQueueItem, filterText]
  )

  const [dataSource, playingIndex] = useMemo(
    () => (status === Status.SUCCESS ? getFilteredData(entries) : [[], -1]),
    [entries, getFilteredData, status]
  )

  const [initialOrder, setInitialOrder] = useState<UID[]>([])

  useEffect(() => {
    if (status === Status.SUCCESS) {
      setInitialOrder(dataSource.map((metadata: any) => metadata.uid))
    }
  }, [status, dataSource])

  const onClickRow = useCallback(
    (digitalContentRecord: any) => {
      if (playing && digitalContentRecord.uid === currentQueueItem.uid) {
        pause()
        record(
          make(Name.PLAYBACK_PAUSE, {
            id: `${digitalContentRecord.digital_content_id}`,
            source: PlaybackSource.HISTORY_PAGE
          })
        )
      } else {
        play(digitalContentRecord.uid)
        record(
          make(Name.PLAYBACK_PLAY, {
            id: `${digitalContentRecord.digital_content_id}`,
            source: PlaybackSource.HISTORY_PAGE
          })
        )
      }
    },
    [playing, pause, play, currentQueueItem, record]
  )

  const onClickSave = useCallback(
    (record) => {
      if (!record.has_current_user_saved) {
        saveDigitalContent(record.digital_content_id)
      } else {
        unsaveDigitalContent(record.digital_content_id)
      }
    },
    [saveDigitalContent, unsaveDigitalContent]
  )

  const onToggleSave = useCallback(
    (isSaved: boolean, digitalContentId: ID) => {
      if (!isSaved) {
        saveDigitalContent(digitalContentId)
      } else {
        unsaveDigitalContent(digitalContentId)
      }
    },
    [saveDigitalContent, unsaveDigitalContent]
  )

  const onTogglePlay = useCallback(
    (uid: UID, digitalContentId: ID) => {
      if (playing && uid === currentQueueItem.uid) {
        pause()
        record(
          make(Name.PLAYBACK_PAUSE, {
            id: `${digitalContentId}`,
            source: PlaybackSource.HISTORY_PAGE
          })
        )
      } else {
        play(uid)
        record(
          make(Name.PLAYBACK_PLAY, {
            id: `${digitalContentId}`,
            source: PlaybackSource.HISTORY_PAGE
          })
        )
      }
    },
    [playing, play, pause, currentQueueItem, record]
  )

  const onClickDigitalContentName = useCallback(
    (record) => {
      goToRoute(record.permalink)
    },
    [goToRoute]
  )

  const onClickLandlordName = useCallback(
    (record) => {
      goToRoute(profilePage(record.handle))
    },
    [goToRoute]
  )

  const onClickRepost = useCallback(
    (record) => {
      if (!record.has_current_user_reposted) {
        repostDigitalContent(record.digital_content_id)
      } else {
        undoRepostDigitalContent(record.digital_content_id)
      }
    },
    [repostDigitalContent, undoRepostDigitalContent]
  )

  const isQueued = useCallback(() => {
    return digitalContents.entries.some(
      (entry: any) => currentQueueItem.uid === entry.uid
    )
  }, [digitalContents, currentQueueItem])

  const getPlayingUid = useCallback(() => {
    return currentQueueItem.uid
  }, [currentQueueItem])

  const onPlay = useCallback(() => {
    const isLineupQueued = isQueued()
    if (playing && isLineupQueued) {
      pause()
    } else if (!playing && isLineupQueued) {
      play()
    } else if (entries.length > 0) {
      play(entries[0].uid)
    }
  }, [isQueued, pause, play, playing, entries])

  const onSortDigitalContents = (sorters: any) => {
    const { column, order } = sorters
    const dataSource = formatMetadata(entries)
    let updatedOrder
    if (!column) {
      updatedOrder = initialOrder
    } else {
      updatedOrder = dataSource
        .sort((a: any, b: any) =>
          order === 'ascend' ? column.sorter(a, b) : column.sorter(b, a)
        )
        .map((metadata: any) => metadata.uid)
    }
    updateLineupOrder(updatedOrder)
  }

  const isEmpty = entries.length === 0
  const loading = status === Status.LOADING
  const queuedAndPlaying = playing && isQueued()

  const childProps = {
    title: messages.title,
    description: messages.description,
    loading,
    entries,
    queuedAndPlaying,
    playingIndex,
    dataSource,

    isEmpty,
    goToRoute,
    currentQueueItem,

    // Methods
    onFilterChange,
    formatMetadata,
    getPlayingUid,
    isQueued
  }

  const mobileProps = {
    playing,
    onToggleSave,
    onTogglePlay
  }

  const desktopProps = {
    userId,
    onPlay,
    filterText,
    onClickRepost,
    getFilteredData,
    onClickSave,
    onClickRow,
    onClickDigitalContentName,
    onClickLandlordName,
    onSortDigitalContents
  }

  return (
    <props.children
      key={userId}
      {...childProps}
      {...mobileProps}
      {...desktopProps}
    />
  )
})

const makeMapStateToProps = () => {
  const getLineupMetadatas = makeGetTableMetadatas(getHistoryDigitalContentsLineup)
  const getCurrentQueueItem = makeGetCurrent()
  const mapStateToProps = (state: AppState) => ({
    userId: getUserId(state),
    digitalContents: getLineupMetadatas(state),
    currentQueueItem: getCurrentQueueItem(state),
    playing: getPlaying(state),
    buffering: getBuffering(state)
  })
  return mapStateToProps
}

const mapDispatchToProps = (dispatch: Dispatch) => ({
  fetchHistoryDigitalContentMetadata: () =>
    dispatch(digitalContentsActions.fetchLineupMetadatas()),
  play: (uid?: UID) => dispatch(digitalContentsActions.play(uid)),
  pause: () => dispatch(digitalContentsActions.pause()),
  goToRoute: (route: string) => dispatch(pushRoute(route)),
  updateLineupOrder: (updatedOrderIndices: any) =>
    dispatch(digitalContentsActions.updateLineupOrder(updatedOrderIndices)),
  repostDigitalContent: (digitalContentId: ID) =>
    dispatch(socialActions.repostDigitalContent(digitalContentId, RepostSource.HISTORY_PAGE)),
  undoRepostDigitalContent: (digitalContentId: ID) =>
    dispatch(socialActions.undoRepostDigitalContent(digitalContentId, RepostSource.HISTORY_PAGE)),
  saveDigitalContent: (digitalContentId: ID) =>
    dispatch(socialActions.saveDigitalContent(digitalContentId, FavoriteSource.HISTORY_PAGE)),
  unsaveDigitalContent: (digitalContentId: ID) =>
    dispatch(socialActions.unsaveDigitalContent(digitalContentId, FavoriteSource.HISTORY_PAGE))
})

export default withRouter(
  connect(makeMapStateToProps, mapDispatchToProps)(HistoryPage)
)
