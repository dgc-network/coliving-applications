import type { UserCollection } from '@coliving/common'
import type { ShareModalContent } from '@coliving/web/src/common/store/ui/share-modal/types'

import {
  getCollectionRoute,
  getDigitalContentRoute,
  getUserRoute
} from 'app/utils/routes'
import { getTwitterLink } from 'app/utils/twitter'

import { messages } from './messages'

export const getContentUrl = (content: ShareModalContent) => {
  switch (content.type) {
    case 'digital_content': {
      const { digital_content } = content
      return getDigitalContentRoute(digital_content, true)
    }
    case 'profile': {
      const { profile } = content
      return getUserRoute(profile, true)
    }
    case 'album': {
      const { album, author } = content
      return getCollectionRoute(
        { ...album, user: author } as unknown as UserCollection,
        true
      )
    }
    case 'contentList': {
      const { contentList, creator } = content
      return getCollectionRoute(
        { ...contentList, user: creator } as unknown as UserCollection,
        true
      )
    }
    // TODO: add liveNFTContentList link
    case 'liveNftContentList': {
      return ''
    }
  }
}

export const getTwitterShareText = (content: ShareModalContent) => {
  switch (content.type) {
    case 'digital_content': {
      const {
        digital_content: { title },
        author: { handle }
      } = content
      return messages.digitalContentShareText(title, handle)
    }
    case 'profile': {
      const {
        profile: { handle }
      } = content
      return messages.profileShareText(handle)
    }
    case 'album': {
      const {
        album: { content_list_name },
        author: { handle }
      } = content
      return messages.albumShareText(content_list_name, handle)
    }
    case 'contentList': {
      const {
        contentList: { content_list_name },
        creator: { handle }
      } = content
      return messages.contentListShareText(content_list_name, handle)
    }
    case 'liveNftContentList': {
      return messages.nftContentListShareText
    }
  }
}

export const getTwitterShareUrl = (content: ShareModalContent) => {
  const url = getContentUrl(content)
  const shareText = getTwitterShareText(content)
  return getTwitterLink(url ?? null, shareText)
}
