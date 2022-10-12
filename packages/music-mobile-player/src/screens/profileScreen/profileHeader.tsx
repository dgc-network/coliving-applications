import { useCallback } from 'react'

import { getUserId } from '@coliving/web/src/common/store/account/selectors'
import type { Animated } from 'react-native'
import { LayoutAnimation, View } from 'react-native'
import { useToggle } from 'react-use'

import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { makeStyles } from 'app/styles'

import { LandlordRecommendations } from './authorRecommendations'
import { CoverPhoto } from './coverPhoto'
import { ExpandableBio } from './expandableBio'
import { ProfileInfo } from './profileInfo'
import { ProfileMetrics } from './profileMetrics'
import { ProfilePicture } from './profilePicture'
import { ProfileSocials } from './profileSocials'
import { UploadDigitalContentButton } from './uploadDigitalContentButton'
import { useSelectProfileRoot } from './selectors'

const useStyles = makeStyles(({ palette, spacing }) => ({
  header: {
    backgroundColor: palette.neutralLight10,
    paddingTop: spacing(8),
    paddingHorizontal: spacing(3),
    paddingBottom: spacing(3)
  },
  profilePicture: {
    position: 'absolute',
    top: 37,
    left: 11,
    zIndex: 100
  }
}))

type ProfileHeaderProps = {
  scrollY: Animated.Value
}

export const ProfileHeader = (props: ProfileHeaderProps) => {
  const { scrollY } = props
  const styles = useStyles()
  const profile = useSelectProfileRoot(['user_id', 'does_current_user_follow'])
  const accountId = useSelectorWeb(getUserId)
  const isOwner = profile?.user_id === accountId
  const [hasUserFollowed, setHasUserFollowed] = useToggle(false)

  const handleFollow = useCallback(() => {
    if (!profile?.does_current_user_follow) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
      setHasUserFollowed(true)
    }
  }, [setHasUserFollowed, profile])

  const handleCloseLandlordRecs = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setHasUserFollowed(false)
  }, [setHasUserFollowed])

  return (
    // Box-none gets us scrolling on the non-touchable parts of the header
    // See scroll on header documentation:
    // https://github.com/PedroBern/react-native-collapsible-tab-view/tree/v2#scroll-on-header
    // And also known drawbacks:
    // https://github.com/PedroBern/react-native-collapsible-tab-view/pull/30
    <>
      <CoverPhoto scrollY={scrollY} />
      <ProfilePicture style={styles.profilePicture} />
      <View pointerEvents='box-none' style={styles.header}>
        <ProfileInfo onFollow={handleFollow} />
        <ProfileMetrics />
        <ProfileSocials />
        <ExpandableBio />
        {!hasUserFollowed ? null : (
          <LandlordRecommendations onClose={handleCloseLandlordRecs} />
        )}
        {isOwner ? <UploadDigitalContentButton /> : null}
      </View>
    </>
  )
}
