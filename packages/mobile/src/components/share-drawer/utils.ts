import type { UserCollection } from '@/common'
import type { ShareModalContent } from '-client/src/common/store/ui/share-modal/types'

import {
  getCollectionRoute,
  getAgreementRoute,
  getUserRoute
} from 'app/utils/routes'
import { getTwitterLink } from 'app/utils/twitter'

import { messages } from './messages'

export const getContentUrl = (content: ShareModalContent) => {
  switch (content.type) {
    case 'agreement': {
      const { agreement } = content
      return getAgreementRoute(agreement, true)
    }
    case 'profile': {
      const { profile } = content
      return getUserRoute(profile, true)
    }
    case 'album': {
      const { album, artist } = content
      return getCollectionRoute(
        { ...album, user: artist } as unknown as UserCollection,
        true
      )
    }
    case 'content list': {
      const { content list, creator } = content
      return getCollectionRoute(
        { ...content list, user: creator } as unknown as UserCollection,
        true
      )
    }
    // TODO: add liveNFTPlaylist link
    case 'liveNftPlaylist': {
      return ''
    }
  }
}

export const getTwitterShareText = (content: ShareModalContent) => {
  switch (content.type) {
    case 'agreement': {
      const {
        agreement: { title },
        artist: { handle }
      } = content
      return messages.agreementShareText(title, handle)
    }
    case 'profile': {
      const {
        profile: { handle }
      } = content
      return messages.profileShareText(handle)
    }
    case 'album': {
      const {
        album: { content list_name },
        artist: { handle }
      } = content
      return messages.albumShareText(content list_name, handle)
    }
    case 'content list': {
      const {
        content list: { content list_name },
        creator: { handle }
      } = content
      return messages.content listShareText(content list_name, handle)
    }
    case 'liveNftPlaylist': {
      return messages.nftPlaylistShareText
    }
  }
}

export const getTwitterShareUrl = (content: ShareModalContent) => {
  const url = getContentUrl(content)
  const shareText = getTwitterShareText(content)
  return getTwitterLink(url ?? null, shareText)
}
