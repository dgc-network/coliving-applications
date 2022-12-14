import type { ID } from '@coliving/common'
import { View } from 'react-native'

import IconArrow from 'app/assets/images/iconArrow.svg'
import IconRemix from 'app/assets/images/iconRemix.svg'
import { Button, Tile, GradientText } from 'app/components/core'
import { flexRowCentered, makeStyles } from 'app/styles'
import { useThemeColors } from 'app/utils/theme'

import { DigitalContentScreenRemix } from './digitalContentScreenRemix'

const messages = {
  title: 'Remixes',
  viewAll: (count: number | null) =>
    `View All ${count && count > 6 ? `${count} ` : ''}Remixes`
}

type DigitalContentScreenRemixesProps = {
  digitalContentIds: ID[]
  onPressGoToRemixes: () => void
  count: number | null
}

const useStyles = makeStyles(({ palette, spacing, typography }) => ({
  root: {
    marginBottom: spacing(6)
  },
  tile: {
    padding: spacing(6)
  },

  header: {
    ...flexRowCentered(),
    justifyContent: 'center',
    marginBottom: spacing(6)
  },

  headerText: {
    lineHeight: 30,
    fontSize: 28
  },

  iconRemix: {
    height: spacing(12),
    width: spacing(12),
    marginRight: spacing(2)
  },

  digitalContents: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    flexWrap: 'wrap'
  },

  digital_content: {
    marginHorizontal: spacing(3),
    marginBottom: spacing(5)
  },

  button: {
    backgroundColor: palette.secondary
  }
}))

export const DigitalContentScreenRemixes = ({
  digitalContentIds,
  onPressGoToRemixes,
  count
}: DigitalContentScreenRemixesProps) => {
  const styles = useStyles()
  const { pageHeaderGradientColor2 } = useThemeColors()
  return (
    <Tile styles={{ root: styles.root, tile: styles.tile }}>
      <View style={styles.header}>
        <IconRemix style={styles.iconRemix} fill={pageHeaderGradientColor2} />
        <GradientText style={styles.headerText}>{messages.title}</GradientText>
      </View>
      <View style={styles.digitalContents}>
        {digitalContentIds.map((id) => {
          return <DigitalContentScreenRemix id={id} key={id} style={styles.digital_content} />
        })}
      </View>
      <Button
        title={messages.viewAll(count)}
        icon={IconArrow}
        variant='primary'
        size='medium'
        onPress={onPressGoToRemixes}
        styles={{
          root: styles.button
        }}
      />
    </Tile>
  )
}
