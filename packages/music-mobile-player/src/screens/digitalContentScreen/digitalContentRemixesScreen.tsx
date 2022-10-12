import { makeGetLineupMetadatas } from '@coliving/web/src/common/store/lineup/selectors'
import { digitalContentsActions } from '@coliving/web/src/common/store/pages/remixes/lineup/actions'
import {
  getDigitalContent,
  getUser,
  getLineup,
  getCount
} from '@coliving/web/src/common/store/pages/remixes/selectors'
import { pluralize } from '@coliving/web/src/common/utils/formatUtil'
import { Text, View } from 'react-native'

import { Screen } from 'app/components/core'
import { Header } from 'app/components/header'
import { Lineup } from 'app/components/lineup'
import UserBadges from 'app/components/userBadges'
import { useNavigation } from 'app/hooks/useNavigation'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { flexRowCentered, makeStyles } from 'app/styles'

const getRemixesDigitalContentsLineup = makeGetLineupMetadatas(getLineup)

const messages = {
  remix: 'Remix',
  of: 'of',
  by: 'by',
  header: 'Remixes'
}

const useStyles = makeStyles(({ spacing, palette, typography }) => ({
  header: {
    alignItems: 'center',
    margin: spacing(4),
    marginTop: spacing(6)
  },
  digital_content: {
    ...flexRowCentered()
  },
  text: {
    ...typography.body,
    textAlign: 'center',
    lineHeight: 20
  },
  link: {
    color: palette.secondary
  }
}))

export const DigitalContentRemixesScreen = () => {
  const navigation = useNavigation()
  const lineup = useSelectorWeb(getRemixesDigitalContentsLineup)
  const count = useSelectorWeb(getCount)
  const digital_content = useSelectorWeb(getDigitalContent)
  const user = useSelectorWeb(getUser)

  const styles = useStyles()

  const handlePressDigitalContent = () => {
    if (!digital_content) {
      return
    }
    navigation.push({
      native: { screen: 'DigitalContent', params: { id: digital_content.digital_content_id } },
      web: { route: digital_content.permalink }
    })
  }

  const handlePressLandlordName = () => {
    if (!user) {
      return
    }

    navigation.push({
      native: { screen: 'Profile', params: { handle: user.handle } },
      web: { route: `/${user.handle}` }
    })
  }

  const remixesText = pluralize(messages.remix, count, 'es', !count)
  const remixesCountText = `${count || ''} ${remixesText} ${messages.of}`

  return (
    <Screen>
      <Header text={messages.header} />
      <Lineup
        lineup={lineup}
        fetchPayload={{ digitalContentId: digital_content?.digital_content_id }}
        header={
          digital_content && user ? (
            <View style={styles.header}>
              <Text style={styles.text}>{remixesCountText}</Text>
              <Text style={styles.text}>
                <Text style={styles.link} onPress={handlePressDigitalContent}>
                  {digital_content.title}
                </Text>{' '}
                <Text>{messages.by}</Text>{' '}
                <Text onPress={handlePressLandlordName}>
                  <Text style={styles.link}>{user.name}</Text>
                  {user ? (
                    <UserBadges user={user} badgeSize={10} hideName />
                  ) : null}
                </Text>
              </Text>
            </View>
          ) : null
        }
        actions={digitalContentsActions}
      />
    </Screen>
  )
}
