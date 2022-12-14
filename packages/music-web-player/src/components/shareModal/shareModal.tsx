import { useCallback, useContext } from 'react'

import { Name, FeatureFlags } from '@coliving/common'
import { useDispatch } from 'react-redux'

import { getAccountUser } from 'common/store/account/selectors'
import {
  shareAudioNftContentList,
  shareCollection
} from 'common/store/social/collections/actions'
import { shareDigitalContent } from 'common/store/social/digital_contents/actions'
import { shareUser } from 'common/store/social/users/actions'
import { getShareState } from 'common/store/ui/shareModal/selectors'
import { requestOpen as requestOpenTikTokModal } from 'common/store/ui/shareSoundToTiktokModal/slice'
import { ToastContext } from 'components/toast/toastContext'
import { useFlag } from 'hooks/useRemoteConfig'
import { useModalState } from 'pages/modals/useModalState'
import { make, useRecord } from 'store/analytics/actions'
import { isMobile } from 'utils/clientUtil'
import { SHARE_TOAST_TIMEOUT_MILLIS } from 'utils/constants'
import { useSelector } from 'utils/reducer'
import { openTwitterLink } from 'utils/tweet'

import { ShareDialog } from './components/shareDialog'
import { ShareDrawer } from './components/shareDrawer'
import { messages } from './messages'
import { getTwitterShareText } from './utils'

export const ShareModal = () => {
  const { isOpen, onClose, onClosed } = useModalState('Share')

  const { toast } = useContext(ToastContext)
  const dispatch = useDispatch()
  const record = useRecord()
  const { content, source } = useSelector(getShareState)
  const account = useSelector(getAccountUser)

  const { isEnabled: isShareSoundToTikTokEnabled } = useFlag(
    FeatureFlags.SHARE_SOUND_TO_TIKTOK
  )

  const isOwner =
    content?.type === 'digital_content' && account?.user_id === content.author.user_id

  const handleShareToTwitter = useCallback(() => {
    if (!source || !content) return
    const isContentListOwner =
      content.type === 'liveNftContentList' &&
      account?.user_id === content.user.user_id
    const { twitterText, link, analyticsEvent } = getTwitterShareText(
      content,
      isContentListOwner
    )
    openTwitterLink(link, twitterText)
    record(make(Name.SHARE_TO_TWITTER, { source, ...analyticsEvent }))
    onClose()
  }, [source, content, account, record, onClose])

  const handleShareToTikTok = useCallback(() => {
    if (content?.type === 'digital_content') {
      dispatch(requestOpenTikTokModal({ id: content.digital_content.digital_content_id }))
      onClose()
    } else {
      console.error('Tried to share sound to TikTok but digital_content was missing')
    }
  }, [content, dispatch, onClose])

  const handleCopyLink = useCallback(() => {
    if (!source || !content) return
    switch (content.type) {
      case 'digital_content':
        dispatch(shareDigitalContent(content.digital_content.digital_content_id, source))
        break
      case 'profile':
        dispatch(shareUser(content.profile.user_id, source))
        break
      case 'album':
        dispatch(shareCollection(content.album.content_list_id, source))
        break
      case 'contentList':
        dispatch(shareCollection(content.contentList.content_list_id, source))
        break
      case 'liveNftContentList':
        dispatch(shareAudioNftContentList(content.user.handle, source))
        break
    }
    toast(messages.toast(content.type), SHARE_TOAST_TIMEOUT_MILLIS)
    onClose()
  }, [dispatch, toast, content, source, onClose])

  const shareProps = {
    isOpen,
    isOwner,
    onShareToTwitter: handleShareToTwitter,
    onShareToTikTok: handleShareToTikTok,
    onCopyLink: handleCopyLink,
    onClose,
    onClosed,
    showTikTokShareAction: Boolean(
      content?.type === 'digital_content' &&
        isShareSoundToTikTokEnabled &&
        isOwner &&
        !content.digital_content.is_unlisted &&
        !content.digital_content.is_delete
    ),
    shareType: content?.type ?? 'digital_content'
  }

  if (isMobile()) return <ShareDrawer {...shareProps} />
  return <ShareDialog {...shareProps} />
}
