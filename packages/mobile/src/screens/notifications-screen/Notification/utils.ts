import type { EntityType } from '-client/src/common/store/notifications/types'

import { getCollectionRoute, getAgreementRoute } from 'app/utils/routes'

export const getEntityRoute = (entity: EntityType, fullUrl = false) => {
  if ('agreement_id' in entity) {
    return getAgreementRoute(entity, fullUrl)
  } else if (entity.user) {
    const { user } = entity
    return getCollectionRoute({ ...entity, user }, fullUrl)
  }
  return ''
}

export const getEntityScreen = (entity: EntityType) => {
  if ('agreement_id' in entity) {
    return {
      screen: 'Agreement' as const,
      params: { id: entity.agreement_id, fromNotifications: true }
    }
  }
  return {
    screen: 'Collection' as const,
    params: { id: entity.contentList_id, fromNotifications: true }
  }
}
