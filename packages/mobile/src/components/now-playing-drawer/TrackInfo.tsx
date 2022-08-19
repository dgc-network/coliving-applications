import type { Agreement, User } from '@/common'
import { Pressable, View } from 'react-native'

import { Text } from 'app/components/core'
import UserBadges from 'app/components/user-badges/UserBadges'
import { makeStyles } from 'app/styles'
import type { GestureResponderHandler } from 'app/types/gesture'

const useStyles = makeStyles(({ typography, spacing }) => ({
  root: {
    alignItems: 'center'
  },
  agreementTitle: {
    textAlign: 'center'
  },
  artistInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing(3)
  },
  artist: {
    marginBottom: 0,
    fontFamily: typography.fontByWeight.medium
  }
}))

type AgreementInfoProps = {
  agreement: Agreement
  user: User
  onPressArtist: GestureResponderHandler
  onPressTitle: GestureResponderHandler
}

export const AgreementInfo = ({
  onPressArtist,
  onPressTitle,
  agreement,
  user
}: AgreementInfoProps) => {
  const styles = useStyles()
  return (
    <View style={styles.root}>
      {user && agreement ? (
        <>
          <Pressable onPress={onPressTitle}>
            <Text numberOfLines={2} style={styles.agreementTitle} variant='h1'>
              {agreement.title}
            </Text>
          </Pressable>
          <Pressable onPress={onPressArtist}>
            <View style={styles.artistInfo}>
              <Text
                numberOfLines={1}
                style={styles.artist}
                variant='h1'
                color='secondary'
              >
                {user.name}
              </Text>
              <UserBadges user={user} badgeSize={12} hideName />
            </View>
          </Pressable>
        </>
      ) : null}
    </View>
  )
}
