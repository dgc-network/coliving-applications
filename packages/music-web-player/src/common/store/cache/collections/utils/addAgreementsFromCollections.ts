import { UserCollectionMetadata, UserAgreementMetadata } from '@coliving/common'

import { processAndCacheAgreements } from 'common/store/cache/agreements/utils'

export function* addAgreementsFromCollections(
  metadataArray: Array<UserCollectionMetadata>
) {
  const agreements: UserAgreementMetadata[] = []

  metadataArray.forEach((m) => {
    if (m.agreements) {
      m.agreements.forEach((t) => {
        agreements.push(t)
      })
    }
  })
  yield processAndCacheAgreements(agreements)
}
