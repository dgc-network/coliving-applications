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
  author: User
  /**
   * Optional source page that establishes the `fromPage` for web-routes.
   */
  fromPage?: string
  style?: StyleProp<ViewStyle>
}

export const LandlordCard = ({ author, fromPage, style }: LandlordCardProps) => {
  const { handle } = author
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
      id={author.user_id}
      imageSize={author._profile_picture_sizes}
      primaryText={author.name}
      secondaryText={formatProfileCardSecondaryText(author.follower_count)}
      onPress={handlePress}
      type='user'
      user={author}
    />
  )
}
