import { ShareType } from 'common/store/ui/shareModal/types'

export type ShareProps = {
  onShareToTwitter: () => void
  onShareToTikTok: () => void
  onCopyLink: () => void
  isOpen: boolean
  onClose: () => void
  onClosed: () => void
  showTikTokShareAction?: boolean
  shareType: ShareType
}
