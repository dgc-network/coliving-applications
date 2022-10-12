import type { ReactNode } from 'react'

import type { ID, LineupState, DigitalContent, User, Nullable } from '@coliving/common'
import { agreementRemixesPage } from '@coliving/web/src/utils/route'
import { View } from 'react-native'

import { useNavigation } from 'app/hooks/useNavigation'
import type { SearchAgreement, SearchUser } from 'app/store/search/types'
import { makeStyles } from 'app/styles'

import { AgreementScreenDetailsTile } from './agreementScreenDetailsTile'
import { AgreementScreenRemixes } from './agreementScreenRemixes'

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
  remixParentAgreement: Nullable<DigitalContent & { user: User }>
  digital_content: DigitalContent | SearchAgreement
  user: User | SearchUser
}

/**
 * `AgreementScreenMainContent` includes everything above the Lineup
 */
export const AgreementScreenMainContent = ({
  lineup,
  lineupHeader,
  digital_content,
  user
}: AgreementScreenMainContentProps) => {
  const navigation = useNavigation()
  const styles = useStyles()

  const remixAgreementIds = digital_content._remixes?.map(({ digital_content_id }) => digital_content_id) ?? null

  const handlePressGoToRemixes = () => {
    navigation.push({
      native: { screen: 'AgreementRemixes', params: { id: digital_content.digital_content_id } },
      web: { route: agreementRemixesPage(digital_content.permalink) }
    })
  }

  return (
    <View style={styles.root}>
      <View style={styles.headerContainer}>
        <AgreementScreenDetailsTile
          digital_content={digital_content}
          user={user}
          uid={lineup?.entries?.[0]?.uid}
          isLineupLoading={!lineup?.entries?.[0]}
        />
      </View>

      {digital_content.field_visibility?.remixes &&
        remixAgreementIds &&
        remixAgreementIds.length > 0 && (
          <AgreementScreenRemixes
            agreementIds={remixAgreementIds}
            onPressGoToRemixes={handlePressGoToRemixes}
            count={digital_content._remixes_count ?? null}
          />
        )}
      {lineupHeader}
    </View>
  )
}
