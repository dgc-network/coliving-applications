import { useCallback, useEffect, useRef, useState } from 'react'

import {
  ID,
  FavoriteSource,
  RepostSource,
  PlaybackSource,
  Name,
  ShareSource,
  SquareSizes
} from '@coliving/common'
import { Scrubber } from '@coliving/stems'
import cn from 'classnames'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'

import { ReactComponent as IconCaret } from 'assets/img/iconCaretRight.svg'
import { getUserId } from 'common/store/account/selectors'
import { getDominantColorsByAgreement } from 'common/store/averageColor/slice'
import { getIsCasting, getMethod } from 'common/store/cast/selectors'
import { makeGetCurrent } from 'common/store/queue/selectors'
import {
  next,
  pause,
  play,
  previous,
  repeat,
  shuffle
} from 'common/store/queue/slice'
import { RepeatMode } from 'common/store/queue/types'
import {
  saveAgreement,
  unsaveAgreement,
  repostAgreement,
  undoRepostAgreement
} from 'common/store/social/agreements/actions'
import { open } from 'common/store/ui/mobileOverflowMenu/slice'
import {
  OverflowAction,
  OverflowActionCallbacks,
  OverflowSource
} from 'common/store/ui/mobileOverflowMenu/types'
import { requestOpen as requestOpenShareModal } from 'common/store/ui/shareModal/slice'
import { Genre } from 'common/utils/genres'
import CoSign, { Size } from 'components/coSign/coSign'
import DynamicImage from 'components/dynamicImage/dynamicImage'
import PlayButton from 'components/playBar/playButton'
import NextButtonProvider from 'components/playBar/nextButton/nextButtonProvider'
import PreviousButtonProvider from 'components/playBar/previousButton/previousButtonProvider'
import RepeatButtonProvider from 'components/playBar/repeatButton/repeatButtonProvider'
import ShuffleButtonProvider from 'components/playBar/shuffleButton/shuffleButtonProvider'
import { PlayButtonStatus } from 'components/playBar/types'
import UserBadges from 'components/userBadges/userBadges'
import { useAgreementCoverArt } from 'hooks/useAgreementCoverArt'
import { HapticFeedbackMessage } from 'services/nativeMobileInterface/haptics'
import { useRecord, make } from 'store/analytics/actions'
import {
  getAudio,
  getBuffering,
  getCounter,
  getPlaying
} from 'store/player/selectors'
import { seek, reset } from 'store/player/slice'
import { AudioState } from 'store/player/types'
import { AppState } from 'store/types'
import {
  pushUniqueRoute as pushRoute,
  profilePage,
  collectibleDetailsPage
} from 'utils/route'
import { isDarkMode, isMatrix } from 'utils/theme/theme'
import { withNullGuard } from 'utils/withNullGuard'

import styles from './NowPlaying.module.css'
import ActionsBar from './components/actionsBar'

const NATIVE_MOBILE = process.env.REACT_APP_NATIVE_MOBILE

type OwnProps = {
  onClose: () => void
  live: AudioState
}

type NowPlayingProps = OwnProps &
  ReturnType<ReturnType<typeof makeMapStateToProps>> &
  ReturnType<typeof mapDispatchToProps>

const SEEK_INTERVAL = 200
const RESTART_THRESHOLD_SEC = 3
const SKIP_DURATION_SEC = 15

const messages = {
  nowPlaying: 'Now Playing'
}

const g = withNullGuard((wide: NowPlayingProps) => {
  const { uid, source, user, agreement, collectible } = wide.currentQueueItem
  if (
    ((uid !== null && agreement !== null) || collectible !== null) &&
    source !== null &&
    user !== null
  ) {
    const currentQueueItem = { uid, source, user, agreement, collectible }
    return {
      ...wide,
      currentQueueItem
    }
  }
})

