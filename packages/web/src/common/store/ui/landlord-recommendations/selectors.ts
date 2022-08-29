import { ID, removeNullable } from '@coliving/common'

import { CommonState } from 'common/store'
import { getUsers } from 'common/store/cache/users/selectors'
import { createDeepEqualSelector } from 'common/utils/selectorHelpers'

const getRelatedLandlordIds = (state: CommonState, props: { id: ID }) =>
  state.ui.landlordRecommendations[props.id]?.relatedLandlordIds

export const makeGetRelatedLandlords = () =>
  createDeepEqualSelector(
    [getRelatedLandlordIds, getUsers],
    (relatedLandlordIds, users) => {
      if (!relatedLandlordIds) return []
      const relatedLandlordsPopulated = relatedLandlordIds
        .map((id) => {
          if (id in users) return users[id]
          return null
        })
        .filter(removeNullable)
      return relatedLandlordsPopulated
    }
  )
