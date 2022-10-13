import { StyleSheet, View } from 'react-native'

import IconGold from 'app/assets/images/IconGoldBadge.svg'
import { GradientText } from 'app/components/core'
import { AppDrawer } from 'app/components/drawer'
import Text from 'app/components/text'

const TRANSFER_DGCO_MODAL_NAME = 'TransferAudioMobileWarning'

const styles = StyleSheet.create({
  drawer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: 32
  },

  badge: {
    marginBottom: 24
  },

  title: {
    fontFamily: 'AvenirNextLTPro-Heavy',
    fontSize: 28,
    marginBottom: 24
  },

  subtitle: {
    fontFamily: 'AvenirNextLTPro-Regular',
    textAlign: 'center',
    fontSize: 24,
    maxWidth: 300,
    lineHeight: 30
  }
})

const messages = {
  title: 'Transfer $DGCO',
  subtitle: 'To transfer LIVE please visit .co from a desktop browser'
}

export const TransferAudioMobileDrawer = () => {
  return (
    <AppDrawer modalName={TRANSFER_DGCO_MODAL_NAME}>
      <View style={styles.drawer}>
        <IconGold style={styles.badge} height={134} width={134} />
        <GradientText style={styles.title}>{messages.title}</GradientText>
        <Text style={styles.subtitle}>{messages.subtitle}</Text>
      </View>
    </AppDrawer>
  )
}