import type { EntityType } from '@coliving/web/src/common/store/notifications/types'

import { getCollectionRoute, getDigitalContentRoute } from 'app/utils/routes'

export const getEntityRoute = (entity: EntityType, fullUrl = false) => {
  if ('digital_content_id' in entity) {
    return getDigitalContentRoute(entity, fullUrl)
  } else if (entity.user) {
    const { user } = entity
    return getCollectionRoute({ ...entity, user }, fullUrl)
  }
  return ''
}

export const getEntityScreen = (entity: EntityType) => {
  if ('digital_content_id' in entity) {
    return {
      screen: 'DigitalContent' as const,
      params: { id: entity.digital_content_id, fromNotifications: true }
    }
  }
  return {
    screen: 'Collection' as const,
    params: { id: entity.content_list_id, fromNotifications: true }
  }
}
