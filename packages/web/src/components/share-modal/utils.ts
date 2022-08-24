import { ShareToTwitter } from '@coliving/common'

import { ShareModalContent } from 'common/store/ui/share-modal/types'
import {
  fullAlbumPage,
  fullContentListPage,
  fullProfilePage,
  fullAgreementPage,
  fullAudioNftContentListPage
} from 'utils/route'

import { messages } from './messages'

type ShareToTwitterEvent = Omit<ShareToTwitter, 'eventName' | 'source'>

export const getTwitterShareText = (
  content: ShareModalContent,
  isContentListOwner = false
) => {
  let twitterText = ''
  let link = ''
  let analyticsEvent: ShareToTwitterEvent
  switch (content.type) {
    case 'agreement': {
      const {
        agreement: { title, permalink, agreement_id },
        landlord: { handle }
      } = content
      twitterText = messages.agreementShareText(title, handle)
      link = fullAgreementPage(permalink)
      analyticsEvent = { kind: 'agreement', id: agreement_id, url: link }
      break
    }
    case 'profile': {
      const {
        profile: { handle, user_id }
      } = content
      twitterText = messages.profileShareText(handle)
      link = fullProfilePage(handle)
      analyticsEvent = { kind: 'profile', id: user_id, url: link }
      break
    }
    case 'album': {
      const {
        album: { content_list_name, content_list_id },
        landlord: { handle }
      } = content
      twitterText = messages.albumShareText(content_list_name, handle)
      link = fullAlbumPage(handle, content_list_name, content_list_id)
      analyticsEvent = { kind: 'album', id: content_list_id, url: link }
      break
    }
    case 'contentList': {
      const {
        contentList: { content_list_name, content_list_id },
        creator: { handle }
      } = content
      twitterText = messages.contentListShareText(content_list_name, handle)
      link = fullContentListPage(handle, content_list_name, content_list_id)
      analyticsEvent = { kind: 'contentList', id: content_list_id, url: link }
      break
    }
    case 'liveNftContentList': {
      const {
        user: { handle, name, user_id }
      } = content
      twitterText = messages.liveNftContentListShareText(
        isContentListOwner ? 'my' : name
      )
      link = fullAudioNftContentListPage(handle)
      analyticsEvent = { kind: 'liveNftContentList', id: user_id, url: link }
      break
    }
  }

  return { twitterText, link, analyticsEvent }
}
