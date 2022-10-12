import { useEffect, useCallback, ComponentType } from 'react'

import { Playable, User } from '@coliving/common'
import { push as pushRoute } from 'connected-react-router'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'

import { makeGetLineupMetadatas } from 'common/store/lineup/selectors'
import { makeGetCurrent } from 'common/store/queue/selectors'
import { LineupVariant } from 'components/lineup/types'
import { getPlaying, getBuffering } from 'store/player/selectors'
import { AppState } from 'store/types'
import { profilePage } from 'utils/route'

import { DeletedPageProps as DesktopDeletedPageProps } from './components/desktop/deletedPage'
import { DeletedPageProps as MobileDeletedPageProps } from './components/mobile/deletedPage'
import { moreByActions } from './store/lineups/more-by/actions'
import { getLineup } from './store/selectors'

type OwnProps = {
  title: string
  description: string
  canonicalUrl: string
  user: User
  playable: Playable
  deletedByLandlord: boolean

  children:
    | ComponentType<DesktopDeletedPageProps>
    | ComponentType<MobileDeletedPageProps>
}

type mapStateProps = ReturnType<typeof makeMapStateToProps>
type DeletedPageProviderProps = OwnProps &
  ReturnType<mapStateProps> &
  ReturnType<typeof mapDispatchToProps>

const DeletedPageProvider = ({
  title,
  description,
  canonicalUrl,
  user,
  deletedByLandlord = true,
  playable,
  children: Children,
  currentQueueItem,
  isPlaying,
  isBuffering,
  pause,
  play,
  loadMore,
  goToRoute,
  resetDigitalContents,
  moreBy
}: DeletedPageProviderProps) => {
  useEffect(() => {
    return function cleanup() {
      resetDigitalContents()
    }
  }, [resetDigitalContents])

  const goToLandlordPage = useCallback(() => {
    goToRoute(profilePage(user?.handle))
  }, [goToRoute, user])

  const getLineupProps = () => {
    return {
      selfLoad: true,
      variant: LineupVariant.CONDENSED,
      lineup: moreBy,
      count: 5,
      playingUid: currentQueueItem.uid,
      playingSource: currentQueueItem.source,
      playingDigitalContentId: currentQueueItem.digital_content && currentQueueItem.digital_content.digital_content_id,
      playing: isPlaying,
      buffering: isBuffering,
      pauseDigitalContent: pause,
      playDigitalContent: play,
      actions: moreByActions,
      loadMore: (offset: number, limit: number) => {
        loadMore(offset, limit, { handle: user?.handle })
      }
    }
  }

  const childProps = {
    title,
    description,
    canonicalUrl,
    playable,
    user,
    goToLandlordPage,
    getLineupProps,
    deletedByLandlord
  }

  return <Children {...childProps} />
}

function makeMapStateToProps() {
  const getMoreByLineup = makeGetLineupMetadatas(getLineup)
  const getCurrentQueueItem = makeGetCurrent()

  const mapStateToProps = (state: AppState) => {
    return {
      moreBy: getMoreByLineup(state),
      currentQueueItem: getCurrentQueueItem(state),
      isPlaying: getPlaying(state),
      isBuffering: getBuffering(state)
    }
  }
  return mapStateToProps
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    goToRoute: (route: string) => dispatch(pushRoute(route)),
    loadMore: (offset: number, limit: number, payload: { handle: string }) =>
      dispatch(
        moreByActions.fetchLineupMetadatas(offset, limit, false, payload)
      ),
    pause: () => dispatch(moreByActions.pause()),
    play: (uid?: string) => dispatch(moreByActions.play(uid)),
    resetDigitalContents: () => dispatch(moreByActions.reset())
  }
}

export default connect(
  makeMapStateToProps,
  mapDispatchToProps
)(DeletedPageProvider)
