import { useCallback } from 'react'

import type { UserCollection } from '@/common'
import type { StyleProp, ViewStyle } from 'react-native'

import { Card } from 'app/components/card'
import { useNavigation } from 'app/hooks/useNavigation'
import { formatCount } from 'app/utils/format'
import { getCollectionRoute } from 'app/utils/routes'

const formatContentListCardSecondaryText = (saves: number, agreements: number) => {
  const savesText = saves === 1 ? 'Favorite' : 'Favorites'
  const agreementsText = agreements === 1 ? 'Agreement' : 'Agreements'
  return `${formatCount(saves)} ${savesText} • ${agreements} ${agreementsText}`
}

type CollectionCardProps = {
  collection: UserCollection
  /**
   * Optional source page that establishes the `fromPage` for web-routes.
   */
  fromPage?: string
  style?: StyleProp<ViewStyle>
}

export const CollectionCard = ({
  collection,
  fromPage,
  style
}: CollectionCardProps) => {
  const navigation = useNavigation()
  const handlePress = useCallback(() => {
    const collectionRoute = getCollectionRoute(collection)
    navigation.push({
      native: { screen: 'Collection', params: { id: collection.content_list_id } },
      web: { route: collectionRoute, fromPage }
    })
  }, [navigation, collection, fromPage])

  return (
    <Card
      style={style}
      id={collection.content_list_id}
      type='collection'
      imageSize={collection._cover_art_sizes}
      primaryText={collection.content_list_name}
      secondaryText={formatContentListCardSecondaryText(
        collection.save_count,
        collection.content_list_contents.agreement_ids.length
      )}
      onPress={handlePress}
      user={collection.user}
    />
  )
}
