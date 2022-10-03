import type { User } from '@coliving/common'
import { TouchableOpacity } from 'react-native'

import { Text } from 'app/components/core'
import UserBadges from 'app/components/userBadges'
import type { GestureResponderHandler } from 'app/types/gesture'

type LandlordLinkProps = {
  landlord: User
  onPress: GestureResponderHandler
}

export const LandlordLink = (props: LandlordLinkProps) => {
  const { landlord, onPress } = props
  const { name } = landlord

  return (
    <TouchableOpacity style={{ flexDirection: 'row' }} onPress={onPress}>
      <Text color='secondary' variant='h3'>
        {name}
      </Text>
      <UserBadges user={landlord} hideName badgeSize={8} />
    </TouchableOpacity>
  )
}
