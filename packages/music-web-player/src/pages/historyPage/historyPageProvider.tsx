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
import { agreementsActions } from 'common/store/pages/historyPage/lineups/agreements/actions'
import { getHistoryAgreementsLineup } from 'common/store/pages/historyPage/selectors'
import { makeGetCurrent } from 'common/store/queue/selectors'
import * as socialActions from 'common/store/social/agreements/actions'
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
    agreements,
    currentQueueItem,
    updateLineupOrder,
    fetchHistoryAgreementMetadata,
    saveAgreement,
    unsaveAgreement,
    repostAgreement,
    undoRepostAgreement
  } = props

  const { entries, status } = agreements
  const record = useRecord()

  const [filterText, setFilterText] = useState('')
  const onFilterChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setFilterText(e.target.value)
    },
    [setFilterText]
  )

  useEffect(() => {
    fetchHistoryAgreementMetadata()
  }, [fetchHistoryAgreementMetadata])

  const formatMetadata = (lineupEntries: any) => {
    return lineupEntries.map((entry: any, i: number) => ({
      ...entry,
      key: `${entry.title}_${entry.dateListened}_${i}`,
      name: entry.title,
      landlord: entry.user.name,
      handle: entry.user.handle,
      date: entry.dateListened,
      time: entry.duration,
      plays: entry.play_count
    }))
  }

  const getFilteredData = useCallback(
    (agreementMetadatas: any) => {
      const filteredMetadata = formatMetadata(agreementMetadatas).filter(
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
    (agreementRecord: any) => {
      if (playing && agreementRecord.uid === currentQueueItem.uid) {
        pause()
        record(
          make(Name.PLAYBACK_PAUSE, {
            id: `${agreementRecord.agreement_id}`,
            source: PlaybackSource.HISTORY_PAGE
          })
        )
      } else {
        play(agreementRecord.uid)
        record(
          make(Name.PLAYBACK_PLAY, {
            id: `${agreementRecord.agreement_id}`,
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
        saveAgreement(record.agreement_id)
      } else {
        unsaveAgreement(record.agreement_id)
      }
    },
    [saveAgreement, unsaveAgreement]
  )

  const onToggleSave = useCallback(
    (isSaved: boolean, agreementId: ID) => {
      if (!isSaved) {
        saveAgreement(agreementId)
      } else {
        unsaveAgreement(agreementId)
      }
    },
    [saveAgreement, unsaveAgreement]
  )

  const onTogglePlay = useCallback(
    (uid: UID, agreementId: ID) => {
      if (playing && uid === currentQueueItem.uid) {
        pause()
        record(
          make(Name.PLAYBACK_PAUSE, {
            id: `${agreementId}`,
            source: PlaybackSource.HISTORY_PAGE
          })
        )
      } else {
        play(uid)
        record(
          make(Name.PLAYBACK_PLAY, {
            id: `${agreementId}`,
            source: PlaybackSource.HISTORY_PAGE
          })
        )
      }
    },
    [playing, play, pause, currentQueueItem, record]
  )

  const onClickAgreementName = useCallback(
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
        repostAgreement(record.agreement_id)
      } else {
        undoRepostAgreement(record.agreement_id)
      }
    },
    [repostAgreement, undoRepostAgreement]
  )

  const isQueued = useCallback(() => {
    return agreements.entries.some(
      (entry: any) => currentQueueItem.uid === entry.uid
    )
  }, [agreements, currentQueueItem])

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

  const onSortAgreements = (sorters: any) => {
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
    onClickAgreementName,
    onClickLandlordName,
    onSortAgreements
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
  const getLineupMetadatas = makeGetTableMetadatas(getHistoryAgreementsLineup)
  const getCurrentQueueItem = makeGetCurrent()
  const mapStateToProps = (state: AppState) => ({
    userId: getUserId(state),
    agreements: getLineupMetadatas(state),
    currentQueueItem: getCurrentQueueItem(state),
    playing: getPlaying(state),
    buffering: getBuffering(state)
  })
  return mapStateToProps
}

const mapDispatchToProps = (dispatch: Dispatch) => ({
  fetchHistoryAgreementMetadata: () =>
    dispatch(agreementsActions.fetchLineupMetadatas()),
  play: (uid?: UID) => dispatch(agreementsActions.play(uid)),
  pause: () => dispatch(agreementsActions.pause()),
  goToRoute: (route: string) => dispatch(pushRoute(route)),
  updateLineupOrder: (updatedOrderIndices: any) =>
    dispatch(agreementsActions.updateLineupOrder(updatedOrderIndices)),
  repostAgreement: (agreementId: ID) =>
    dispatch(socialActions.repostAgreement(agreementId, RepostSource.HISTORY_PAGE)),
  undoRepostAgreement: (agreementId: ID) =>
    dispatch(socialActions.undoRepostAgreement(agreementId, RepostSource.HISTORY_PAGE)),
  saveAgreement: (agreementId: ID) =>
    dispatch(socialActions.saveAgreement(agreementId, FavoriteSource.HISTORY_PAGE)),
  unsaveAgreement: (agreementId: ID) =>
    dispatch(socialActions.unsaveAgreement(agreementId, FavoriteSource.HISTORY_PAGE))
})

export default withRouter(
  connect(makeMapStateToProps, mapDispatchToProps)(HistoryPage)
)
