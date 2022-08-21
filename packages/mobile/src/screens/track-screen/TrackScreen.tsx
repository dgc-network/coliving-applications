import { makeGetLineupMetadatas } from '-client/src/common/store/lineup/selectors'
import { agreementsActions } from '-client/src/common/store/pages/agreement/lineup/actions'
import {
  getLineup,
  getRemixParentAgreement,
  getAgreement,
  getUser
} from '-client/src/common/store/pages/agreement/selectors'
import { agreementRemixesPage } from '-client/src/utils/route'
import { omit } from 'lodash'
import { Text, View } from 'react-native'

import IconArrow from 'app/assets/images/iconArrow.svg'
import { Button, Screen } from 'app/components/core'
import { Lineup } from 'app/components/lineup'
import { useNavigation } from 'app/hooks/useNavigation'
import { useRoute } from 'app/hooks/useRoute'
import { isEqual, useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { makeStyles } from 'app/styles'

import { AgreementScreenMainContent } from './AgreementScreenMainContent'

const getMoreByLandlordLineup = makeGetLineupMetadatas(getLineup)

const messages = {
  moreBy: 'More By',
  originalAgreement: 'Original Agreement',
  viewOtherRemixes: 'View Other Remixes'
}

const useStyles = makeStyles(({ palette, spacing, typography }) => ({
  lineupHeader: {
    width: '100%',
    textAlign: 'center',
    ...typography.h3,
    color: palette.neutralLight3,
    textTransform: 'uppercase'
  },
  buttonContainer: {
    padding: spacing(6)
  },
  button: {
    backgroundColor: palette.secondary
  }
}))

/**
 * `AgreementScreen` displays a single agreement and a Lineup of more agreements by the landlord
 */
export const AgreementScreen = () => {
  const styles = useStyles()
  const navigation = useNavigation()
  const { params } = useRoute<'Agreement'>()

  // params is incorrectly typed and can sometimes be undefined
  const { searchAgreement } = params ?? {}

  const cachedAgreement = useSelectorWeb(
    (state) => getAgreement(state, params),
    // Omitting uneeded fields from the equality check because they are
    // causing extra renders when added to the `agreement` object
    (a, b) => {
      const omitUneeded = <T extends object | null>(o: T) =>
        omit(o, ['_stems', '_remix_parents'])
      return isEqual(omitUneeded(a), omitUneeded(b))
    }
  )

  const agreement = cachedAgreement ?? searchAgreement

  const cachedUser = useSelectorWeb(
    (state) => getUser(state, { id: agreement?.owner_id }),
    isEqual
  )

  const user = cachedUser ?? searchAgreement?.user

  const lineup = useSelectorWeb(
    getMoreByLandlordLineup,
    // Checking for equality between the entries themselves, because
    // lineup reset state changes cause extra renders
    (a, b) => (!a.entries && !b.entries) || isEqual(a.entries, b.entries)
  )
  const remixParentAgreement = useSelectorWeb(getRemixParentAgreement)

  if (!agreement || !user) {
    console.warn(
      'Agreement, user, or lineup missing for AgreementScreen, preventing render'
    )
    return null
  }

  const handlePressGoToRemixes = () => {
    if (!remixParentAgreement) {
      return
    }
    navigation.push({
      native: {
        screen: 'AgreementRemixes',
        params: { id: remixParentAgreement.agreement_id }
      },
      web: { route: agreementRemixesPage(remixParentAgreement.permalink) }
    })
  }

  const remixParentAgreementId = agreement.remix_of?.agreements?.[0]?.parent_agreement_id
  const showMoreByLandlordTitle =
    (remixParentAgreementId && lineup.entries.length > 2) ||
    (!remixParentAgreementId && lineup.entries.length > 1)

  const hasValidRemixParent =
    !!remixParentAgreementId &&
    !!remixParentAgreement &&
    remixParentAgreement.is_delete === false &&
    !remixParentAgreement.user?.is_deactivated

  const moreByLandlordTitle = showMoreByLandlordTitle ? (
    <Text
      style={styles.lineupHeader}
    >{`${messages.moreBy} ${user?.name}`}</Text>
  ) : null

  const originalAgreementTitle = (
    <Text style={styles.lineupHeader}>{messages.originalAgreement}</Text>
  )

  return (
    <Screen>
      <Lineup
        actions={agreementsActions}
        count={6}
        header={
          <AgreementScreenMainContent
            lineup={lineup}
            remixParentAgreement={remixParentAgreement}
            agreement={agreement}
            user={user}
            lineupHeader={
              hasValidRemixParent ? originalAgreementTitle : moreByLandlordTitle
            }
          />
        }
        leadingElementId={remixParentAgreement?.agreement_id}
        leadingElementDelineator={
          <>
            <View style={styles.buttonContainer}>
              <Button
                title={messages.viewOtherRemixes}
                icon={IconArrow}
                variant='primary'
                size='small'
                onPress={handlePressGoToRemixes}
                fullWidth
                styles={{
                  root: styles.button
                }}
              />
            </View>
            {moreByLandlordTitle}
          </>
        }
        lineup={lineup}
        start={1}
        includeLineupStatus
      />
    </Screen>
  )
}
