import { useCallback } from 'react'

import { Name, User, FeatureFlags } from '@coliving/common'
import { Button, ButtonType, IconTikTok, IconTwitterBird } from '@coliving/stems'
import cn from 'classnames'
import { useDispatch } from 'react-redux'

import backgroundPlaceholder from 'assets/img/1-Concert-3-1.jpg'
import { ReactComponent as IconShare } from 'assets/img/iconShare.svg'
import { useModalState } from 'common/hooks/useModalState'
import { open as openTikTokModal } from 'common/store/ui/shareSoundToTiktokModal/slice'
import Toast from 'components/toast/toast'
import { MountPlacement, ComponentPlacement } from 'components/types'
import { useFlag } from 'hooks/useRemoteConfig'
import ColivingBackend from 'services/colivingBackend'
import apiClient from 'services/colivingAPIClient/colivingAPIClient'
import { useRecord, make } from 'store/analytics/actions'
import { copyLinkToClipboard } from 'utils/clipboardUtil'
import {
  fullAlbumPage,
  fullContentListPage,
  fullProfilePage,
  fullAgreementPage,
  profilePage,
  albumPage,
  contentListPage
} from 'utils/route'
import { openTwitterLink } from 'utils/tweet'

import { UploadPageState } from '../store/types'

import styles from './shareBanner.module.css'

type UploadType = 'DigitalContent' | 'Agreements' | 'Album' | 'ContentList' | 'Remix'
type ContinuePage = 'DigitalContent' | 'Profile' | 'Album' | 'ContentList' | 'Remix'

type ShareBannerProps = {
  isHidden: boolean
  type: UploadType
  upload: UploadPageState
  user: User
}

const messages = {
  title: (type: UploadType) =>
    `Your ${type} ${type === 'Agreements' ? 'Are' : 'Is'} Digitalcoin!`,
  description: 'Now it’s time to spread the word and share it with your residents!',
  share: 'Share With Your Residents',
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
    case 'DigitalContent': {
      const { title, permalink } = upload.agreements[0].metadata
      const url = fullUrl ? fullAgreementPage(permalink) : permalink
      return {
        text: `Check out my new digital_content, ${title} on @dgc-network #Coliving`,
        url
      }
    }
    case 'Remix': {
      const { permalink } = upload.agreements[0].metadata
      const parent_digital_content_id =
        upload.agreements[0].metadata?.remix_of?.agreements[0].parent_digital_content_id
      if (!parent_digital_content_id) return { text: '', url: '' }

      const url = fullUrl ? fullAgreementPage(permalink) : permalink
      const parentAgreement = await apiClient.getAgreement({ id: parent_digital_content_id })
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
      const { content_list_name: title } = upload.metadata
      const getPage = fullUrl ? fullAlbumPage : albumPage
      const url = getPage(user.handle, title, upload.completionId)
      return {
        text: `Check out my new album, ${title} on @dgc-network #Coliving`,
        url
      }
    }
    case 'ContentList': {
      // @ts-ignore
      const { content_list_name: title } = upload.metadata
      const getPage = fullUrl ? fullContentListPage : contentListPage
      const url = getPage(user.handle, title, upload.completionId)
      return {
        text: `Check out my new contentList, ${title} on @dgc-network #Coliving`,
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
    // Sharing to TikTok is currently only enabled for single digital_content uploads
    const digital_content = upload.agreements[0]
    if (digital_content.metadata) {
      dispatch(
        openTikTokModal({
          digital_content: {
            id: digital_content.metadata.digital_content_id,
            title: digital_content.metadata.title,
            duration: digital_content.metadata.duration
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
      type === 'DigitalContent' &&
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
          leftIcon={<IconTwitterBird />} css={undefined}        />
        {shouldShowShareToTikTok() && (
          <Button
            onClick={onClickTikTok}
            className={cn(styles.button, styles.buttonTikTok)}
            textClassName={styles.buttonText}
            type={ButtonType.WHITE}
            text={<div className={styles.buttonTextTikTok}>
              <IconTikTok />
              <span>{messages.shareToTikTok}</span>
            </div>} css={undefined}          />
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
