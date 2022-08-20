import { useCallback } from 'react'

import { Name, User, FeatureFlags } from '@coliving/common'
import { Button, ButtonType, IconTikTok, IconTwitterBird } from '@coliving/stems'
import cn from 'classnames'
import { useDispatch } from 'react-redux'

import backgroundPlaceholder from 'assets/img/1-Concert-3-1.jpg'
import { ReactComponent as IconShare } from 'assets/img/iconShare.svg'
import { useModalState } from 'common/hooks/useModalState'
import { open as openTikTokModal } from 'common/store/ui/share-sound-to-tiktok-modal/slice'
import Toast from 'components/toast/Toast'
import { MountPlacement, ComponentPlacement } from 'components/types'
import { useFlag } from 'hooks/useRemoteConfig'
import ColivingBackend from 'services/ColivingBackend'
import apiClient from 'services/coliving-api-client/ColivingAPIClient'
import { useRecord, make } from 'store/analytics/actions'
import { copyLinkToClipboard } from 'utils/clipboardUtil'
import {
  fullAlbumPage,
  fullPlaylistPage,
  fullProfilePage,
  fullAgreementPage,
  profilePage,
  albumPage,
  content listPage
} from 'utils/route'
import { openTwitterLink } from 'utils/tweet'

import { UploadPageState } from '../store/types'

import styles from './ShareBanner.module.css'

type UploadType = 'Agreement' | 'Agreements' | 'Album' | 'Playlist' | 'Remix'
type ContinuePage = 'Agreement' | 'Profile' | 'Album' | 'Playlist' | 'Remix'

type ShareBannerProps = {
  isHidden: boolean
  type: UploadType
  upload: UploadPageState
  user: User
}

const messages = {
  title: (type: UploadType) =>
    `Your ${type} ${type === 'Agreements' ? 'Are' : 'Is'} Live!`,
  description: 'Now it’s time to spread the word and share it with your fans!',
  share: 'Share With Your Fans',
  shareToTikTok: 'Share Sound to TikTok',
  copy: (page: ContinuePage) => `Copy Link to ${page}`,
  copiedToClipboard: 'Copied to Clipboard'
}

const getContinuePage = (uploadType: UploadType) => {
  if (uploadType === 'Agreements') return 'Profile'
  return uploadType
}

const getTwitterHandleByUserHandle = async (userHandle: string) => {
  const { twitterHandle } = await ColivingBackend.getCreatorSocialHandle(
    userHandle
  )
  return twitterHandle || ''
}

const getShareTextUrl = async (
  uploadType: UploadType,
  user: User,
  upload: UploadPageState,
  fullUrl = true
) => {
  switch (uploadType) {
    case 'Agreement': {
      const { title, permalink } = upload.agreements[0].metadata
      const url = fullUrl ? fullAgreementPage(permalink) : permalink
      return {
        text: `Check out my new agreement, ${title} on @dgc-network #Coliving`,
        url
      }
    }
    case 'Remix': {
      const { permalink } = upload.agreements[0].metadata
      const parent_agreement_id =
        upload.agreements[0].metadata?.remix_of?.agreements[0].parent_agreement_id
      if (!parent_agreement_id) return { text: '', url: '' }

      const url = fullUrl ? fullAgreementPage(permalink) : permalink
      const parentAgreement = await apiClient.getAgreement({ id: parent_agreement_id })
      if (!parentAgreement) return { text: '', url: '' }

      const parentAgreementUser = parentAgreement.user

      let twitterHandle = await getTwitterHandleByUserHandle(
        parentAgreementUser.handle
      )
      if (!twitterHandle) twitterHandle = parentAgreementUser.name
      else twitterHandle = `@${twitterHandle}`

      return {
        text: `Check out my new remix of ${parentAgreement.title} by ${twitterHandle} on @dgc-network #Coliving`,
        url
      }
    }
    case 'Agreements': {
      const getPage = fullUrl ? fullProfilePage : profilePage
      const url = getPage(user.handle)
      return { text: `Check out my new agreements on @dgc-network #Coliving`, url }
    }
    case 'Album': {
      // @ts-ignore
      const { content list_name: title } = upload.metadata
      const getPage = fullUrl ? fullAlbumPage : albumPage
      const url = getPage(user.handle, title, upload.completionId)
      return {
        text: `Check out my new album, ${title} on @dgc-network #Coliving`,
        url
      }
    }
    case 'Playlist': {
      // @ts-ignore
      const { content list_name: title } = upload.metadata
      const getPage = fullUrl ? fullPlaylistPage : content listPage
      const url = getPage(user.handle, title, upload.completionId)
      return {
        text: `Check out my new content list, ${title} on @dgc-network #Coliving`,
        url
      }
    }
  }
}
// The toast appears for copy link
const TOAST_DELAY = 3000

