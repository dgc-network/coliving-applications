import { useEffect, useState, useCallback } from 'react'
import { push as pushRoute } from 'connected-react-router'
import { AppState } from 'store/types'
import { Dispatch } from 'redux'
import { connect } from 'react-redux'
import cn from 'classnames'

import { makeGetCurrent } from 'common/store/queue/selectors'
import { getAudio, getPlaying } from 'store/player/selectors'
import Visualizer1 from 'utils/visualizer/visualizer-1.js'
import Toast from 'components/toast/Toast'

import styles from './VisualizerProvider.module.css'
import { MountPlacement, ComponentPlacement } from 'components/types'
import { getTheme } from 'common/store/ui/theme/selectors'
import { shouldShowDark } from 'utils/theme/theme'
import { profilePage } from 'utils/route'
import { make, AgreementEvent } from 'store/analytics/actions'
import { Name } from '@coliving/common'
import { Agreement } from '@coliving/common'
import { SquareSizes } from '@coliving/common'
import DynamicImage from 'components/dynamic-image/DynamicImage'
import PlayingAgreementInfo from 'components/play-bar/desktop/components/PlayingAgreementInfo'
import AudioStream from 'live/AudioStream'
import { webglSupported } from './utils'
import { getDominantColorsByAgreement } from 'common/store/average-color/slice'
import { ReactComponent as IconRemove } from 'assets/img/iconRemove.svg'
import { ReactComponent as ColivingLogoHorizontal } from 'assets/img/colivingLogoHorizontal.svg'
import { useAgreementCoverArt } from 'hooks/useAgreementCoverArt'

const Artwork = ({ agreement }: { agreement?: Agreement | null }) => {
  const { agreement_id, _cover_art_sizes } = agreement || {}

  const image = useAgreementCoverArt(
    agreement_id || -1,
    _cover_art_sizes || null,
    SquareSizes.SIZE_480_BY_480
  )
  return <DynamicImage wrapperClassName={styles.artwork} image={image} />
}

type VisualizerProps = {
  isVisible: boolean
  onClose: () => void
} & ReturnType<typeof mapDispatchToProps> &
  ReturnType<ReturnType<typeof makeMapStateToProps>>

const webGLExists = webglSupported()
const messages = (browser: string) => ({
  notSupported: `Heads Up! Visualizer is not fully supported in ${browser} 😢 Please switch to a different browser like Chrome to view!`
})

