import type { LineupDigitalContent } from '@coliving/common'
import { range } from 'lodash'
import { Pressable, Text, View } from 'react-native'
import { useSelector } from 'react-redux'

import Skeleton from 'app/components/skeleton'
import { getPlayingUid } from 'app/store/digitalcoin/selectors'
import { flexRowCentered, makeStyles } from 'app/styles'
import type { GestureResponderHandler } from 'app/types/gesture'

// Max number of digitalContents to display
const DISPLAY_DIGITAL_CONTENT_COUNT = 5

type LineupTileDigitalContentListProps = {
  isLoading?: boolean
  onPress: GestureResponderHandler
  digitalContentCount?: number
  digitalContents: LineupDigitalContent[]
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

  author: {
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

type DigitalContentItemProps = {
  active: boolean
  showSkeleton?: boolean
  index: number
  digital_content?: LineupDigitalContent
}

const DigitalContentItem = ({ digital_content, active, index, showSkeleton }: DigitalContentItemProps) => {
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
              style={[styles.text, styles.author, active && styles.active]}
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

export const CollectionTileDigitalContentList = ({
  isLoading,
  onPress,
  digitalContentCount,
  digitalContents
}: LineupTileDigitalContentListProps) => {
  const styles = useStyles()
  const playingUid = useSelector(getPlayingUid)

  if (!digitalContents.length && isLoading) {
    return (
      <>
        {range(DISPLAY_DIGITAL_CONTENT_COUNT).map((i) => (
          <DigitalContentItem key={i} active={false} index={i} showSkeleton />
        ))}
      </>
    )
  }

  return (
    <Pressable onPress={onPress}>
      {digitalContents.slice(0, DISPLAY_DIGITAL_CONTENT_COUNT).map((digital_content, index) => (
        <DigitalContentItem
          key={digital_content.uid}
          active={playingUid === digital_content.uid}
          index={index}
          digital_content={digital_content}
        />
      ))}
      {digitalContentCount && digitalContentCount > 5 ? (
        <>
          <View style={styles.divider} />
          <Text style={[styles.item, styles.more]}>
            {`+${digitalContentCount - digitalContents.length} more digitalContents`}
          </Text>
        </>
      ) : null}
    </Pressable>
  )
}
