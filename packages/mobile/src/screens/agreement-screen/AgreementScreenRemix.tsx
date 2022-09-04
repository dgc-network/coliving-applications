import { useCallback } from 'react'

import type { ID, Agreement, User } from '@coliving/common'
import { SquareSizes } from '@coliving/common'
import { getAgreement } from '@coliving/web/src/common/store/cache/agreements/selectors'
import { getUserFromAgreement } from '@coliving/web/src/common/store/cache/users/selectors'
import { profilePage } from '@coliving/web/src/utils/route'
import type { StyleProp, ViewStyle } from 'react-native'
import { Pressable, View } from 'react-native'

import CoSign from 'app/components/co-sign/CoSign'
import { Size } from 'app/components/co-sign/types'
import { DynamicImage } from 'app/components/core'
import Text from 'app/components/text'
import UserBadges from 'app/components/user-badges'
import { useNavigation } from 'app/hooks/useNavigation'
import { isEqual, useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { useAgreementCoverArt } from 'app/hooks/useAgreementCoverArt'
import { useUserProfilePicture } from 'app/hooks/useUserProfilePicture'
import type { StylesProp } from 'app/styles'
import { flexRowCentered, makeStyles } from 'app/styles'

const messages = {
  by: 'By '
}

type AgreementScreenRemixProps = {
  id: ID
} & Omit<AgreementScreenRemixComponentProps, 'agreement' | 'user'>

const useStyles = makeStyles(({ palette, spacing, typography }) => ({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing(2)
  },

  coverArt: {
    width: 121,
    height: 121,
    borderWidth: 1,
    borderColor: palette.neutralLight8,
    borderRadius: 4,
    overflow: 'hidden'
  },

  profilePicture: {
    zIndex: 1,
    overflow: 'hidden',
    position: 'absolute',
    top: spacing(-2),
    left: spacing(-2),
    height: 36,
    width: 36,
    borderWidth: 2,
    borderColor: palette.neutralLight8,
    borderRadius: 18
  },

  landlord: {
    marginTop: spacing(2),
    ...flexRowCentered(),
    ...typography.body,
    textAlign: 'center'
  },

  name: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    maxWidth: 128
  },

  landlordName: {
    color: palette.secondary
  },

  badges: {
    marginLeft: spacing(1),
    top: spacing(0.5)
  }
}))

export const AgreementScreenRemix = ({ id, ...props }: AgreementScreenRemixProps) => {
  const agreement = useSelectorWeb((state) => getAgreement(state, { id }), isEqual)
  const user = useSelectorWeb(
    (state) => getUserFromAgreement(state, { id }),
    isEqual
  )

  if (!agreement || !user) {
    console.warn(
      'Agreement or user missing for AgreementScreenRemix, preventing render'
    )
    return null
  }

  return <AgreementScreenRemixComponent {...props} agreement={agreement} user={user} />
}

type AgreementScreenRemixComponentProps = {
  style?: StyleProp<ViewStyle>
  styles?: StylesProp<{
    root: ViewStyle
  }>
  agreement: Agreement
  user: User
}

const AgreementScreenRemixComponent = ({
  style,
  styles: stylesProp,
  agreement,
  user
}: AgreementScreenRemixComponentProps) => {
  const styles = useStyles()

  const { _co_sign, permalink, agreement_id } = agreement
  const { name, handle } = user
  const navigation = useNavigation()

  const profilePictureImage = useUserProfilePicture({
    id: user.user_id,
    sizes: user._profile_picture_sizes,
    size: SquareSizes.SIZE_150_BY_150
  })

  const coverArtImage = useAgreementCoverArt({
    id: agreement.agreement_id,
    sizes: agreement._cover_art_sizes,
    size: SquareSizes.SIZE_480_BY_480
  })

  const handlePressAgreement = useCallback(() => {
    navigation.push({
      native: { screen: 'Agreement', params: { id: agreement_id } },
      web: { route: permalink }
    })
  }, [navigation, permalink, agreement_id])

  const handlePressLandlord = useCallback(() => {
    navigation.push({
      native: { screen: 'Profile', params: { handle } },
      web: { route: profilePage(handle) }
    })
  }, [handle, navigation])

  const images = (
    <>
      <View style={styles.profilePicture}>
        <DynamicImage uri={profilePictureImage} />
      </View>
      <View style={styles.coverArt}>
        <DynamicImage uri={coverArtImage} />
      </View>
    </>
  )

  return (
    <View style={[styles.root, style, stylesProp?.root]}>
      <Pressable onPress={handlePressAgreement}>
        {_co_sign ? <CoSign size={Size.MEDIUM}>{images}</CoSign> : images}
      </Pressable>
      <Pressable style={styles.landlord} onPress={handlePressLandlord}>
        <View style={styles.name}>
          <Text>{messages.by}</Text>
          <Text style={styles.landlordName} numberOfLines={1}>
            {name}
          </Text>
          <View style={styles.badges}>
            <UserBadges user={user} badgeSize={12} hideName />
          </View>
        </View>
      </Pressable>
    </View>
  )
}
