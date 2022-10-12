import type { LineupAgreement } from '@coliving/common'
import { range } from 'lodash'
import { Pressable, Text, View } from 'react-native'
import { useSelector } from 'react-redux'

import Skeleton from 'app/components/skeleton'
import { getPlayingUid } from 'app/store/digitalcoin/selectors'
import { flexRowCentered, makeStyles } from 'app/styles'
import type { GestureResponderHandler } from 'app/types/gesture'

// Max number of agreements to display
const DISPLAY_AGREEMENT_COUNT = 5

type LineupTileAgreementListProps = {
  isLoading?: boolean
  onPress: GestureResponderHandler
  agreementCount?: number
  agreements: LineupAgreement[]
}

const useStyles = makeStyles(({ palette, spacing, typography }) => ({
  item: {
    ...flexRowCentered(),
    justifyContent: 'flex-start',
    ...typography.body,
    width: '100%',
    height: spacing(7),
    paddingHorizontal: spacing(2)
  },

  text: {
    ...typography.body2,
    color: palette.neutralLight4,
    lineHeight: spacing(7),
    paddingHorizontal: spacing(1)
  },

  title: {
    color: palette.neutral,
    flexShrink: 1
  },

  landlord: {
    flexShrink: 1
  },

  active: {
    color: palette.primary
  },

  divider: {
    marginHorizontal: spacing(3),
    borderTopWidth: 1,
    borderTopColor: palette.neutralLight8
  },

  more: {
    color: palette.neutralLight4
  }
}))

type AgreementItemProps = {
  active: boolean
  showSkeleton?: boolean
  index: number
  digital_content?: LineupAgreement
}

const AgreementItem = ({ digital_content, active, index, showSkeleton }: AgreementItemProps) => {
  const styles = useStyles()
  return (
    <>
      <View style={styles.divider} />
      <View style={styles.item}>
        {showSkeleton ? (
          <Skeleton width='100%' height='10' />
        ) : !digital_content ? null : (
          <>
            <Text style={[styles.text, active && styles.active]}>
              {index + 1}
            </Text>
            <Text
              style={[styles.text, styles.title, active && styles.active]}
              numberOfLines={1}
            >
              {digital_content.title}
            </Text>
            <Text
              style={[styles.text, styles.landlord, active && styles.active]}
              numberOfLines={1}
            >
              {`by ${digital_content.user.name}`}
            </Text>
          </>
        )}
      </View>
    </>
  )
}

export const CollectionTileAgreementList = ({
  isLoading,
  onPress,
  agreementCount,
  agreements
}: LineupTileAgreementListProps) => {
  const styles = useStyles()
  const playingUid = useSelector(getPlayingUid)

  if (!agreements.length && isLoading) {
    return (
      <>
        {range(DISPLAY_AGREEMENT_COUNT).map((i) => (
          <AgreementItem key={i} active={false} index={i} showSkeleton />
        ))}
      </>
    )
  }

  return (
    <Pressable onPress={onPress}>
      {agreements.slice(0, DISPLAY_AGREEMENT_COUNT).map((digital_content, index) => (
        <AgreementItem
          key={digital_content.uid}
          active={playingUid === digital_content.uid}
          index={index}
          digital_content={digital_content}
        />
      ))}
      {agreementCount && agreementCount > 5 ? (
        <>
          <View style={styles.divider} />
          <Text style={[styles.item, styles.more]}>
            {`+${agreementCount - agreements.length} more agreements`}
          </Text>
        </>
      ) : null}
    </Pressable>
  )
}
