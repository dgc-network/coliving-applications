import { StyleSheet, View } from 'react-native'

import Skeleton from 'app/components/skeleton'
import { useThemedStyles } from 'app/hooks/useThemedStyles'

import { LineupTileActionButtons } from './LineupTileActionButtons'
import { LineupTileRoot } from './LineupTileRoot'
import { createStyles } from './styles'

const styles = StyleSheet.create({
  skeleton: {
    position: 'absolute',
    top: 0
  },
  metadata: {
    flexDirection: 'row'
  },
  bottomButtons: {
    position: 'absolute',
    bottom: 0,
    width: '100%'
  }
})

export const LineupTileSkeleton = () => {
  const agreementTileStyles = useThemedStyles(createStyles)
  return (
    <LineupTileRoot>
      <View style={styles.metadata}>
        <View style={[agreementTileStyles.imageContainer, agreementTileStyles.image]}>
          <Skeleton style={agreementTileStyles.image} />
        </View>

        <View style={[agreementTileStyles.titles]}>
          <View style={agreementTileStyles.title}>
            <Skeleton style={styles.skeleton} width='80%' height='80%' />
          </View>
          <View style={[agreementTileStyles.landlord, { width: '100%' }]}>
            <Skeleton style={styles.skeleton} width='60%' height='80%' />
          </View>
        </View>
      </View>

      <View style={styles.bottomButtons}>
        <LineupTileActionButtons disabled />
      </View>
    </LineupTileRoot>
  )
}
