import { WidthSizes } from '@coliving/common'
import { BlurView } from '@react-native-community/blur'
import { Animated, Platform, StyleSheet } from 'react-native'

import BadgeLandlord from 'app/assets/images/badgeLandlord.svg'
import { DynamicImage } from 'app/components/core'
import { useUserCoverPhoto } from 'app/hooks/useUserCoverPhoto'
import { makeStyles } from 'app/styles/makeStyles'

import { useSelectProfile } from './selectors'

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView)

const useStyles = makeStyles(({ spacing }) => ({
  landlordBadge: {
    position: 'absolute',
    top: spacing(5),
    right: spacing(3)
  },
  imageRoot: {
    height: 96
  },
  image: {
    height: '100%'
  }
}))

const interpolateBlurViewOpacity = (scrollY: Animated.Value) =>
  scrollY.interpolate({
    inputRange: [-100, 0],
    outputRange: [1, 0],
    extrapolateLeft: 'extend',
    extrapolateRight: 'clamp'
  })

const interpolateBadgeImagePosition = (scrollY: Animated.Value) =>
  scrollY.interpolate({
    inputRange: [-200, 0],
    outputRange: [-200, 0],
    extrapolateLeft: 'extend',
    extrapolateRight: 'clamp'
  })

export const CoverPhoto = ({ scrollY }: { scrollY?: Animated.Value }) => {
  const styles = useStyles()
  const { user_id, _cover_photo_sizes, digital_content_count } = useSelectProfile([
    'user_id',
    '_cover_photo_sizes',
    'digital_content_count'
  ])

  const coverPhoto = useUserCoverPhoto({
    id: user_id,
    sizes: _cover_photo_sizes,
    size: WidthSizes.SIZE_2000
  })

  const isDefaultImage = coverPhoto && /imageCoverPhotoBlank/.test(coverPhoto)

  const isLandlord = digital_content_count > 0

  return (
    <>
      <DynamicImage
        animatedValue={scrollY}
        uri={isDefaultImage ? `https://.co/${coverPhoto}` : coverPhoto}
        styles={{ root: styles.imageRoot, image: styles.image }}
        resizeMode={isDefaultImage ? 'repeat' : undefined}
      >
        {/*
          Disable blur on android because it causes a crash.
          See https://github.com/software-mansion/react-native-screens/pull/1406
          TODO: C-423 pull in new version of react screens when the fix is released
        */}
        {Platform.OS === 'ios' ? (
          <AnimatedBlurView
            blurType={'dark'}
            blurAmount={100}
            style={[
              { ...StyleSheet.absoluteFillObject, zIndex: 2 },
              scrollY
                ? { opacity: interpolateBlurViewOpacity(scrollY) }
                : undefined
            ]}
          />
        ) : null}
      </DynamicImage>
      {isLandlord ? (
        <Animated.View
          style={[
            styles.landlordBadge,
            scrollY
              ? {
                  transform: [
                    {
                      translateY: interpolateBadgeImagePosition(scrollY)
                    }
                  ]
                }
              : undefined
          ]}
        >
          <BadgeLandlord />
        </Animated.View>
      ) : null}
    </>
  )
}
