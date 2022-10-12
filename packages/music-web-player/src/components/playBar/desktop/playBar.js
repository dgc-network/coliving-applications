import { Component } from 'react'

import {
  RepostSource,
  FavoriteSource,
  Name,
  PlaybackSource
} from '@coliving/common'
import { Scrubber } from '@coliving/stems'
import { push as pushRoute } from 'connected-react-router'
import { connect } from 'react-redux'

import { getAccountUser, getUserId } from 'common/store/account/selectors'
import { getLineupHasDigitalContents } from 'common/store/lineup/selectors'
import { makeGetCurrent } from 'common/store/queue/selectors'
import {
  play,
  pause,
  next,
  previous,
  repeat,
  shuffle
} from 'common/store/queue/slice'
import { RepeatMode } from 'common/store/queue/types'
import {
  repostDigitalContent,
  undoRepostDigitalContent,
  saveDigitalContent,
  unsaveDigitalContent
} from 'common/store/social/digital_contents/actions'
import { getTheme } from 'common/store/ui/theme/selectors'
import { Genre } from 'common/utils/genres'
import FavoriteButton from 'components/altButton/favoriteButton'
import RepostButton from 'components/altButton/repostButton'
import PlayButton from 'components/playBar/playButton'
import VolumeBar from 'components/playBar/volumeBar'
import NextButtonProvider from 'components/playBar/nextButton/nextButtonProvider'
import PreviousButtonProvider from 'components/playBar/previousButton/previousButtonProvider'
import RepeatButtonProvider from 'components/playBar/repeatButton/repeatButtonProvider'
import ShuffleButtonProvider from 'components/playBar/shuffleButton/shuffleButtonProvider'
import Tooltip from 'components/tooltip/tooltip'
import { make } from 'store/analytics/actions'
import { getLineupSelectorForRoute } from 'store/lineup/lineupForRoute'
import {
  getAudio,
  getCollectible,
  getPlaying,
  getCounter,
  getUid as getPlayingUid,
  getBuffering
} from 'store/player/selectors'
import { seek, reset } from 'store/player/slice'
import { setupHotkeys } from 'utils/hotkeyUtil'
import { collectibleDetailsPage, profilePage } from 'utils/route'
import { isMatrix, shouldShowDark } from 'utils/theme/theme'

import styles from './PlayBar.module.css'
import PlayingDigitalContentInfo from './components/PlayingDigitalContentInfo'

const VOLUME_GRANULARITY = 100.0
const SEEK_INTERVAL = 200
const RESTART_THRESHOLD_SEC = 3
const SKIP_DURATION_SEC = 15

const messages = {
  favorite: 'Favorite',
  unfavorite: 'Unfavorite',
  reposted: 'Reposted',
  repost: 'Repost'
}

class PlayBar extends Component {
  constructor(props) {
    super(props)

    // State used to manage time on left of playbar.
    this.state = {
      seeking: false,
      digitalContentPosition: 0,
      playCounter: null,
      digitalContentId: null,
      // Capture intent to set initial volume before digitalcoin is playing
      initialVolume: null,
      mediaKey: 0
    }
    this.seekInterval = null
  }

  componentDidMount() {
    setupHotkeys(
      {
        32 /* space */: this.togglePlay,
        37 /* left arrow */: this.onPrevious,
        39 /* right arrow */: this.props.next
      },
      /* throttle= */ 200
    )
  }

  componentDidUpdate(prevProps) {
    const { digitalcoin, isPlaying, playCounter } = this.props
    if (!isPlaying) {
      clearInterval(this.seekInterval)
      this.seekInterval = null
    }

    if (isPlaying && !this.seekInterval) {
      this.seekInterval = setInterval(() => {
        const digitalContentPosition = digitalcoin.getPosition()
        this.setState({ digitalContentPosition })
      }, SEEK_INTERVAL)
    }

    if (playCounter !== this.state.playCounter) {
      this.setState({
        mediaKey: this.state.mediaKey + 1,
        playCounter,
        digitalContentPosition: 0,
        listenRecorded: false
      })
    }

    // If there was an intent to set initial volume and digitalcoin is defined
    // set the initial volume
    if (this.state.initialVolume !== null && digitalcoin) {
      digitalcoin.setVolume(this.state.initialVolume)
      this.setState({
        initialVolume: null
      })
    }
  }

