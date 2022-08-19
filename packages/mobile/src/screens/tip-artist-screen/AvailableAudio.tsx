import type { BNWei } from '@/common'
import { getAccountBalance } from '-client/src/common/store/wallet/selectors'
import { formatWei } from '-client/src/common/utils/wallet'
import BN from 'bn.js'
import { Image, View } from 'react-native'

import TokenBadgeNoTier from 'app/assets/images/tokenBadgeNoTier.png'
import { Text } from 'app/components/core'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { makeStyles } from 'app/styles'

const useStyles = makeStyles(({ spacing, typography, palette }) => ({
  root: {
    marginBottom: spacing(6),
    marginHorizontal: spacing(2)
  },
  text: {
    fontFamily: typography.fontByWeight.heavy,
    textTransform: 'uppercase',
    color: palette.neutralLight4
  },
  availableAudio: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing(2)
  },
  liveToken: {
    height: spacing(4),
    width: spacing(4),
    marginLeft: spacing(3),
    marginRight: spacing(1)
  }
}))

const messages = {
  available: 'Available to send',
  disclaimer: '$LIVE held in linked wallets cannot be used to tip'
}

export const AvailableAudio = () => {
  const accountBalance = useSelectorWeb(getAccountBalance) ?? new BN(0)
  const styles = useStyles()

  return (
    <View style={styles.root}>
      <View style={styles.availableAudio}>
        <Text variant='body' style={styles.text}>
          {messages.available}
        </Text>
        <Image style={styles.liveToken} source={TokenBadgeNoTier} />
        <Text variant='body' style={styles.text}>
          {formatWei(accountBalance as BNWei, true, 0)}
        </Text>
      </View>
      <Text variant='body2' color='neutralLight4'>
        {messages.disclaimer}
      </Text>
    </View>
  )
}
