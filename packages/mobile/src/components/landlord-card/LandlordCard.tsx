import { useCallback } from 'react'

import type { User } from '@coliving/common'
import type { StyleProp, ViewStyle } from 'react-native'

import { Card } from 'app/components/card'
import { useNavigation } from 'app/hooks/useNavigation'
import { formatCount } from 'app/utils/format'

const formatProfileCardSecondaryText = (followers: number) => {
  const followersText = followers === 1 ? 'Follower' : 'Followers'
  return `${formatCount(followers)} ${followersText}`
}

type LandlordCardProps = {
  landlord: User
  /**
   * Optional source page that establishes the `fromPage` for web-routes.
   */
  fromPage?: string
  style?: StyleProp<ViewStyle>
}

export const LandlordCard = ({ landlord, fromPage, style }: LandlordCardProps) => {
  const { handle } = landlord
  const navigation = useNavigation()
  const handlePress = useCallback(() => {
    navigation.push({
      native: { screen: 'Profile', params: { handle } },
      web: { route: handle, fromPage }
    })
  }, [navigation, handle, fromPage])

  return (
    <Card
      style={style}
      id={landlord.user_id}
      imageSize={landlord._profile_picture_sizes}
      primaryText={landlord.name}
      secondaryText={formatProfileCardSecondaryText(landlord.follower_count)}
      onPress={handlePress}
      type='user'
      user={landlord}
    />
  )
}
