import { useEffect, useCallback, ComponentType, RefObject } from 'react'

import { ID } from '@coliving/common'
import { push as pushRoute } from 'connected-react-router'
import { connect } from 'react-redux'
import { useParams } from 'react-router'
import { Dispatch } from 'redux'

import { makeGetLineupMetadatas } from 'common/store/lineup/selectors'
import { digitalContentsActions } from 'common/store/pages/remixes/lineup/actions'
import {
  getDigitalContent,
  getUser,
  getLineup,
  getCount
} from 'common/store/pages/remixes/selectors'
import { fetchDigitalContent, reset } from 'common/store/pages/remixes/slice'
import { makeGetCurrent } from 'common/store/queue/selectors'
import { LineupVariant } from 'components/lineup/types'
import { getPlaying, getBuffering } from 'store/player/selectors'
import { AppState } from 'store/types'
import { profilePage } from 'utils/route'

import { RemixesPageProps as DesktopRemixesPageProps } from './components/desktop/remixesPage'
import { RemixesPageProps as MobileRemixesPageProps } from './components/mobile/remixesPage'

const messages = {
  title: 'Remixes',
  description: 'Remixes'
}

type OwnProps = {
  containerRef: RefObject<HTMLDivElement>
  children:
    | ComponentType<DesktopRemixesPageProps>
    | ComponentType<MobileRemixesPageProps>
}

type mapStateProps = ReturnType<typeof makeMapStateToProps>
type RemixesPageProviderProps = OwnProps &
  ReturnType<mapStateProps> &
  ReturnType<typeof mapDispatchToProps>

const RemixesPageProvider = ({
  containerRef,
  children: Children,
  count,
  originalDigitalContent,
  user,
  digitalContents,
  fetchDigitalContent,
  currentQueueItem,
  isPlaying,
  isBuffering,
  pause,
  play,
  loadMore,
  goToRoute,
  reset,
  resetDigitalContents
}: RemixesPageProviderProps) => {
  const { handle, slug } = useParams<{ handle: string; slug: string }>()
  useEffect(() => {
    fetchDigitalContent(handle, slug)
  }, [handle, slug, fetchDigitalContent])

  useEffect(() => {
    return function cleanup() {
      reset()
      resetDigitalContents()
    }
  }, [reset, resetDigitalContents])

  const goToDigitalContentPage = useCallback(() => {
    if (user && originalDigitalContent) {
      goToRoute(originalDigitalContent.permalink)
    }
  }, [goToRoute, originalDigitalContent, user])

  const goToLandlordPage = useCallback(() => {
    if (user) {
      goToRoute(profilePage(user?.handle))
    }
  }, [goToRoute, user])

  const getLineupProps = () => {
    return {
      selfLoad: true,
      variant: LineupVariant.MAIN,
      containerRef,
      lineup: digitalContents,
      playingUid: currentQueueItem.uid,
      playingSource: currentQueueItem.source,
      playingDigitalContentId: currentQueueItem.digital_content && currentQueueItem.digital_content.digital_content_id,
      playing: isPlaying,
      buffering: isBuffering,
      pauseDigitalContent: pause,
      playDigitalContent: play,
      actions: digitalContentsActions,
      scrollParent: containerRef as any,
      loadMore: (offset: number, limit: number) => {
        loadMore(offset, limit, { digitalContentId: originalDigitalContent?.digital_content_id ?? null })
      }
    }
  }

  const childProps = {
    title: messages.title,
    count,
    originalDigitalContent,
    user,
    goToDigitalContentPage,
    goToLandlordPage,
    getLineupProps
  }

  return <Children {...childProps} />
}

function makeMapStateToProps() {
  const getRemixesDigitalContentsLineup = makeGetLineupMetadatas(getLineup)
  const getCurrentQueueItem = makeGetCurrent()

  const mapStateToProps = (state: AppState) => {
    return {
      user: getUser(state),
      originalDigitalContent: getDigitalContent(state),
      count: getCount(state),
      digitalContents: getRemixesDigitalContentsLineup(state),
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
    fetchDigitalContent: (handle: string, slug: string) =>
      dispatch(fetchDigitalContent({ handle, slug })),
    loadMore: (
      offset: number,
      limit: number,
      payload: { digitalContentId: ID | null }
    ) =>
      dispatch(
        digitalContentsActions.fetchLineupMetadatas(offset, limit, false, payload)
      ),
    pause: () => dispatch(digitalContentsActions.pause()),
    play: (uid?: string) => dispatch(digitalContentsActions.play(uid)),
    reset: () => dispatch(reset()),
    resetDigitalContents: () => dispatch(digitalContentsActions.reset())
  }
}

export default connect(
  makeMapStateToProps,
  mapDispatchToProps
)(RemixesPageProvider)
