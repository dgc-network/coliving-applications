import { useCallback, useEffect, useRef, useState } from 'react'

import { getDigitalContent } from '@coliving/web/src/common/store/cache/digital_contents/selectors'
import { getUser } from '@coliving/web/src/common/store/cache/users/selectors'
import { next, previous } from '@coliving/web/src/common/store/queue/slice'
import { Genre } from '@coliving/web/src/common/utils/genres'
import type {
  Animated,
  GestureResponderEvent,
  PanResponderGestureState
} from 'react-native'
import { View, StatusBar, Pressable } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useDispatch, useSelector } from 'react-redux'

import { BOTTOM_BAR_HEIGHT } from 'app/components/bottomTabBar'
import Drawer, {
  DrawerAnimationStyle,
  FULL_DRAWER_HEIGHT
} from 'app/components/drawer'
import { Scrubber } from 'app/components/scrubber'
import { useAndroidNavigationBarHeight } from 'app/hooks/useAndroidNavigationBarHeight'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useDrawer } from 'app/hooks/useDrawer'
import { useNavigation } from 'app/hooks/useNavigation'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { SEEK, seek } from 'app/store/digitalcoin/actions'
import {
  getPlaying,
  getDigitalContent as getNativeDigitalContent
} from 'app/store/digitalcoin/selectors'
import { makeStyles } from 'app/styles'

import { ActionsBar } from './actionsBar'
import { Artwork } from './artwork'
import { AudioControls } from './audioControls'
import { Logo } from './logo'
import { PlayBar } from './playBar'
import { TitleBar } from './titleBar'
import { DigitalContentInfo } from './DigitalContentInfo'
import { PLAY_BAR_HEIGHT } from './constants'

const STATUS_BAR_FADE_CUTOFF = 0.6
const SKIP_DURATION_SEC = 15
// If the top screen inset is greater than this,
// the status bar will be hidden when the drawer is open
const INSET_STATUS_BAR_HIDE_THRESHOLD = 20

const useStyles = makeStyles(({ spacing }) => ({
  container: {
    paddingTop: 0,
    height: FULL_DRAWER_HEIGHT,
    justifyContent: 'space-evenly'
  },
  playBarContainer: {
    position: 'absolute',
    width: '100%',
    top: 0
  },
  controlsContainer: {
    marginHorizontal: spacing(6),
    marginBottom: spacing(6)
  },
  titleBarContainer: {
    marginBottom: spacing(4)
  },
  artworkContainer: {
    flexShrink: 1,
    marginBottom: spacing(5)
  },
  digitalContentInfoContainer: {
    marginHorizontal: spacing(6),
    marginBottom: spacing(3)
  },
  scrubberContainer: {
    marginHorizontal: spacing(6)
  }
}))

type NowPlayingDrawerProps = {
  translationAnim: Animated.Value
}

