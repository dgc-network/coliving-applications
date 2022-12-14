import { Collection, DigitalContent, Nullable } from '@coliving/common'
import { createSelector } from 'reselect'

import { CommonState } from 'common/store'
import { getAccountUser } from 'common/store/account/selectors'
import {
  getCollection,
  getCollections
} from 'common/store/cache/collections/selectors'
import { getDigitalContent, getDigitalContents } from 'common/store/cache/digital_contents/selectors'
import { getUser, getUsers } from 'common/store/cache/users/selectors'

import {
  Entity,
  Notification,
  NotificationType,
  Achievement,
  Announcement,
  EntityType,
  AddDigitalContentToContentList,
  CollectionEntity,
  DigitalContentEntity
} from './types'

const getBaseState = (state: CommonState) => state.pages.notifications

// Notification selectors
export const getNotificationPanelIsOpen = (state: CommonState) =>
  getBaseState(state).panelIsOpen
export const getNotificationModalIsOpen = (state: CommonState) =>
  getBaseState(state).modalIsOpen
export const getAllNotifications = (state: CommonState) =>
  getBaseState(state).notifications
export const getModalNotificationId = (state: CommonState) =>
  getBaseState(state).modalNotificationId
export const getModalNotificationIds = (state: CommonState) =>
  getBaseState(state).allIds
export const getNotificationUnviewedCount = (state: CommonState) =>
  getBaseState(state).totalUnviewed
export const getNotificationStatus = (state: CommonState) =>
  getBaseState(state).status
export const getNotificationHasMore = (state: CommonState) =>
  getBaseState(state).hasMore
export const getNotificationUserList = (state: CommonState) =>
  getBaseState(state).userList
export const getNotificationHasLoaded = (state: CommonState) =>
  getBaseState(state).hasLoaded

export const getLastNotification = (state: CommonState) => {
  const allIds = getBaseState(state).allIds
  if (allIds.length === 0) return null
  const lastNotificationId = allIds[allIds.length - 1]
  return getBaseState(state).notifications[lastNotificationId]
}

export const getNotificationById = (
  state: CommonState,
  notificationId: string
) => getBaseState(state).notifications[notificationId]

export const getModalNotification = (state: CommonState) =>
  getBaseState(state).modalNotificationId
    ? (getBaseState(state).notifications[
        getBaseState(state).modalNotificationId!
      ] as Announcement) || null
    : null

export const getContentListUpdates = (state: CommonState) =>
  getBaseState(state).contentListUpdates

export const makeGetAllNotifications = () => {
  return createSelector(
    [getModalNotificationIds, getAllNotifications],
    (notificationIds, notifications) => {
      return notificationIds.map(
        (notificationId) => notifications[notificationId]
      )
    }
  )
}

export const getNotificationUser = (
  state: CommonState,
  notification: Notification
) => {
  if (
    notification.type === NotificationType.Milestone &&
    notification.achievement === Achievement.Followers
  ) {
    return getAccountUser(state)
  } else if ('userId' in notification) {
    return getUser(state, { id: notification.userId })
  } else if (
    'entityId' in notification &&
    'entityType' in notification &&
    notification.entityType === Entity.User
  ) {
    return getUser(state, { id: notification.entityId })
  }
}

export const getNotificationUsers = (
  state: CommonState,
  notification: Notification,
  limit: number
) => {
  if ('userIds' in notification) {
    const userIds = notification.userIds.slice(0, limit)
    const userMap = getUsers(state, { ids: userIds })
    return userIds.map((id) => userMap[id])
  }
  return null
}

export const getNotificationEntity = (
  state: CommonState,
  notification: Notification
) => {
  if (
    'entityId' in notification &&
    'entityType' in notification &&
    notification.entityType !== Entity.User
  ) {
    const getEntity =
      notification.entityType === Entity.DigitalContent ? getDigitalContent : getCollection
    const entity = getEntity(state, { id: notification.entityId })
    if (entity) {
      const userId =
        'owner_id' in entity ? entity.owner_id : entity.content_list_owner_id
      return {
        ...entity,
        user: getUser(state, { id: userId })
      }
    }
    return entity
  }
  return null
}

type EntityTypes<T extends AddDigitalContentToContentList | Notification> =
  T extends AddDigitalContentToContentList
    ? { digital_content: DigitalContentEntity; contentList: CollectionEntity }
    : Nullable<EntityType[]>

export const getNotificationEntities = <
  T extends AddDigitalContentToContentList | Notification
>(
  state: CommonState,
  notification: T
): EntityTypes<T> => {
  if (notification.type === NotificationType.AddDigitalContentToContentList) {
    const digital_content = getDigitalContent(state, { id: notification.digitalContentId })
    const currentUser = getAccountUser(state)
    const contentList = getCollection(state, { id: notification.contentListId })
    const contentListOwner = getUser(state, { id: notification.contentListOwnerId })
    return {
      digital_content: { ...digital_content, user: currentUser },
      contentList: { ...contentList, user: contentListOwner }
    } as EntityTypes<T>
  }

  if ('entityIds' in notification && 'entityType' in notification) {
    const getEntities =
      notification.entityType === Entity.DigitalContent ? getDigitalContents : getCollections
    const entityMap = getEntities(state, { ids: notification.entityIds })
    const entities = notification.entityIds
      .map((id: number) => (entityMap as any)[id])
      .map((entity: DigitalContent | Collection | null) => {
        if (entity) {
          const userId =
            'owner_id' in entity ? entity.owner_id : entity.content_list_owner_id
          return {
            ...entity,
            user: getUser(state, { id: userId })
          }
        }
        return null
      })
      .filter((entity): entity is EntityType => !!entity)
    return entities as EntityTypes<T>
  }
  return null as EntityTypes<T>
}
