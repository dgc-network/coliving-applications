import type { ReactNode } from 'react'

import type { ID, LineupState, Agreement, User, Nullable } from '@coliving/common'
import { agreementRemixesPage } from '@coliving/web/src/utils/route'
import { View } from 'react-native'

import { useNavigation } from 'app/hooks/useNavigation'
import type { SearchAgreement, SearchUser } from 'app/store/search/types'
import { makeStyles } from 'app/styles'

import { AgreementScreenDetailsTile } from './AgreementScreenDetailsTile'
import { AgreementScreenRemixes } from './AgreementScreenRemixes'

const useStyles = makeStyles(({ spacing }) => ({
  root: {
    padding: spacing(3),
    paddingBottom: 0
  },
  headerContainer: {
    marginBottom: spacing(6)
  }
}))

type AgreementScreenMainContentProps = {
  lineup: LineupState<{ id: ID }>
  lineupHeader: ReactNode
  remixParentAgreement: Nullable<Agreement & { user: User }>
  agreement: Agreement | SearchAgreement
  user: User | SearchUser
}

/**
 * `AgreementScreenMainContent` includes everything above the Lineup
 */
export const AgreementScreenMainContent = ({
  lineup,
  lineupHeader,
  agreement,
  user
}: AgreementScreenMainContentProps) => {
  const navigation = useNavigation()
  const styles = useStyles()

  const remixAgreementIds = agreement._remixes?.map(({ agreement_id }) => agreement_id) ?? null

  const handlePressGoToRemixes = () => {
    navigation.push({
      native: { screen: 'AgreementRemixes', params: { id: agreement.agreement_id } },
      web: { route: agreementRemixesPage(agreement.permalink) }
    })
  }

  return (
    <View style={styles.root}>
      <View style={styles.headerContainer}>
        <AgreementScreenDetailsTile
          agreement={agreement}
          user={user}
          uid={lineup?.entries?.[0]?.uid}
          isLineupLoading={!lineup?.entries?.[0]}
        />
      </View>

      {agreement.field_visibility?.remixes &&
        remixAgreementIds &&
        remixAgreementIds.length > 0 && (
          <AgreementScreenRemixes
            agreementIds={remixAgreementIds}
            onPressGoToRemixes={handlePressGoToRemixes}
            count={agreement._remixes_count ?? null}
          />
        )}
      {lineupHeader}
    </View>
  )
}
