import { call, select } from 'typed-redux-saga'

import { getUserId } from 'common/store/account/selectors'
import { getAgreement } from 'common/store/cache/agreements/selectors'
import { retrieveUserAgreements } from 'common/store/pages/profile/lineups/agreements/retrieveUserAgreements'
import { PREFIX, agreementsActions } from 'common/store/pages/agreement/lineup/actions'
import {
  getLineup,
  getSourceSelector as sourceSelector
} from 'common/store/pages/agreement/selectors'
import { LineupSagas } from 'store/lineup/sagas'
import { waitForValue } from 'utils/sagaHelpers'

function* getAgreements({
  payload,
  offset = 0,
  limit = 6
}: {
  payload: {
    ownerHandle: string
    /** Permalink of agreement that should be loaded first */
    heroAgreementPermalink: string
  }
  offset?: number
  limit?: number
}) {
  const { ownerHandle, heroAgreementPermalink } = payload
  const currentUserId = yield* select(getUserId)

  const lineup = []
  const heroAgreement = yield* call(
    waitForValue,
    getAgreement,
    { permalink: heroAgreementPermalink },
    // Wait for the agreement to have a agreement_id (e.g. remix children could get fetched first)
    (agreement) => agreement.agreement_id
  )
  if (offset === 0) {
    lineup.push(heroAgreement)
  }
  const heroAgreementRemixParentAgreementId =
    heroAgreement.remix_of?.agreements?.[0]?.parent_agreement_id
  if (heroAgreementRemixParentAgreementId) {
    const remixParentAgreement = yield* call(waitForValue, getAgreement, {
      id: heroAgreementRemixParentAgreementId
    })
    if (offset <= 1) {
      lineup.push(remixParentAgreement)
    }
  }

  let moreByLandlordAgreementsOffset: number
  if (heroAgreementRemixParentAgreementId) {
    moreByLandlordAgreementsOffset = offset <= 1 ? 0 : offset - 2
  } else {
    moreByLandlordAgreementsOffset = offset === 0 ? 0 : offset - 1
  }

  const processed = yield* call(retrieveUserAgreements, {
    handle: ownerHandle,
    currentUserId,
    sort: 'plays',
    limit: limit + 2,
    // The hero agreement is always our first agreement and the remix parent is always the second agreement (if any):
    offset: moreByLandlordAgreementsOffset
  })

  return lineup
    .concat(
      processed
        // Filter out any agreement that matches the `excludePermalink` + the remix parent agreement (if any)
        .filter(
          (t) =>
            t.permalink !== heroAgreementPermalink &&
            t.agreement_id !== heroAgreementRemixParentAgreementId
        )
    )
    .slice(0, limit)
}

class AgreementsSagas extends LineupSagas {
  constructor() {
    super(
      PREFIX,
      agreementsActions,
      getLineup,
      getAgreements,
      undefined,
      undefined,
      sourceSelector
    )
  }
}

export default function sagas() {
  return new AgreementsSagas().getSagas()
}
