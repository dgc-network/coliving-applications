import { Status } from '@coliving/common'
import {
  getCollections,
  getStatus
} from '@coliving/web/src/common/store/pages/explore/exploreCollections/selectors'
import { ExploreCollectionsVariant } from '@coliving/web/src/common/store/pages/explore/types'

import { CollectionList } from 'app/components/collectionList'
import { Screen } from 'app/components/core'
import { Header } from 'app/components/header'
import { WithLoader } from 'app/components/withLoader/withLoader'
import { isEqual, useSelectorWeb } from 'app/hooks/useSelectorWeb'

import { TOP_ALBUMS } from '../../collections'

export const TopAlbumsScreen = () => {
  const status = useSelectorWeb(
    (state) =>
      getStatus(state, { variant: ExploreCollectionsVariant.TOP_ALBUMS }),
    isEqual
  )
  const exploreData = useSelectorWeb((state) =>
    getCollections(state, { variant: ExploreCollectionsVariant.TOP_ALBUMS })
  )

  return (
    <Screen>
      <Header text={TOP_ALBUMS.title} />
      <WithLoader loading={status === Status.LOADING}>
        <CollectionList collection={exploreData} />
      </WithLoader>
    </Screen>
  )
}