const NowPlaying = g(
  ({
    onClose,
    currentQueueItem,
    currentUserId,
    playCounter,
    live,
    isPlaying,
    isBuffering,
    play,
    pause,
    reset,
    next,
    previous,
    seek,
    repeat,
    share,
    shuffle,
    save,
    unsave,
    repost,
    undoRepost,
    clickOverflow,
    goToRoute,
    isCasting,
    castMethod,
    dominantColors
  }) => {
    const { uid, agreement, user, collectible } = currentQueueItem

    // Keep a ref for the artwork and dynamically resize the width of the
    // image as the height changes (which is flexed).
    const artworkRef = useRef<HTMLDivElement | null>(null)
    useEffect(() => {
      if (artworkRef.current) {
        // 4px accounts for the borders on the image
        artworkRef.current.style.width = `${
          artworkRef.current.offsetHeight - 4
        }px`
      }
    }, [artworkRef, playCounter])

    // Store position and duration together so they only trigger one state change
    const [timing, setTiming] = useState({ position: 0, duration: 0 })
    // Additional media key to refresh scrubber in account for out of sync mobile seek position
    // and UI seek position
    const [mediaKey, setMediaKey] = useState(0)
    const seekInterval = useRef<number | undefined>(undefined)
    const [prevPlayCounter, setPrevPlayCounter] = useState<number | null>(null)

    const startSeeking = useCallback(() => {
      clearInterval(seekInterval.current)
      seekInterval.current = window.setInterval(async () => {
        if (!live) return
        const position = await live.getPosition()
        const duration = await live.getDuration()
        setTiming({ position, duration })
      }, SEEK_INTERVAL)
    }, [live, setTiming])

    // Clean up
    useEffect(() => {
      return () => {
        if (seekInterval.current) clearInterval(seekInterval.current)
      }
    }, [seekInterval])

    // The play counter changes (same song again or new song)
    useEffect(() => {
      if (playCounter !== prevPlayCounter) {
        setPrevPlayCounter(playCounter)
        setTiming({ position: 0, duration: timing.duration })
        setMediaKey((mediaKey) => mediaKey + 1)
        startSeeking()
      }
    }, [
      playCounter,
      prevPlayCounter,
      startSeeking,
      timing,
      setTiming,
      setMediaKey
    ])

    const record = useRecord()

    let displayInfo
    if (agreement) {
      displayInfo = agreement
    } else {
      displayInfo = {
        title: collectible?.name as string,
        agreement_id: collectible?.id as string,
        owner_id: user?.user_id,
        _cover_art_sizes: {
          [SquareSizes.SIZE_480_BY_480]:
            collectible?.imageUrl ??
            collectible?.frameUrl ??
            collectible?.gifUrl ??
            ''
        },
        has_current_user_saved: false,
        has_current_user_reposted: false,
        _co_sign: null
      }
    }
    const {
      title,
      agreement_id,
      owner_id,
      _cover_art_sizes,
      has_current_user_saved,
      has_current_user_reposted,
      _co_sign
    } = displayInfo

    const { name, handle } = user
    const image =
      useAgreementCoverArt(
        agreement_id,
        _cover_art_sizes,
        SquareSizes.SIZE_480_BY_480
      ) || _cover_art_sizes[SquareSizes.SIZE_480_BY_480]

    let playButtonStatus
    if (isBuffering) {
      playButtonStatus = PlayButtonStatus.LOAD
    } else if (isPlaying) {
      playButtonStatus = PlayButtonStatus.PAUSE
    } else {
      playButtonStatus = PlayButtonStatus.PLAY
    }

    const togglePlay = () => {
      const message = new HapticFeedbackMessage()
      message.send()
      if (isPlaying) {
        pause()
        record(
          make(Name.PLAYBACK_PAUSE, {
            id: `${agreement_id}`,
            source: PlaybackSource.NOW_PLAYING
          })
        )
      } else {
        play()
        record(
          make(Name.PLAYBACK_PLAY, {
            id: `${agreement_id}`,
            source: PlaybackSource.NOW_PLAYING
          })
        )
      }
    }

    const toggleFavorite = useCallback(() => {
      if (agreement && agreement_id && typeof agreement_id !== 'string') {
        has_current_user_saved ? unsave(agreement_id) : save(agreement_id)
      }
    }, [agreement, agreement_id, has_current_user_saved, unsave, save])

    const toggleRepost = useCallback(() => {
      if (agreement && agreement_id && typeof agreement_id !== 'string') {
        has_current_user_reposted ? undoRepost(agreement_id) : repost(agreement_id)
      }
    }, [agreement, agreement_id, has_current_user_reposted, undoRepost, repost])

    const onShare = useCallback(() => {
      if (agreement && agreement_id && typeof agreement_id !== 'string') share(agreement_id)
    }, [share, agreement, agreement_id])

    const goToAgreementPage = () => {
      onClose()
      if (agreement) {
        goToRoute(agreement.permalink)
      } else {
        goToRoute(collectibleDetailsPage(user.handle, collectible?.id ?? ''))
      }
    }

    const goToProfilePage = () => {
      onClose()
      goToRoute(profilePage(handle))
    }

    const onClickOverflow = useCallback(() => {
      const isOwner = currentUserId === owner_id

      const overflowActions = [
        !collectible && !isOwner
          ? has_current_user_reposted
            ? OverflowAction.UNREPOST
            : OverflowAction.REPOST
          : null,
        !collectible && !isOwner
          ? has_current_user_saved
            ? OverflowAction.UNFAVORITE
            : OverflowAction.FAVORITE
          : null,
        !collectible ? OverflowAction.ADD_TO_CONTENT_LIST : null,
        agreement && OverflowAction.VIEW_AGREEMENT_PAGE,
        collectible && OverflowAction.VIEW_COLLECTIBLE_PAGE,
        OverflowAction.VIEW_LANDLORD_PAGE
      ].filter(Boolean) as OverflowAction[]

      const overflowCallbacks = {
        [OverflowAction.VIEW_AGREEMENT_PAGE]: onClose,
        [OverflowAction.VIEW_COLLECTIBLE_PAGE]: onClose,
        [OverflowAction.VIEW_LANDLORD_PAGE]: onClose
      }

      clickOverflow(agreement_id, overflowActions, overflowCallbacks)
    }, [
      currentUserId,
      owner_id,
      collectible,
      has_current_user_reposted,
      has_current_user_saved,
      agreement,
      onClose,
      clickOverflow,
      agreement_id
    ])

    const onPrevious = () => {
      if (agreement?.genre === Genre.PODCASTS) {
        const position = timing.position
        const newPosition = position - SKIP_DURATION_SEC
        seek(Math.max(0, newPosition))
        // Update mediakey so scrubber updates
        setTiming({ position: newPosition, duration: timing.duration })
        setMediaKey((mediaKey) => mediaKey + 1)
      } else {
        const shouldGoToPrevious = timing.position < RESTART_THRESHOLD_SEC
        if (shouldGoToPrevious) {
          previous()
        } else {
          reset(true /* shouldAutoplay */)
        }
      }
    }

    const onNext = () => {
      if (agreement?.genre === Genre.PODCASTS) {
        const newPosition = timing.position + SKIP_DURATION_SEC
        seek(Math.min(newPosition, timing.duration))
        // Update mediakey so scrubber updates
        setTiming({ position: newPosition, duration: timing.duration })
        setMediaKey((mediaKey) => mediaKey + 1)
      } else {
        next()
      }
    }

    const dominantColor = dominantColors ? dominantColors[0] : null
    const artworkAverageColor = dominantColor
      ? {
          boxShadow: `0 1px 15px -5px rgba(
          ${dominantColor.r},
          ${dominantColor.g},
          ${dominantColor.b}
          , 1)`
        }
      : {}

    const matrix = isMatrix()
    const darkMode = isDarkMode()

    return (
      <div
        className={cn(styles.nowPlaying, {
          [styles.native]: NATIVE_MOBILE
        })}
      >
        <div className={styles.header}>
          <div className={styles.caretContainer} onClick={onClose}>
            <IconCaret className={styles.iconCaret} />
          </div>
          <div className={styles.titleContainer}>{messages.nowPlaying}</div>
        </div>
        {_co_sign ? (
          <CoSign
            className={styles.artwork}
            size={Size.XLARGE}
            hasFavorited={_co_sign.has_remix_author_saved}
            hasReposted={_co_sign.has_remix_author_reposted}
            coSignName={_co_sign.user.name}
            forwardRef={artworkRef}
            userId={_co_sign.user.user_id}
          >
            <div
              className={styles.image}
              onClick={goToAgreementPage}
              style={artworkAverageColor}
            >
              <DynamicImage image={image} />
            </div>
          </CoSign>
        ) : (
          <div
            className={cn(styles.artwork, styles.image)}
            onClick={goToAgreementPage}
            ref={artworkRef}
            style={artworkAverageColor}
          >
            <DynamicImage image={image} />
          </div>
        )}
        <div className={styles.info}>
          <div className={styles.title} onClick={goToAgreementPage}>
            {title}
          </div>
          <div className={styles.landlord} onClick={goToProfilePage}>
            {name}
            <UserBadges
              userId={owner_id}
              badgeSize={16}
              className={styles.verified}
            />
          </div>
        </div>
        <div className={styles.timeControls}>
          <Scrubber
            // Include the duration in the media key because the play counter can
            // potentially update before the duration coming from the native layer if present
            mediaKey={`${uid}${mediaKey}${timing.duration}`}
            isPlaying={isPlaying && !isBuffering}
            isDisabled={!uid && !collectible}
            isMobile
            elapsedSeconds={timing.position}
            totalSeconds={timing.duration}
            includeTimestamps
            onScrubRelease={seek}
            style={{
              railListenedColor: 'var(--agreement-slider-rail)',
              handleColor: 'var(--agreement-slider-handle)'
            }}
          />
        </div>
        <div className={styles.controls}>
          <div className={styles.repeatButton}>
            <RepeatButtonProvider
              isMobile
              isMatrix={matrix}
              darkMode={darkMode}
              onRepeatOff={() => repeat(RepeatMode.OFF)}
              onRepeatAll={() => repeat(RepeatMode.ALL)}
              onRepeatSingle={() => repeat(RepeatMode.SINGLE)}
            />
          </div>
          <div className={styles.previousButton}>
            <PreviousButtonProvider isMobile onClick={onPrevious} />
          </div>
          <div className={styles.playButton}>
            <PlayButton
              playable
              status={playButtonStatus}
              onClick={togglePlay}
            />
          </div>
          <div className={styles.nextButton}>
            <NextButtonProvider isMobile onClick={onNext} />
          </div>
          <div className={styles.shuffleButton}>
            <ShuffleButtonProvider
              isMobile
              darkMode={darkMode}
              isMatrix={matrix}
              onShuffleOn={() => shuffle(true)}
              onShuffleOff={() => shuffle(false)}
            />
          </div>
        </div>
        <div className={styles.actions}>
          <ActionsBar
            castMethod={castMethod}
            isOwner={currentUserId === owner_id}
            hasReposted={has_current_user_reposted}
            hasFavorited={has_current_user_saved}
            isCasting={isCasting}
            isCollectible={!!collectible}
            onToggleRepost={toggleRepost}
            onToggleFavorite={toggleFavorite}
            onShare={onShare}
            onClickOverflow={onClickOverflow}
            isDarkMode={isDarkMode()}
            isMatrixMode={matrix}
          />
        </div>
      </div>
    )
  }
)

