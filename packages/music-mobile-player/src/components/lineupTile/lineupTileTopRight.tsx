import { formatSeconds } from '@coliving/web/src/common/utils/timeUtil'
import type { ViewStyle } from 'react-native'
import { StyleSheet, View } from 'react-native'
import type { SvgProps } from 'react-native-svg'

import IconHidden from 'app/assets/images/iconHidden.svg'
import IconStar from 'app/assets/images/iconStar.svg'
import Text from 'app/components/text'
import { useThemedStyles } from 'app/hooks/useThemedStyles'
import { flexRowCentered } from 'app/styles'
import { useThemeColors } from 'app/utils/theme'

import { createStyles as createDigitalContentTileStyles } from './styles'

const messages = {
  landlordPick: "Author's Pick",
  hiddenDigitalContent: 'Hidden DigitalContent'
}

const flexRowEnd = (): ViewStyle => ({
  ...flexRowCentered(),
  justifyContent: 'flex-end'
})

const styles = StyleSheet.create({
  topRight: {
    ...flexRowEnd(),
    position: 'absolute',
    top: 10,
    right: 10,
    left: 0
  },
  item: {
    ...flexRowEnd(),
    marginRight: 8
  },
  icon: {
    marginRight: 4
  }
})

type ItemProps = {
  /**
   * Icon shown on the left hand side of the item
   */
  icon: React.FC<SvgProps>
  /**
   * Label shown on the right hand side of the item
   */
  label: string
}

const LineupTileTopRightItem = ({ icon: Icon, label }: ItemProps) => {
  const { neutralLight4 } = useThemeColors()
  const digitalContentTileStyles = useThemedStyles(createDigitalContentTileStyles)
  return (
    <View style={styles.item}>
      <Icon height={16} width={16} fill={neutralLight4} style={styles.icon} />
      <Text style={digitalContentTileStyles.statText}>{label}</Text>
    </View>
  )
}

type Props = {
  /**
   * The duration of the digital_content or digitalContents
   */
  duration?: number
  /**
   * Whether or not the digital_content is the author pick
   */
  isLandlordPick?: boolean
  /**
   * Whether or not the digital_content is unlisted (hidden)
   */
  isUnlisted?: boolean
  /**
   * Whether or not to show the author pick icon
   */
  showLandlordPick?: boolean
}

export const LineupTileTopRight = ({
  duration,
  isLandlordPick,
  isUnlisted,
  showLandlordPick
}: Props) => {
  const digitalContentTileStyles = useThemedStyles(createDigitalContentTileStyles)

  return (
    <View style={styles.topRight}>
      {showLandlordPick && isLandlordPick && (
        <LineupTileTopRightItem icon={IconStar} label={messages.landlordPick} />
      )}
      {isUnlisted && (
        <LineupTileTopRightItem
          icon={IconHidden}
          label={messages.hiddenDigitalContent}
        />
      )}
      <Text style={digitalContentTileStyles.statText}>
        {duration && formatSeconds(duration)}
      </Text>
    </View>
  )
}
