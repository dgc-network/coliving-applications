import { COPYRIGHT_TEXT } from '@coliving/web/src/utils/copyright'
import { View, Image } from 'react-native'
import VersionNumber from 'react-native-version-number'

import appIcon from 'app/assets/images/appIcon.png'
import IconCareers from 'app/assets/images/iconCareers.svg'
import IconContact from 'app/assets/images/iconContact.svg'
import IconDiscord from 'app/assets/images/iconDiscord.svg'
import IconInstagram from 'app/assets/images/iconInstagram.svg'
import IconTwitter from 'app/assets/images/iconTwitterBird.svg'
import { Screen, Text } from 'app/components/core'
import { makeStyles } from 'app/styles'

import { Divider } from './divider'
import { SettingsRowLabel } from './settingRowLabel'
import { SettingsRow } from './settingsRow'

const messages = {
  title: 'About',
  appName: 'Coliving',
  version: 'Coliving Version',
  copyright: COPYRIGHT_TEXT,
  discord: 'Join our community on Discord',
  twitter: 'Follow us on Twitter',
  instagram: 'Follow us on Instagram',
  contact: 'Contact Us',
  careers: 'Careers at Coliving',
  help: 'Help / FAQ',
  terms: 'Terms & Privacy Policy'
}

const useStyles = makeStyles(({ spacing }) => ({
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing(6)
  },
  appIcon: {
    height: 84,
    width: 84,
    marginRight: spacing(4)
  }
}))

export const AboutScreen = () => {
  const styles = useStyles()

  return (
    <Screen variant='secondary' title={messages.title} topbarRight={null}>
      <View style={styles.header}>
        <Image source={appIcon} style={styles.appIcon} />
        <View>
          <Text variant='h2'>{messages.appName}</Text>
          <Text variant='body2'>
            {messages.version} {VersionNumber.appVersion}
          </Text>
          <Text variant='body2'>{messages.copyright}</Text>
        </View>
      </View>
      <SettingsRow url='https://discordapp.com/invite/yNUg2e2' firstItem>
        <SettingsRowLabel label={messages.discord} icon={IconDiscord} />
      </SettingsRow>
      <SettingsRow url='https://twitter.com/dgc-network'>
        <SettingsRowLabel label={messages.twitter} icon={IconTwitter} />
      </SettingsRow>
      <SettingsRow url='https://www.instagram.com/colivingmusic/'>
        <SettingsRowLabel label={messages.instagram} icon={IconInstagram} />
      </SettingsRow>
      <SettingsRow url='mailto:contact@.co'>
        <SettingsRowLabel label={messages.contact} icon={IconContact} />
      </SettingsRow>
      <SettingsRow url='https://jobs.lever.co/'>
        <SettingsRowLabel label={messages.careers} icon={IconCareers} />
      </SettingsRow>
      <Divider />
      <SettingsRow url='https://help..co/'>
        <SettingsRowLabel label={messages.help} />
      </SettingsRow>
      <SettingsRow url='https://.co/legal/terms-of-use'>
        <SettingsRowLabel label={messages.terms} />
      </SettingsRow>
    </Screen>
  )
}
