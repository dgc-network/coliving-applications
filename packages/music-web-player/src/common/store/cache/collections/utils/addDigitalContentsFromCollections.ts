import { UserCollectionMetadata, UserDigitalContentMetadata } from '@coliving/common'

import { processAndCacheDigitalContents } from 'common/store/cache/digital_contents/utils'

export function* addDigitalContentsFromCollections(
  metadataArray: Array<UserCollectionMetadata>
) {
  const digitalContents: UserDigitalContentMetadata[] = []

  metadataArray.forEach((m) => {
    if (m.digitalContents) {
      m.digitalContents.forEach((t) => {
        digitalContents.push(t)
      })
    }
  })
  yield processAndCacheDigitalContents(digitalContents)
}