function makeMapStateToProps() {
  const getCurrentQueueItem = makeGetCurrent()

  const mapStateToProps = (state: AppState) => {
    const currentQueueItem = getCurrentQueueItem(state)
    return {
      currentQueueItem,
      currentUserId: getUserId(state),
      playCounter: getCounter(state),
      live: getAudio(state),
      isPlaying: getPlaying(state),
      isBuffering: getBuffering(state),
      isCasting: getIsCasting(state),
      castMethod: getMethod(state),
      dominantColors: getDominantColorsByAgreement(state, {
        agreement: currentQueueItem.agreement
      })
    }
  }
  return mapStateToProps
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    play: () => {
      dispatch(play({}))
    },
    pause: () => {
      dispatch(pause({}))
    },
    next: () => {
      dispatch(next({ skip: true }))
    },
    previous: () => {
      dispatch(previous({}))
    },
    reset: (shouldAutoplay: boolean) => {
      dispatch(reset({ shouldAutoplay }))
    },
    seek: (position: number) => {
      dispatch(seek({ seconds: position }))
    },
    repeat: (mode: RepeatMode) => {
      dispatch(repeat({ mode }))
    },
    shuffle: (enable: boolean) => {
      dispatch(shuffle({ enable }))
    },
    share: (agreementId: ID) =>
      dispatch(
        requestOpenShareModal({
          type: 'agreement',
          agreementId,
          source: ShareSource.NOW_PLAYING
        })
      ),
    save: (agreementId: ID) =>
      dispatch(saveAgreement(agreementId, FavoriteSource.NOW_PLAYING)),
    unsave: (agreementId: ID) =>
      dispatch(unsaveAgreement(agreementId, FavoriteSource.NOW_PLAYING)),
    repost: (agreementId: ID) =>
      dispatch(repostAgreement(agreementId, RepostSource.NOW_PLAYING)),
    undoRepost: (agreementId: ID) =>
      dispatch(undoRepostAgreement(agreementId, RepostSource.NOW_PLAYING)),
    clickOverflow: (
      agreementId: ID | string,
      overflowActions: OverflowAction[],
      callbacks: OverflowActionCallbacks
    ) =>
      dispatch(
        open({
          source: OverflowSource.AGREEMENTS,
          id: agreementId,
          overflowActions,
          overflowActionCallbacks: callbacks
        })
      ),
    goToRoute: (route: string) => dispatch(pushRoute(route))
  }
}

export default connect(makeMapStateToProps, mapDispatchToProps)(NowPlaying)