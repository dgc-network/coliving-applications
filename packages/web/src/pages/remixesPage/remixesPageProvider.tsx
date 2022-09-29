import { useEffect, useCallback, ComponentType, RefObject } from 'react'

import { ID } from '@coliving/common'
import { push as pushRoute } from 'connected-react-router'
import { connect } from 'react-redux'
import { useParams } from 'react-router'
import { Dispatch } from 'redux'

import { makeGetLineupMetadatas } from 'common/store/lineup/selectors'
import { agreementsActions } from 'common/store/pages/remixes/lineup/actions'
import {
  getAgreement,
  getUser,
  getLineup,
  getCount
} from 'common/store/pages/remixes/selectors'
import { fetchAgreement, reset } from 'common/store/pages/remixes/slice'
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
  originalAgreement,
  user,
  agreements,
  fetchAgreement,
  currentQueueItem,
  isPlaying,
  isBuffering,
  pause,
  play,
  loadMore,
  goToRoute,
  reset,
  resetAgreements
}: RemixesPageProviderProps) => {
  const { handle, slug } = useParams<{ handle: string; slug: string }>()
  useEffect(() => {
    fetchAgreement(handle, slug)
  }, [handle, slug, fetchAgreement])

  useEffect(() => {
    return function cleanup() {
      reset()
      resetAgreements()
    }
  }, [reset, resetAgreements])

  const goToAgreementPage = useCallback(() => {
    if (user && originalAgreement) {
      goToRoute(originalAgreement.permalink)
    }
  }, [goToRoute, originalAgreement, user])

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
      lineup: agreements,
      playingUid: currentQueueItem.uid,
      playingSource: currentQueueItem.source,
      playingAgreementId: currentQueueItem.agreement && currentQueueItem.agreement.agreement_id,
      playing: isPlaying,
      buffering: isBuffering,
      pauseAgreement: pause,
      playAgreement: play,
      actions: agreementsActions,
      scrollParent: containerRef as any,
      loadMore: (offset: number, limit: number) => {
        loadMore(offset, limit, { agreementId: originalAgreement?.agreement_id ?? null })
      }
    }
  }

  const childProps = {
    title: messages.title,
    count,
    originalAgreement,
    user,
    goToAgreementPage,
    goToLandlordPage,
    getLineupProps
  }

  return <Children {...childProps} />
}

function makeMapStateToProps() {
  const getRemixesAgreementsLineup = makeGetLineupMetadatas(getLineup)
  const getCurrentQueueItem = makeGetCurrent()

  const mapStateToProps = (state: AppState) => {
    return {
      user: getUser(state),
      originalAgreement: getAgreement(state),
      count: getCount(state),
      agreements: getRemixesAgreementsLineup(state),
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
    fetchAgreement: (handle: string, slug: string) =>
      dispatch(fetchAgreement({ handle, slug })),
    loadMore: (
      offset: number,
      limit: number,
      payload: { agreementId: ID | null }
    ) =>
      dispatch(
        agreementsActions.fetchLineupMetadatas(offset, limit, false, payload)
      ),
    pause: () => dispatch(agreementsActions.pause()),
    play: (uid?: string) => dispatch(agreementsActions.play(uid)),
    reset: () => dispatch(reset()),
    resetAgreements: () => dispatch(agreementsActions.reset())
  }
}

export default connect(
  makeMapStateToProps,
  mapDispatchToProps
)(RemixesPageProvider)
