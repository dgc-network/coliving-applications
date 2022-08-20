import { useCallback } from 'react'

import { FavoriteSource } from '@/common'
import { getContentListLibrary } from '-client/src/common/store/account/selectors'
import { getCollection } from '-client/src/common/store/pages/smart-collection/selectors'
import { findInContentListLibrary } from '-client/src/common/store/contentList-library/helpers'
import {
  saveSmartCollection,
  unsaveSmartCollection
} from '-client/src/common/store/social/collections/actions'
import { View } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'

import { VirtualizedScrollView } from 'app/components/core'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { CollectionScreenDetailsTile } from 'app/screens/collection-screen/CollectionScreenDetailsTile'
import type { SmartCollection as SmartCollectionsmartCollection } from 'app/screens/explore-screen/smartCollections'
import { makeStyles } from 'app/styles'

const useStyles = makeStyles(({ spacing }) => ({
  root: {
    flex: 1,
    padding: spacing(3)
  },
  imageIcon: {
    opacity: 0.3,
    maxWidth: '100%',
    height: '100%'
  }
}))

type SmartCollectionScreenProps = {
  smartCollection: SmartCollectionsmartCollection
}

/**
 * `SmartCollectionScreen` displays the details of a smart collection
 */
export const SmartCollectionScreen = ({
  smartCollection
}: SmartCollectionScreenProps) => {
  const styles = useStyles()
  const dispatchWeb = useDispatchWeb()

  const collection = useSelectorWeb((state) =>
    getCollection(state, { variant: smartCollection.variant })
  )

  const contentListName = collection?.contentList_name ?? smartCollection.title
  const description = collection?.description ?? smartCollection.description

  const contentListLibrary = useSelectorWeb(getContentListLibrary)

  const isSaved = contentListLibrary
    ? !!findInContentListLibrary(contentListLibrary, smartCollection.variant)
    : false

  const handlePressSave = useCallback(() => {
    if (collection?.has_current_user_saved) {
      dispatchWeb(
        unsaveSmartCollection(
          smartCollection.variant,
          FavoriteSource.COLLECTION_PAGE
        )
      )
    } else {
      dispatchWeb(
        saveSmartCollection(
          smartCollection.variant,
          FavoriteSource.COLLECTION_PAGE
        )
      )
    }
  }, [collection, smartCollection, dispatchWeb])

  const renderImage = () => {
    const Icon = smartCollection.icon
    return (
      <LinearGradient
        colors={smartCollection.gradientColors}
        angle={smartCollection.gradientAngle}
      >
        {Icon ? (
          <View style={styles.imageIcon}>
            <Icon width='100%' height='100%' />
          </View>
        ) : null}
      </LinearGradient>
    )
  }

  return (
    <VirtualizedScrollView
      listKey={`${contentListName}_ContentList_Screen`}
      style={styles.root}
    >
      <CollectionScreenDetailsTile
        description={description}
        hasSaved={isSaved}
        hideFavoriteCount
        hideOverflow
        hideRepost
        hideRepostCount
        hideShare
        onPressSave={handlePressSave}
        renderImage={renderImage}
        title={contentListName}
      />
    </VirtualizedScrollView>
  )
}
