import type { ReactNode } from 'react'

import type { ID, LineupState, DigitalContent, User, Nullable } from '@coliving/common'
import { digitalContentRemixesPage } from '@coliving/web/src/utils/route'
import { View } from 'react-native'

import { useNavigation } from 'app/hooks/useNavigation'
import type { SearchDigitalContent, SearchUser } from 'app/store/search/types'
import { makeStyles } from 'app/styles'

import { DigitalContentScreenDetailsTile } from './digitalContentScreenDetailsTile'
import { DigitalContentScreenRemixes } from './digitalContentScreenRemixes'

const useStyles = makeStyles(({ spacing }) => ({
  root: {
    padding: spacing(3),
    paddingBottom: 0
  },
  headerContainer: {
    marginBottom: spacing(6)
  }
}))

type DigitalContentScreenMainContentProps = {
  lineup: LineupState<{ id: ID }>
  lineupHeader: ReactNode
  remixParentDigitalContent: Nullable<DigitalContent & { user: User }>
  digital_content: DigitalContent | SearchDigitalContent
  user: User | SearchUser
}

/**
 * `DigitalContentScreenMainContent` includes everything above the Lineup
 */
export const DigitalContentScreenMainContent = ({
  lineup,
  lineupHeader,
  digital_content,
  user
}: DigitalContentScreenMainContentProps) => {
  const navigation = useNavigation()
  const styles = useStyles()

  const remixDigitalContentIds = digital_content._remixes?.map(({ digital_content_id }) => digital_content_id) ?? null

  const handlePressGoToRemixes = () => {
    navigation.push({
      native: { screen: 'DigitalContentRemixes', params: { id: digital_content.digital_content_id } },
      web: { route: digitalContentRemixesPage(digital_content.permalink) }
    })
  }

  return (
    <View style={styles.root}>
      <View style={styles.headerContainer}>
        <DigitalContentScreenDetailsTile
          digital_content={digital_content}
          user={user}
          uid={lineup?.entries?.[0]?.uid}
          isLineupLoading={!lineup?.entries?.[0]}
        />
      </View>

      {digital_content.field_visibility?.remixes &&
        remixDigitalContentIds &&
        remixDigitalContentIds.length > 0 && (
          <DigitalContentScreenRemixes
            digitalContentIds={remixDigitalContentIds}
            onPressGoToRemixes={handlePressGoToRemixes}
            count={digital_content._remixes_count ?? null}
          />
        )}
      {lineupHeader}
    </View>
  )
}
