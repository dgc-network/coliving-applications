import { Entity, EntityType } from 'common/store/notifications/types'
import ColivingBackend from 'services/colivingBackend'
import { UserListEntityType } from 'store/application/ui/userListModal/types'
import {
  albumPage,
  fullAlbumPage,
  fullContentListPage,
  fullDigitalContentPage,
  contentListPage
} from 'utils/route'

export const getEntityLink = (entity: EntityType, fullRoute = false) => {
  if (!entity.user) return ''
  if ('digital_content_id' in entity) {
    return fullRoute ? fullDigitalContentPage(entity.permalink) : entity.permalink
  } else if (entity.user && entity.content_list_id && entity.is_album) {
    const getRoute = fullRoute ? fullAlbumPage : albumPage
    return getRoute(
      entity.user.handle,
      entity.content_list_name,
      entity.content_list_id
    )
  }
  if (entity.user) {
    const getRoute = fullRoute ? fullContentListPage : contentListPage
    return getRoute(
      entity.user.handle,
      entity.content_list_name,
      entity.content_list_id
    )
  }
  return ''
}

export const getRankSuffix = (rank: number) => {
  if (rank === 1) return 'st'
  if (rank === 2) return 'nd'
  if (rank === 3) return 'rd'
  return 'th'
}

export const getTwitterHandleByUserHandle = async (userHandle: string) => {
  const { twitterHandle } = await ColivingBackend.getCreatorSocialHandle(
    userHandle
  )
  return twitterHandle || ''
}

export const USER_LENGTH_LIMIT = 9

export const entityToUserListEntity = {
  [Entity.DigitalContent]: UserListEntityType.DIGITAL_CONTENT,
  [Entity.User]: UserListEntityType.USER,
  [Entity.Album]: UserListEntityType.COLLECTION,
  [Entity.ContentList]: UserListEntityType.COLLECTION
}
