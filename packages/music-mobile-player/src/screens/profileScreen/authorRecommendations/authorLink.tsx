import type { User } from '@coliving/common'
import { TouchableOpacity } from 'react-native'

import { Text } from 'app/components/core'
import UserBadges from 'app/components/userBadges'
import type { GestureResponderHandler } from 'app/types/gesture'

type LandlordLinkProps = {
  author: User
  onPress: GestureResponderHandler
}

export const LandlordLink = (props: LandlordLinkProps) => {
  const { author, onPress } = props
  const { name } = author

  return (
    <TouchableOpacity style={{ flexDirection: 'row' }} onPress={onPress}>
      <Text color='secondary' variant='h3'>
        {name}
      </Text>
      <UserBadges user={author} hideName badgeSize={8} />
    </TouchableOpacity>
  )
}