  componentWillUnmount() {
    clearInterval(this.seekInterval)
  }

  goToDigitalContentPage = () => {
    const {
      currentQueueItem: { digital_content, user },
      collectible,
      goToRoute
    } = this.props

    if (digital_content && user) {
      goToRoute(digital_content.permalink)
    } else if (collectible && user) {
      goToRoute(collectibleDetailsPage(user.handle, collectible.id))
    }
  }

  goToLandlordPage = () => {
    const {
      currentQueueItem: { user },
      goToRoute
    } = this.props

    if (user) {
      goToRoute(profilePage(user.handle))
    }
  }

  togglePlay = () => {
    const {
      currentQueueItem: { digital_content },
      digitalcoin,
      isPlaying,
      play,
      pause,
      record
    } = this.props

    if (digitalcoin && isPlaying) {
      pause()
      record(
        make(Name.PLAYBACK_PAUSE, {
          id: digital_content ? digital_content.digital_content_id : null,
          source: PlaybackSource.PLAYBAR
        })
      )
    } else if (this.playable()) {
      play()
      record(
        make(Name.PLAYBACK_PLAY, {
          id: digital_content ? digital_content.digital_content_id : null,
          source: PlaybackSource.PLAYBAR
        })
      )
    }
  }

  onToggleFavorite = (favorited, digitalContentId) => {
    if (digitalContentId) {
      favorited
        ? this.props.unsaveDigitalContent(digitalContentId)
        : this.props.saveDigitalContent(digitalContentId)
    }
  }

  onToggleRepost = (reposted, digitalContentId) => {
    if (digitalContentId) {
      reposted
        ? this.props.undoRepostDigitalContent(digitalContentId)
        : this.props.repostDigitalContent(digitalContentId)
    }
  }

  updateVolume = (volume) => {
    const { digitalcoin } = this.props
    if (digitalcoin) {
      // If we already have an digitalcoin object set the volume immediately!
      digitalcoin.setVolume(volume / VOLUME_GRANULARITY)
    } else {
      // Store volume in the state so that when digitalcoin does mount we can set it
      this.setState({
        initialVolume: volume / VOLUME_GRANULARITY
      })
    }
  }

  repeatAll = () => {
    this.props.repeat(RepeatMode.ALL)
  }

  repeatSingle = () => {
    this.props.repeat(RepeatMode.SINGLE)
  }

  repeatOff = () => {
    this.props.repeat(RepeatMode.OFF)
  }

  shuffleOn = () => {
    this.props.shuffle(true)
  }

  shuffleOff = () => {
    this.props.shuffle(false)
  }

  onPrevious = () => {
    const {
      digitalcoin,
      seek,
      previous,
      reset,
      currentQueueItem: { digital_content }
    } = this.props
    if (digital_content?.genre === Genre.PODCASTS) {
      const position = digitalcoin.getPosition()
      const newPosition = position - SKIP_DURATION_SEC
      seek(Math.max(0, newPosition))
      this.setState({
        mediaKey: this.state.mediaKey + 1
      })
    } else {
      const shouldGoToPrevious =
        this.state.digitalContentPosition < RESTART_THRESHOLD_SEC
      if (shouldGoToPrevious) {
        previous()
      } else {
        reset(true /* shouldAutoplay */)
      }
    }
  }

  onNext = () => {
    const {
      digitalcoin,
      seek,
      next,
      currentQueueItem: { digital_content }
    } = this.props
    if (digital_content?.genre === Genre.PODCASTS) {
      const duration = digitalcoin.getDuration()
      const position = digitalcoin.getPosition()
      const newPosition = position + SKIP_DURATION_SEC
      seek(Math.min(newPosition, duration))
      this.setState({
        mediaKey: this.state.mediaKey + 1
      })
    } else {
      next()
    }
  }

