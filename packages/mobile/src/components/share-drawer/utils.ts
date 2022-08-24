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
      const { album, landlord } = content
      return getCollectionRoute(
        { ...album, user: landlord } as unknown as UserCollection,
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
    case 'agreement': {
      const {
        agreement: { title },
        landlord: { handle }
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
        album: { content_list_name },
        landlord: { handle }
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