const NowPlayingDrawer = ({ translationAnim }: NowPlayingDrawerProps) => {
  const dispatch = useDispatch()
  const dispatchWeb = useDispatchWeb()
  const insets = useSafeAreaInsets()
  const androidNavigationBarHeight = useAndroidNavigationBarHeight()
  const staticTopInset = useRef(insets.top)
  const bottomBarHeight = BOTTOM_BAR_HEIGHT + insets.bottom
  const styles = useStyles()
  const navigation = useNavigation()

  const { isOpen, onOpen, onClose } = useDrawer('NowPlaying')
  const isPlaying = useSelector(getPlaying)
  const [isPlayBarShowing, setIsPlayBarShowing] = useState(false)

  // When digitalcoin starts playing, open the playbar to the initial offset
  useEffect(() => {
    if (isPlaying && !isPlayBarShowing) {
      setIsPlayBarShowing(true)
    }
  }, [isPlaying, isPlayBarShowing])

  const handleDrawerCloseFromSwipe = useCallback(() => {
    onClose()
  }, [onClose])

  const onDrawerOpen = useCallback(() => {
    onOpen()
  }, [onOpen])

  const drawerPercentOpen = useRef(0)
  const onDrawerPercentOpen = useCallback(
    (percentOpen: number) => {
      drawerPercentOpen.current = percentOpen
    },
    [drawerPercentOpen]
  )

  useEffect(() => {
    // The top inset can be 0 initially
    // Need to get the actual value but preserve it when the
    // status bar is hidden
    if (staticTopInset.current === 0 && insets.top > 0) {
      staticTopInset.current = insets.top
    }
  }, [staticTopInset, insets.top])

  useEffect(() => {
    if (staticTopInset.current > INSET_STATUS_BAR_HIDE_THRESHOLD) {
      if (isOpen) {
        StatusBar.setHidden(true, 'fade')
      } else {
        StatusBar.setHidden(false, 'fade')
      }
    }
  }, [isOpen])

  // Attach to the pan responder of the drawer so that we can animate away
  // the status bar
  const onPanResponderMove = useCallback(
    (e: GestureResponderEvent, gestureState: PanResponderGestureState) => {
      // Do not hide the status bar for smaller insets
      // This is to prevent layout shift which breaks the animation
      if (staticTopInset.current > INSET_STATUS_BAR_HIDE_THRESHOLD) {
        if (gestureState.vy > 0) {
          // Dragging downwards
          if (drawerPercentOpen.current < STATUS_BAR_FADE_CUTOFF) {
            StatusBar.setHidden(false, 'fade')
          }
        } else if (gestureState.vy < 0) {
          // Dragging upwards
          if (drawerPercentOpen.current > STATUS_BAR_FADE_CUTOFF) {
            StatusBar.setHidden(true, 'fade')
          }
        }
      }
    },
    [drawerPercentOpen]
  )

  const [isGestureEnabled, setIsGestureEnabled] = useState(true)

  // TODO: As we move away from the digitalcoin store slice in mobile-client
  // in favor of player/queue selectors in common, getNativeDigitalContent calls
  // should be replaced
  const digitalContentInfo = useSelector(getNativeDigitalContent)
  const digital_content = useSelectorWeb((state) =>
    getDigitalContent(state, digitalContentInfo ? { id: digitalContentInfo.digitalContentId } : {})
  )
  const user = useSelectorWeb((state) =>
    getUser(state, digital_content ? { id: digital_content.owner_id } : {})
  )

  const digitalContentId = digitalContentInfo?.digitalContentId
  const [mediaKey, setMediaKey] = useState(0)
  useEffect(() => {
    setMediaKey((mediaKey) => mediaKey + 1)
  }, [digitalContentId])

  const onNext = useCallback(() => {
    if (digital_content?.genre === Genre.PODCASTS) {
      if (global.progress) {
        const { currentTime } = global.progress
        const newPosition = currentTime + SKIP_DURATION_SEC
        dispatch(
          seek({ type: SEEK, seconds: Math.min(digital_content.duration, newPosition) })
        )
      }
    } else {
      dispatchWeb(next({ skip: true }))
      setMediaKey((mediaKey) => mediaKey + 1)
    }
  }, [dispatch, dispatchWeb, setMediaKey, digital_content])

  const onPrevious = useCallback(() => {
    if (digital_content?.genre === Genre.PODCASTS) {
      if (global.progress) {
        const { currentTime } = global.progress
        const newPosition = currentTime - SKIP_DURATION_SEC
        dispatch(seek({ type: SEEK, seconds: Math.max(0, newPosition) }))
      }
    } else {
      dispatchWeb(previous({}))
      setMediaKey((mediaKey) => mediaKey + 1)
    }
  }, [dispatch, dispatchWeb, setMediaKey, digital_content])

  const onPressScrubberIn = useCallback(() => {
    setIsGestureEnabled(false)
  }, [setIsGestureEnabled])

  const onPressScrubberOut = useCallback(() => {
    setIsGestureEnabled(true)
  }, [setIsGestureEnabled])

  const handlePressLandlord = useCallback(() => {
    if (!user) {
      return
    }
    navigation.push({
      native: { screen: 'Profile', params: { handle: user.handle } },
      web: { route: `/${user.handle}` }
    })
    handleDrawerCloseFromSwipe()
  }, [handleDrawerCloseFromSwipe, navigation, user])

  const handlePressTitle = useCallback(() => {
    if (!digital_content) {
      return
    }
    navigation.push({
      native: { screen: 'DigitalContent', params: { id: digital_content.digital_content_id } },
      web: { route: digital_content.permalink }
    })
    handleDrawerCloseFromSwipe()
  }, [handleDrawerCloseFromSwipe, navigation, digital_content])

  return (
    <Drawer
      // Appears below bottom bar whereas normally drawers appear above
      zIndex={3}
      isOpen={isOpen}
      onClose={handleDrawerCloseFromSwipe}
      onOpen={onDrawerOpen}
      initialOffsetPosition={
        bottomBarHeight + PLAY_BAR_HEIGHT + androidNavigationBarHeight
      }
      shouldCloseToInitialOffset={isPlayBarShowing}
      animationStyle={DrawerAnimationStyle.SPRINGY}
      shouldBackgroundDim={false}
      shouldAnimateShadow={false}
      drawerStyle={{ overflow: 'visible' }}
      onPercentOpen={onDrawerPercentOpen}
      onPanResponderMove={onPanResponderMove}
      isGestureSupported={isGestureEnabled}
      translationAnim={translationAnim}
      // Disable safe area view edges because they are handled manually
      disableSafeAreaView
    >
      <View
        style={[
          styles.container,
          { paddingTop: staticTopInset.current, paddingBottom: insets.bottom }
        ]}
      >
        {digital_content && user && (
          <>
            <View style={styles.playBarContainer}>
              <PlayBar
                digital_content={digital_content}
                user={user}
                onPress={onDrawerOpen}
                translationAnim={translationAnim}
              />
            </View>
            <Logo translationAnim={translationAnim} />
            <View style={styles.titleBarContainer}>
              <TitleBar onClose={handleDrawerCloseFromSwipe} />
            </View>
            <Pressable
              onPress={handlePressTitle}
              style={styles.artworkContainer}
            >
              <Artwork digital_content={digital_content} />
            </Pressable>
            <View style={styles.digitalContentInfoContainer}>
              <DigitalContentInfo
                onPressLandlord={handlePressLandlord}
                onPressTitle={handlePressTitle}
                digital_content={digital_content}
                user={user}
              />
            </View>
            <View style={styles.scrubberContainer}>
              <Scrubber
                mediaKey={`${mediaKey}`}
                isPlaying={isPlaying}
                onPressIn={onPressScrubberIn}
                onPressOut={onPressScrubberOut}
                duration={digital_content.duration}
              />
            </View>
            <View style={styles.controlsContainer}>
              <AudioControls
                onNext={onNext}
                onPrevious={onPrevious}
                isPodcast={digital_content.genre === Genre.PODCASTS}
              />
              <ActionsBar digital_content={digital_content} />
            </View>
          </>
        )}
      </View>
    </Drawer>
  )
}

export default NowPlayingDrawer
