import { Entity, EntityType } from 'common/store/notifications/types'
import ColivingBackend from 'services/ColivingBackend'
import { UserListEntityType } from 'store/application/ui/userListModal/types'
import {
  albumPage,
  fullAlbumPage,
  fullPlaylistPage,
  fullAgreementPage,
  playlistPage
} from 'utils/route'

export const getEntityLink = (entity: EntityType, fullRoute = false) => {
  if (!entity.user) return ''
  if ('agreement_id' in entity) {
    return fullRoute ? fullAgreementPage(entity.permalink) : entity.permalink
  } else if (entity.user && entity.playlist_id && entity.is_album) {
    const getRoute = fullRoute ? fullAlbumPage : albumPage
    return getRoute(
      entity.user.handle,
      entity.playlist_name,
      entity.playlist_id
    )
  }
  if (entity.user) {
    const getRoute = fullRoute ? fullPlaylistPage : playlistPage
    return getRoute(
      entity.user.handle,
      entity.playlist_name,
      entity.playlist_id
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
  [Entity.Agreement]: UserListEntityType.AGREEMENT,
  [Entity.User]: UserListEntityType.USER,
  [Entity.Album]: UserListEntityType.COLLECTION,
  [Entity.Playlist]: UserListEntityType.COLLECTION
}
