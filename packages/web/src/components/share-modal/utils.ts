import { ShareToTwitter } from '@coliving/common'

import { ShareModalContent } from 'common/store/ui/share-modal/types'
import {
  fullAlbumPage,
  fullPlaylistPage,
  fullProfilePage,
  fullAgreementPage,
  fullAudioNftPlaylistPage
} from 'utils/route'

import { messages } from './messages'

type ShareToTwitterEvent = Omit<ShareToTwitter, 'eventName' | 'source'>

export const getTwitterShareText = (
  content: ShareModalContent,
  isPlaylistOwner = false
) => {
  let twitterText = ''
  let link = ''
  let analyticsEvent: ShareToTwitterEvent
  switch (content.type) {
    case 'agreement': {
      const {
        agreement: { title, permalink, agreement_id },
        artist: { handle }
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
        album: { content list_name, content list_id },
        artist: { handle }
      } = content
      twitterText = messages.albumShareText(content list_name, handle)
      link = fullAlbumPage(handle, content list_name, content list_id)
      analyticsEvent = { kind: 'album', id: content list_id, url: link }
      break
    }
    case 'content list': {
      const {
        content list: { content list_name, content list_id },
        creator: { handle }
      } = content
      twitterText = messages.content listShareText(content list_name, handle)
      link = fullPlaylistPage(handle, content list_name, content list_id)
      analyticsEvent = { kind: 'content list', id: content list_id, url: link }
      break
    }
    case 'liveNftPlaylist': {
      const {
        user: { handle, name, user_id }
      } = content
      twitterText = messages.liveNftPlaylistShareText(
        isPlaylistOwner ? 'my' : name
      )
      link = fullAudioNftPlaylistPage(handle)
      analyticsEvent = { kind: 'liveNftPlaylist', id: user_id, url: link }
      break
    }
  }

  return { twitterText, link, analyticsEvent }
}