const ShareBanner = ({ isHidden, type, upload, user }: ShareBannerProps) => {
  const dispatch = useDispatch()
  const record = useRecord()
  const [, setIsTikTokModalOpen] = useModalState('ShareSoundToTikTok')
  const { isEnabled: isShareSoundToTikTokEnabled } = useFlag(
    FeatureFlags.SHARE_SOUND_TO_TIKTOK
  )

  const onClickTwitter = useCallback(async () => {
    const { url, text } = await getShareTextUrl(type, user, upload)
    openTwitterLink(url, text)
    record(
      make(Name.AGREEMENT_UPLOAD_SHARE_WITH_FANS, {
        uploadType: type,
        text
      })
    )
  }, [type, user, upload, record])

  const onClickTikTok = useCallback(async () => {
    // Sharing to TikTok is currently only enabled for single agreement uploads
    const agreement = upload.agreements[0]
    if (agreement.metadata) {
      dispatch(
        openTikTokModal({
          agreement: {
            id: agreement.metadata.agreement_id,
            title: agreement.metadata.title,
            duration: agreement.metadata.duration
          }
        })
      )
      setIsTikTokModalOpen(true)
    }
    record(make(Name.AGREEMENT_UPLOAD_SHARE_SOUND_TO_TIKTOK, {}))
  }, [upload, record, dispatch, setIsTikTokModalOpen])

  const onCopy = useCallback(async () => {
    const { url } = await getShareTextUrl(type, user, upload, false)
    copyLinkToClipboard(url)
    record(
      make(Name.AGREEMENT_UPLOAD_COPY_LINK, {
        uploadType: type,
        url
      })
    )
  }, [type, user, upload, record])

  const shouldShowShareToTikTok = () => {
    return (
      type === 'Agreement' &&
      isShareSoundToTikTokEnabled &&
      !upload.agreements[0]?.metadata.is_unlisted
    )
  }

  const continuePage = getContinuePage(type)

  return (
    <div
      className={cn(styles.container, { [styles.fullHeight]: !isHidden })}
      style={{
        backgroundImage: `linear-gradient(315deg, rgba(91, 35, 225, 0.8) 0%, rgba(162, 47, 237, 0.8) 100%), url(${backgroundPlaceholder})`
      }}
    >
      <div className={styles.title}>{messages.title(type)}</div>
      <div className={styles.description}>{messages.description}</div>
      <div className={styles.buttonContainer}>
        <Button
          onClick={onClickTwitter}
          className={cn(styles.button, styles.buttonTwitter)}
          textClassName={styles.buttonText}
          type={ButtonType.WHITE}
          text={messages.share}
          leftIcon={<IconTwitterBird />}
        />
        {shouldShowShareToTikTok() && (
          <Button
            onClick={onClickTikTok}
            className={cn(styles.button, styles.buttonTikTok)}
            textClassName={styles.buttonText}
            type={ButtonType.WHITE}
            text={
              <div className={styles.buttonTextTikTok}>
                <IconTikTok />
                <span>{messages.shareToTikTok}</span>
              </div>
            }
          />
        )}
      </div>
      <div className={styles.copyLinkWrapper} onClick={onCopy}>
        <Toast
          useCaret={false}
          mount={MountPlacement.BODY}
          placement={ComponentPlacement.TOP}
          overlayClassName={styles.toast}
          delay={TOAST_DELAY}
          text={messages.copiedToClipboard}
        >
          <div className={styles.copyLinkContainer}>
            <IconShare className={styles.shareIcon} />
            <div className={styles.copyText}>{messages.copy(continuePage)}</div>
          </div>
        </Toast>
      </div>
    </div>
  )
}

export default ShareBanner
