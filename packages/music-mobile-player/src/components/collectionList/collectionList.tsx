import type { UserCollection } from '@coliving/common'

import { CollectionCard } from 'app/components/collectionCard'
import type { CardListProps } from 'app/components/core'
import { CardList } from 'app/components/core'

type ListProps = Omit<
  CardListProps<UserCollection>,
  'data' | 'renderItem' | 'ListEmptyComponent'
>

type CollectionListProps = {
  collection: UserCollection[]
  fromPage?: string
} & ListProps

export const CollectionList = (props: CollectionListProps) => {
  const { collection, fromPage, ...other } = props
  return (
    <CardList
      data={collection}
      renderItem={({ item }) => (
        <CollectionCard collection={item} fromPage={fromPage} />
      )}
      {...other}
    />
  )
}
