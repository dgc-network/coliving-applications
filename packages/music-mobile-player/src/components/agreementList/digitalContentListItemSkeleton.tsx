import { View } from 'react-native'

import Skeleton from 'app/components/skeleton'
import { makeStyles } from 'app/styles'

const useStyles = makeStyles(({ palette, spacing }) => ({
  digitalContentContainer: {
    width: '100%',
    height: 72,
    backgroundColor: palette.white,
    paddingVertical: spacing(3),
    paddingHorizontal: spacing(6),
    justifyContent: 'center'
  }
}))

export const DigitalContentListItemSkeleton = () => {
  const styles = useStyles()

  return (
    <View style={styles.digitalContentContainer}>
      <Skeleton style={{ height: 16, marginBottom: 2 }} width='54%' />
      <Skeleton style={{ height: 16 }} width='30%' />
    </View>
  )
}
