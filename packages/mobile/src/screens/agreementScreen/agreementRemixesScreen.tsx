import { makeGetLineupMetadatas } from '@coliving/web/src/common/store/lineup/selectors'
import { agreementsActions } from '@coliving/web/src/common/store/pages/remixes/lineup/actions'
import {
  getAgreement,
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

const getRemixesAgreementsLineup = makeGetLineupMetadatas(getLineup)

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
  agreement: {
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

export const AgreementRemixesScreen = () => {
  const navigation = useNavigation()
  const lineup = useSelectorWeb(getRemixesAgreementsLineup)
  const count = useSelectorWeb(getCount)
  const agreement = useSelectorWeb(getAgreement)
  const user = useSelectorWeb(getUser)

  const styles = useStyles()

  const handlePressAgreement = () => {
    if (!agreement) {
      return
    }
    navigation.push({
      native: { screen: 'Agreement', params: { id: agreement.agreement_id } },
      web: { route: agreement.permalink }
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
        fetchPayload={{ agreementId: agreement?.agreement_id }}
        header={
          agreement && user ? (
            <View style={styles.header}>
              <Text style={styles.text}>{remixesCountText}</Text>
              <Text style={styles.text}>
                <Text style={styles.link} onPress={handlePressAgreement}>
                  {agreement.title}
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
        actions={agreementsActions}
      />
    </Screen>
  )
}
