import { useCallback } from 'react'

import type { Agreement, User } from '@coliving/common'
import { FavoriteSource, SquareSizes } from '@coliving/common'
import {
  saveAgreement,
  unsaveAgreement
} from '@coliving/web/src/common/store/social/agreements/actions'
import { TouchableOpacity, Animated, View, Dimensions } from 'react-native'

import { DynamicImage } from 'app/components/core'
import { FavoriteButton } from 'app/components/favoriteButton'
import Text from 'app/components/text'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useAgreementCoverArt } from 'app/hooks/useAgreementCoverArt'
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
  agreementInfo: {
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
  agreementText: {
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
  landlord: {
    color: palette.neutral,
    maxWidth: Dimensions.get('window').width / 4,
    fontSize: spacing(3)
  }
}))

type PlayBarProps = {
  agreement: Agreement
  user: User
  onPress: () => void
  translationAnim: Animated.Value
}

const PlayBarArtwork = ({ agreement }: { agreement: Agreement }) => {
  const image = useAgreementCoverArt({
    id: agreement.agreement_id,
    sizes: agreement._cover_art_sizes,
    size: SquareSizes.SIZE_150_BY_150
  })
  return <DynamicImage uri={image} />
}

export const PlayBar = ({
  agreement,
  user,
  onPress,
  translationAnim
}: PlayBarProps) => {
  const styles = useStyles()
  const dispatchWeb = useDispatchWeb()

  const onPressFavoriteButton = useCallback(() => {
    if (agreement) {
      if (agreement.has_current_user_saved) {
        dispatchWeb(unsaveAgreement(agreement.agreement_id, FavoriteSource.PLAYBAR))
      } else {
        dispatchWeb(saveAgreement(agreement.agreement_id, FavoriteSource.PLAYBAR))
      }
    }
  }, [dispatchWeb, agreement])

  const renderFavoriteButton = () => {
    return (
      <FavoriteButton
        onPress={onPressFavoriteButton}
        isActive={agreement?.has_current_user_saved ?? false}
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
          style={styles.agreementInfo}
          onPress={onPress}
        >
          <View style={styles.artwork}>
            {agreement && <PlayBarArtwork agreement={agreement} />}
          </View>
          <View style={styles.agreementText}>
            <Text numberOfLines={1} weight='bold' style={styles.title}>
              {agreement?.title ?? ''}
            </Text>
            <Text
              weight='bold'
              style={styles.separator}
              accessibilityElementsHidden
            >
              {agreement ? '•' : ''}
            </Text>
            <Text numberOfLines={1} weight='medium' style={styles.landlord}>
              {user?.name ?? ''}
            </Text>
          </View>
        </TouchableOpacity>
        <PlayButton wrapperStyle={styles.playIcon} />
      </View>
    </Animated.View>
  )
}