const Visualizer = ({
  isVisible,
  currentQueueItem,
  live,
  playing,
  theme,
  dominantColors,
  onClose,
  recordOpen,
  recordClose,
  goToRoute
}: VisualizerProps) => {
  const [toastText, setToastText] = useState('')
  // Used to fadeIn/Out the visualizer (opacity 0 -> 1) through a css class
  const [fadeVisualizer, setFadeVisualizer] = useState(false)
  // Used to show/hide the visualizer (display: block/none) through a css class
  const [showVisualizer, setShowVisualizer] = useState(false)

  useEffect(() => {
    if (!(window as any).AudioContext) {
      let browser
      if ((window as any).webkitAudioContext) {
        browser = 'Safari'
      } else if (window.navigator.userAgent.indexOf('MSIE ') > 0) {
        browser = 'Internet Explorer'
      } else {
        browser = 'your browser'
      }
      setToastText(messages(browser).notSupported)
    }
  }, [])

  if (!webGLExists) {
    return null
  }

  // Update Colors
  useEffect(() => {
    if (dominantColors !== null) {
      Visualizer1?.setDominantColors(dominantColors)
    }
  }, [isVisible, dominantColors, playing, currentQueueItem])

  // Rebind live
  useEffect(() => {
    if (live && (live as AudioStream).liveCtx && playing)
      Visualizer1?.bind(live)
  }, [isVisible, playing, live, currentQueueItem])

  useEffect(() => {
    if (isVisible) {
      const darkMode = shouldShowDark(theme)
      Visualizer1?.show(darkMode)
      recordOpen()
      setShowVisualizer(true)
      // Fade in after a 50ms delay because setting showVisualizer() and fadeVisualizer() at the
      // same time leads to a race condition resulting in the animation not fading in sometimes
      setTimeout(() => {
        setFadeVisualizer(true)
      }, 50)
    } else {
      setFadeVisualizer(false)
    }
  }, [isVisible, theme])

  // On Closing of visualizer -> fadeOut
  // Wait some time before removing the wrapper DOM element to allow time for fading out animation.
  useEffect(() => {
    if (!fadeVisualizer) {
      setTimeout(() => {
        setShowVisualizer(false)
        Visualizer1?.hide()
        recordClose()
      }, 400)
    }
  }, [fadeVisualizer])

  const goToAgreementPage = useCallback(() => {
    const { agreement, user } = currentQueueItem
    if (agreement && user) {
      goToRoute(agreement.permalink)
    }
  }, [currentQueueItem])

  const goToLandlordPage = useCallback(() => {
    const { user } = currentQueueItem
    if (user) {
      goToRoute(profilePage(user.handle))
    }
  }, [currentQueueItem])

  const renderAgreementInfo = () => {
    const { uid, agreement, user } = currentQueueItem
    const dominantColor = dominantColors
      ? dominantColors[0]
      : { r: 0, g: 0, b: 0 }
    return agreement && user && uid ? (
      <div className={styles.agreementInfoWrapper}>
        <PlayingAgreementInfo
          profilePictureSizes={user._profile_picture_sizes}
          agreementId={agreement.agreement_id}
          isOwner={agreement.owner_id === user.user_id}
          agreementTitle={agreement.title}
          agreementPermalink={agreement.permalink}
          landlordName={user.name}
          landlordHandle={user.handle}
          landlordUserId={user.user_id}
          isVerified={user.is_verified}
          isAgreementUnlisted={agreement.is_unlisted}
          onClickAgreementTitle={() => {
            goToAgreementPage()
            onClose()
          }}
          onClickLandlordName={() => {
            goToLandlordPage()
            onClose()
          }}
          hasShadow={true}
          dominantColor={dominantColor}
        />
      </div>
    ) : (
      <div className={styles.emptyAgreementInfoWrapper}></div>
    )
  }

  const { agreement } = currentQueueItem
  return (
    <div
      className={cn(styles.visualizer, {
        [styles.fade]: fadeVisualizer,
        [styles.show]: showVisualizer
      })}>
      <div className='visualizer' />
      <div className={styles.logoWrapper}>
        <ColivingLogoHorizontal className={styles.logo} />
      </div>
      <IconRemove className={styles.closeButtonIcon} onClick={onClose} />
      <div className={styles.infoOverlayTileShadow}></div>
      <div className={styles.infoOverlayTile}>
        <div
          className={cn(styles.artworkWrapper, {
            [styles.playing]: agreement
          })}
          onClick={() => {
            goToAgreementPage()
            onClose()
          }}>
          <Artwork agreement={agreement} />
        </div>
        {renderAgreementInfo()}
      </div>
      <Toast
        useCaret={false}
        mount={MountPlacement.BODY}
        placement={ComponentPlacement.BOTTOM}
        overlayClassName={styles.visualizerDisabled}
        open={isVisible && !!toastText}
        text={toastText || ''}
      />
    </div>
  )
}

const makeMapStateToProps = () => {
  const getCurrentQueueItem = makeGetCurrent()
  const mapStateToProps = (state: AppState) => {
    const currentQueueItem = getCurrentQueueItem(state)
    return {
      currentQueueItem,
      live: getAudio(state),
      playing: getPlaying(state),
      theme: getTheme(state),
      dominantColors: getDominantColorsByAgreement(state, {
        agreement: currentQueueItem.agreement
      })
    }
  }
  return mapStateToProps
}

const mapDispatchToProps = (dispatch: Dispatch) => ({
  recordOpen: () => {
    const agreementEvent: AgreementEvent = make(Name.VISUALIZER_OPEN, {})
    dispatch(agreementEvent)
  },
  recordClose: () => {
    const agreementEvent: AgreementEvent = make(Name.VISUALIZER_CLOSE, {})
    dispatch(agreementEvent)
  },
  goToRoute: (route: string) => dispatch(pushRoute(route))
})

export default connect(makeMapStateToProps, mapDispatchToProps)(Visualizer)