  playable = () =>
    !!this.props.currentQueueItem.uid ||
    this.props.lineupHasDigitalContents ||
    this.props.collectible

  render() {
    const {
      currentQueueItem: { uid, digital_content, user },
      digitalcoin,
      collectible,
      isPlaying,
      isBuffering,
      userId,
      theme
    } = this.props
    const { mediaKey } = this.state

    let digitalContentTitle = ''
    let landlordName = ''
    let landlordHandle = ''
    let landlordUserId = null
    let isVerified = false
    let profilePictureSizes = null
    let digitalContentId = null
    let duration = null
    let reposted = false
    let favorited = false
    let isOwner = false
    let isDigitalContentUnlisted = false
    let digitalContentPermalink = ''

    if (uid && digital_content && user) {
      digitalContentTitle = digital_content.title
      landlordName = user.name
      landlordHandle = user.handle
      landlordUserId = user.user_id
      isVerified = user.is_verified
      profilePictureSizes = user._profile_picture_sizes
      isOwner = digital_content.owner_id === userId
      digitalContentPermalink = digital_content.permalink

      duration = digitalcoin.getDuration()
      digitalContentId = digital_content.digital_content_id
      reposted = digital_content.has_current_user_reposted
      favorited = digital_content.has_current_user_saved || false
      isDigitalContentUnlisted = digital_content.is_unlisted
    } else if (collectible && user) {
      // Special case for digitalcoin nft contentList
      digitalContentTitle = collectible.name
      landlordName = user.name
      landlordHandle = user.handle
      landlordUserId = user.user_id
      isVerified = user.is_verified
      profilePictureSizes = user._profile_picture_sizes
      isOwner = this.props.accountUser?.user_id === user.user_id
      duration = digitalcoin.getDuration()

      reposted = false
      favorited = false
    }

    let playButtonStatus
    if (isBuffering) {
      playButtonStatus = 'load'
    } else if (isPlaying) {
      playButtonStatus = 'pause'
    } else {
      playButtonStatus = 'play'
    }

    const isFavoriteAndRepostDisabled = !uid || isOwner
    const favoriteText = favorited ? messages.unfavorite : messages.favorite
    const repostText = reposted ? messages.reposted : messages.repost
    const matrix = isMatrix()

    return (
      <div className={styles.playBar}>
        <div className={styles.playBarContentWrapper}>
          <div className={styles.playBarPlayingInfo}>
            <PlayingDigitalContentInfo
              profilePictureSizes={profilePictureSizes}
              digitalContentId={digitalContentId}
              isOwner={isOwner}
              digitalContentTitle={digitalContentTitle}
              digitalContentPermalink={digitalContentPermalink}
              landlordName={landlordName}
              landlordHandle={landlordHandle}
              landlordUserId={landlordUserId}
              isVerified={isVerified}
              isDigitalContentUnlisted={isDigitalContentUnlisted}
              onClickDigitalContentTitle={this.goToDigitalContentPage}
              onClickLandlordName={this.goToLandlordPage}
              hasShadow={false}
            />
          </div>

          <div className={styles.playBarControls}>
            <div className={styles.timeControls}>
              <Scrubber
                mediaKey={`${uid}${mediaKey}`}
                isPlaying={isPlaying && !isBuffering}
                isDisabled={!uid && !collectible}
                includeTimestamps
                elapsedSeconds={digitalcoin?.getPosition()}
                totalSeconds={duration}
                style={{
                  railListenedColor: 'var(--digital-content-slider-rail)',
                  handleColor: 'var(--digital-content-slider-handle)'
                }}
                onScrubRelease={this.props.seek}
              />
            </div>

            <div className={styles.buttonControls}>
              <div className={styles.shuffleButton}>
                <ShuffleButtonProvider
                  isMatrix={matrix}
                  darkMode={shouldShowDark(theme)}
                  onShuffleOn={this.shuffleOn}
                  onShuffleOff={this.shuffleOff}
                />
              </div>
              <div className={styles.previousButton}>
                <PreviousButtonProvider onClick={this.onPrevious} />
              </div>
              <div className={styles.playButton}>
                <PlayButton
                  playable={this.playable()}
                  status={playButtonStatus}
                  onClick={this.togglePlay}
                />
              </div>
              <div className={styles.nextButton}>
                <NextButtonProvider onClick={this.onNext} />
              </div>
              <div className={styles.repeatButton}>
                <RepeatButtonProvider
                  isMatrix={matrix}
                  darkMode={shouldShowDark(theme)}
                  onRepeatOff={this.repeatOff}
                  onRepeatAll={this.repeatAll}
                  onRepeatSingle={this.repeatSingle}
                />
              </div>
            </div>
          </div>

          <div className={styles.optionsRight}>
            <VolumeBar
              defaultValue={100}
              granularity={VOLUME_GRANULARITY}
              onChange={this.updateVolume}
            />
            <div className={styles.toggleRepostContainer}>
              <Tooltip
                text={repostText}
                disabled={isFavoriteAndRepostDisabled}
                mount='parent'
                placement='top'
              >
                <span>
                  <RepostButton
                    aria-label={repostText}
                    onClick={() => this.onToggleRepost(reposted, digitalContentId)}
                    isActive={reposted}
                    isDisabled={isFavoriteAndRepostDisabled}
                    isDarkMode={shouldShowDark(theme)}
                    isMatrixMode={matrix}
                  />
                </span>
              </Tooltip>
            </div>

            <div className={styles.toggleFavoriteContainer}>
              <Tooltip
                text={favoriteText}
                disabled={isFavoriteAndRepostDisabled}
                placement='top'
                mount='parent'
              >
                <span>
                  <FavoriteButton
                    isDisabled={isFavoriteAndRepostDisabled}
                    isMatrixMode={matrix}
                    isActive={favorited}
                    isDarkMode={shouldShowDark(theme)}
                    onClick={() => this.onToggleFavorite(favorited, digitalContentId)}
                  />
                </span>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

const makeMapStateToProps = () => {
  const getCurrentQueueItem = makeGetCurrent()

  const mapStateToProps = (state, props) => ({
    accountUser: getAccountUser(state),
    currentQueueItem: getCurrentQueueItem(state),
    playCounter: getCounter(state),
    digitalcoin: getAudio(state),
    collectible: getCollectible(state),
    isPlaying: getPlaying(state),
    isBuffering: getBuffering(state),
    playingUid: getPlayingUid(state),
    lineupHasDigitalContents: getLineupHasDigitalContents(
      getLineupSelectorForRoute(state),
      state
    ),
    userId: getUserId(state),
    theme: getTheme(state)
  })
  return mapStateToProps
}

const mapDispatchToProps = (dispatch) => ({
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
  reset: (shouldAutoplay) => {
    dispatch(reset({ shouldAutoplay }))
  },
  seek: (position) => {
    dispatch(seek({ seconds: position }))
  },
  repeat: (mode) => {
    dispatch(repeat({ mode }))
  },
  shuffle: (enable) => {
    dispatch(shuffle({ enable }))
  },
  repostDigitalContent: (digitalContentId) =>
    dispatch(repostDigitalContent(digitalContentId, RepostSource.PLAYBAR)),
  undoRepostDigitalContent: (digitalContentId) =>
    dispatch(undoRepostDigitalContent(digitalContentId, RepostSource.PLAYBAR)),
  saveDigitalContent: (digitalContentId) => dispatch(saveDigitalContent(digitalContentId, FavoriteSource.PLAYBAR)),
  unsaveDigitalContent: (digitalContentId) =>
    dispatch(unsaveDigitalContent(digitalContentId, FavoriteSource.PLAYBAR)),
  goToRoute: (route) => dispatch(pushRoute(route)),
  record: (event) => dispatch(event)
})

export default connect(makeMapStateToProps, mapDispatchToProps)(PlayBar)
