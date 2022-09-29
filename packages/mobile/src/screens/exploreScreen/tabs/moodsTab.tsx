import { View } from 'react-native'

import { ScrollView } from 'app/components/core'
import { makeStyles } from 'app/styles'

import {
  CHILL_CONTENT_LISTS,
  PROVOKING_CONTENT_LISTS,
  INTIMATE_CONTENT_LISTS,
  UPBEAT_CONTENT_LISTS,
  INTENSE_CONTENT_LISTS
} from '../collections'
import { ColorTile } from '../components/colorTile'
import { TabInfo } from '../components/tabInfo'

const messages = {
  infoHeader: 'ContentLists to Fit Your Mood',
  infoText: 'ContentLists made by Coliving users, sorted by mood and feel.'
}

const useStyles = makeStyles(({ spacing }) => ({
  tabContainer: {
    flex: 1
  },
  contentContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing(3),
    paddingVertical: spacing(6)
  }
}))

const tiles = [
  CHILL_CONTENT_LISTS,
  UPBEAT_CONTENT_LISTS,
  INTENSE_CONTENT_LISTS,
  PROVOKING_CONTENT_LISTS,
  INTIMATE_CONTENT_LISTS
]

export const MoodsTab = () => {
  const styles = useStyles()

  return (
    <ScrollView style={styles.tabContainer}>
      <TabInfo header={messages.infoHeader} text={messages.infoText} />
      <View style={styles.contentContainer}>
        {tiles.map((tile, idx) => (
          <ColorTile
            style={{
              flex: 1,
              flexBasis: idx === 0 ? '100%' : '40%',
              marginLeft: idx && !(idx % 2) ? 8 : 0,
              marginBottom: 8
            }}
            key={tile.title}
            isIncentivized={tile.incentivized}
            {...tile}
          />
        ))}
      </View>
    </ScrollView>
  )
}
