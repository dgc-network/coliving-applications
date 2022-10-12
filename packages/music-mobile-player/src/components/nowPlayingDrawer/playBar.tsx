import { useCallback } from 'react'

import type { DigitalContent, User } from '@coliving/common'
import { FavoriteSource, SquareSizes } from '@coliving/common'
import {
  saveDigitalContent,
  unsaveDigitalContent
} from '@coliving/web/src/common/store/social/digital_contents/actions'
import { TouchableOpacity, Animated, View, Dimensions } from 'react-native'

import { DynamicImage } from 'app/components/core'
import { FavoriteButton } from 'app/components/favoriteButton'
import Text from 'app/components/text'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useDigitalContentCoverArt } from 'app/hooks/useDigitalContentCoverArt'
import { makeStyles } from 'app/styles'

import { PlayButton } from './playButton'
import { TrackingBar } from './trackingBar'
import { NOW_PLAYING_HEIGHT, PLAY_BAR_HEIGHT } from './constants'

const useStyles = makeStyles(({ palette, spacing }) => ({
  root: {
    width: '100%',
    height: PLAY_BAR_HEIGHT,
    alignItems: 'center'
  },
  container: {
    height: '100%',
    width: '100%',
    paddingLeft: spacing(3),
    paddingRight: spacing(3),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start'
  },
  playIcon: {
    width: spacing(8),
    height: spacing(8)
  },
  icon: {
    width: 28,
    height: 28
  },
  digitalContentInfo: {
    height: '100%',
    flexShrink: 1,
    flexGrow: 1,
    alignItems: 'center',
    flexDirection: 'row'
  },
  artwork: {
    marginLeft: spacing(3),
    height: 26,
    width: 26,
    overflow: 'hidden',
    backgroundColor: palette.neutralLight7,
    borderRadius: 2
  },
  digitalContentText: {
    alignItems: 'center',
    marginLeft: spacing(3),
    flexDirection: 'row'
  },
  title: {
    color: palette.neutral,
    maxWidth: Dimensions.get('window').width / 3,
    fontSize: spacing(3)
  },
  separator: {
    color: palette.neutral,
    marginLeft: spacing(1),
    marginRight: spacing(1),
    fontSize: spacing(4)
  },
  author: {
    color: palette.neutral,
    maxWidth: Dimensions.get('window').width / 4,
    fontSize: spacing(3)
  }
}))

type PlayBarProps = {
  digital_content: DigitalContent
  user: User
  onPress: () => void
  translationAnim: Animated.Value
}

const PlayBarArtwork = ({ digital_content }: { digital_content: DigitalContent }) => {
  const image = useDigitalContentCoverArt({
    id: digital_content.digital_content_id,
    sizes: digital_content._cover_art_sizes,
    size: SquareSizes.SIZE_150_BY_150
  })
  return <DynamicImage uri={image} />
}

export const PlayBar = ({
  digital_content,
  user,
  onPress,
  translationAnim
}: PlayBarProps) => {
  const styles = useStyles()
  const dispatchWeb = useDispatchWeb()

  const onPressFavoriteButton = useCallback(() => {
    if (digital_content) {
      if (digital_content.has_current_user_saved) {
        dispatchWeb(unsaveDigitalContent(digital_content.digital_content_id, FavoriteSource.PLAYBAR))
      } else {
        dispatchWeb(saveDigitalContent(digital_content.digital_content_id, FavoriteSource.PLAYBAR))
      }
    }
  }, [dispatchWeb, digital_content])

  const renderFavoriteButton = () => {
    return (
      <FavoriteButton
        onPress={onPressFavoriteButton}
        isActive={digital_content?.has_current_user_saved ?? false}
        wrapperStyle={styles.icon}
      />
    )
  }

  return (
    <Animated.View
      style={[
        styles.root,
        {
          opacity: translationAnim.interpolate({
            // Interpolate the animation such that the play bar fades out
            // at 25% up the screen.
            inputRange: [
              0,
              0.75 * (NOW_PLAYING_HEIGHT - PLAY_BAR_HEIGHT),
              NOW_PLAYING_HEIGHT - PLAY_BAR_HEIGHT
            ],
            outputRange: [0, 0, 1],
            extrapolate: 'extend'
          })
        }
      ]}
    >
      <TrackingBar translationAnim={translationAnim} />
      <View style={styles.container}>
        {renderFavoriteButton()}
        <TouchableOpacity
          activeOpacity={1}
          style={styles.digitalContentInfo}
          onPress={onPress}
        >
          <View style={styles.artwork}>
            {digital_content && <PlayBarArtwork digital_content={digital_content} />}
          </View>
          <View style={styles.digitalContentText}>
            <Text numberOfLines={1} weight='bold' style={styles.title}>
              {digital_content?.title ?? ''}
            </Text>
            <Text
              weight='bold'
              style={styles.separator}
              accessibilityElementsHidden
            >
              {digital_content ? '•' : ''}
            </Text>
            <Text numberOfLines={1} weight='medium' style={styles.author}>
              {user?.name ?? ''}
            </Text>
          </View>
        </TouchableOpacity>
        <PlayButton wrapperStyle={styles.playIcon} />
      </View>
    </Animated.View>
  )
}
