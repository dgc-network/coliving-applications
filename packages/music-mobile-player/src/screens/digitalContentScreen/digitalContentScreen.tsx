import { makeGetLineupMetadatas } from '@coliving/web/src/common/store/lineup/selectors'
import { digitalContentsActions } from '@coliving/web/src/common/store/pages/digital_content/lineup/actions'
import {
  getLineup,
  getRemixParentDigitalContent,
  getDigitalContent,
  getUser
} from '@coliving/web/src/common/store/pages/digital_content/selectors'
import { digitalContentRemixesPage } from '@coliving/web/src/utils/route'
import { omit } from 'lodash'
import { Text, View } from 'react-native'

import IconArrow from 'app/assets/images/iconArrow.svg'
import { Button, Screen } from 'app/components/core'
import { Lineup } from 'app/components/lineup'
import { useNavigation } from 'app/hooks/useNavigation'
import { useRoute } from 'app/hooks/useRoute'
import { isEqual, useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { makeStyles } from 'app/styles'

import { DigitalContentScreenMainContent } from './digitalContentScreenMainContent'

const getMoreByLandlordLineup = makeGetLineupMetadatas(getLineup)

const messages = {
  moreBy: 'More By',
  originalDigitalContent: 'Original DigitalContent',
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
 * `DigitalContentScreen` displays a single digital_content and a Lineup of more digitalContents by the author
 */
export const DigitalContentScreen = () => {
  const styles = useStyles()
  const navigation = useNavigation()
  const { params } = useRoute<'DigitalContent'>()

  // params is incorrectly typed and can sometimes be undefined
  const { searchDigitalContent } = params ?? {}

  const cachedDigitalContent = useSelectorWeb(
    (state) => getDigitalContent(state, params),
    // Omitting uneeded fields from the equality check because they are
    // causing extra renders when added to the `digital_content` object
    (a, b) => {
      const omitUneeded = <T extends object | null>(o: T) =>
        omit(o, ['_stems', '_remix_parents'])
      return isEqual(omitUneeded(a), omitUneeded(b))
    }
  )

  const digital_content = cachedDigitalContent ?? searchDigitalContent

  const cachedUser = useSelectorWeb(
    (state) => getUser(state, { id: digital_content?.owner_id }),
    isEqual
  )

  const user = cachedUser ?? searchDigitalContent?.user

  const lineup = useSelectorWeb(
    getMoreByLandlordLineup,
    // Checking for equality between the entries themselves, because
    // lineup reset state changes cause extra renders
    (a, b) => (!a.entries && !b.entries) || isEqual(a.entries, b.entries)
  )
  const remixParentDigitalContent = useSelectorWeb(getRemixParentDigitalContent)

  if (!digital_content || !user) {
    console.warn(
      'DigitalContent, user, or lineup missing for DigitalContentScreen, preventing render'
    )
    return null
  }

  const handlePressGoToRemixes = () => {
    if (!remixParentDigitalContent) {
      return
    }
    navigation.push({
      native: {
        screen: 'DigitalContentRemixes',
        params: { id: remixParentDigitalContent.digital_content_id }
      },
      web: { route: digitalContentRemixesPage(remixParentDigitalContent.permalink) }
    })
  }

  const remixParentDigitalContentId = digital_content.remix_of?.digitalContents?.[0]?.parent_digital_content_id
  const showMoreByLandlordTitle =
    (remixParentDigitalContentId && lineup.entries.length > 2) ||
    (!remixParentDigitalContentId && lineup.entries.length > 1)

  const hasValidRemixParent =
    !!remixParentDigitalContentId &&
    !!remixParentDigitalContent &&
    remixParentDigitalContent.is_delete === false &&
    !remixParentDigitalContent.user?.is_deactivated

  const moreByLandlordTitle = showMoreByLandlordTitle ? (
    <Text
      style={styles.lineupHeader}
    >{`${messages.moreBy} ${user?.name}`}</Text>
  ) : null

  const originalDigitalContentTitle = (
    <Text style={styles.lineupHeader}>{messages.originalDigitalContent}</Text>
  )

  return (
    <Screen>
      <Lineup
        actions={digitalContentsActions}
        count={6}
        header={
          <DigitalContentScreenMainContent
            lineup={lineup}
            remixParentDigitalContent={remixParentDigitalContent}
            digital_content={digital_content}
            user={user}
            lineupHeader={
              hasValidRemixParent ? originalDigitalContentTitle : moreByLandlordTitle
            }
          />
        }
        leadingElementId={remixParentDigitalContent?.digital_content_id}
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
