import { useCallback, useContext } from 'react'

import { FeatureFlags } from '@coliving/common'
import Clipboard from '@react-native-clipboard/clipboard'
import { getAccountUser } from '@coliving/web/src/common/store/account/selectors'
import { shareCollection } from '@coliving/web/src/common/store/social/collections/actions'
import { shareAgreement } from '@coliving/web/src/common/store/social/agreements/actions'
import { shareUser } from '@coliving/web/src/common/store/social/users/actions'
import { getShareState } from '@coliving/web/src/common/store/ui/share-modal/selectors'
import { requestOpen as requestOpenTikTokModal } from '@coliving/web/src/common/store/ui/share-sound-to-tiktok-modal/slice'
import { Linking, StyleSheet, View } from 'react-native'

import IconLink from 'app/assets/images/iconLink.svg'
import IconShare from 'app/assets/images/iconShare.svg'
import IconTikTok from 'app/assets/images/iconTikTok.svg'
import IconTikTokInverted from 'app/assets/images/iconTikTokInverted.svg'
import IconTwitterBird from 'app/assets/images/iconTwitterBird.svg'
import Text from 'app/components/text'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useFeatureFlag } from 'app/hooks/useRemoteConfig'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { useThemedStyles } from 'app/hooks/useThemedStyles'
import type { ThemeColors } from 'app/utils/theme'
import { Theme, useThemeColors, useThemeVariant } from 'app/utils/theme'

import ActionDrawer from '../actionDrawer'
import { ToastContext } from '../toast/toastContext'

import { messages } from './messages'
import { getContentUrl, getTwitterShareUrl } from './utils'

const createStyles = (themeColors: ThemeColors) =>
  StyleSheet.create({
    shareToTwitterAction: {
      color: themeColors.staticTwitterBlue
    },
    shareToTikTokAction: {
      color: 'black'
    },
    shareToTikTokActionDark: {
      color: themeColors.staticWhite
    },
    copyLinkAction: {
      color: themeColors.secondary
    },
    title: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: 8,
      paddingBottom: 16
    },
    titleText: {
      fontSize: 18
    },
    titleIcon: {
      marginRight: 8
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'flex-start',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 24
    }
  })

export const ShareDrawer = () => {
  const styles = useThemedStyles(createStyles)
  const { isEnabled: isShareToTikTokEnabled } = useFeatureFlag(
    FeatureFlags.SHARE_SOUND_TO_TIKTOK
  )
  const { secondary, neutral, staticTwitterBlue } = useThemeColors()
  const themeVariant = useThemeVariant()
  const isLightMode = themeVariant === Theme.DEFAULT
  const dispatchWeb = useDispatchWeb()
  const { content, source } = useSelectorWeb(getShareState)
  const account = useSelectorWeb(getAccountUser)
  const { toast } = useContext(ToastContext)
  const isOwner =
    content?.type === 'digital_content' &&
    account &&
    account.user_id === content.landlord.user_id
  const shareType = content?.type ?? 'digital_content'

  const handleShareToTwitter = useCallback(async () => {
    if (!content) return
    const twitterShareUrl = getTwitterShareUrl(content)
    const isSupported = await Linking.canOpenURL(twitterShareUrl)
    if (isSupported) {
      Linking.openURL(twitterShareUrl)
    } else {
      console.error(`Can't open: ${twitterShareUrl}`)
    }
  }, [content])

  const handleShareToTikTok = useCallback(() => {
    if (content?.type === 'digital_content') {
      dispatchWeb(requestOpenTikTokModal({ id: content.digital_content.digital_content_id }))
    }
  }, [content, dispatchWeb])

  const handleCopyLink = useCallback(() => {
    if (!content) return
    const link = getContentUrl(content)
    Clipboard.setString(link)
    toast({ content: messages.toast(shareType), type: 'info' })
  }, [toast, content, shareType])

  const handleOpenShareSheet = useCallback(() => {
    if (!source || !content) return
    switch (content.type) {
      case 'digital_content':
        dispatchWeb(shareAgreement(content.digital_content.digital_content_id, source))
        break
      case 'profile':
        dispatchWeb(shareUser(content.profile.user_id, source))
        break
      case 'album':
        dispatchWeb(shareCollection(content.album.content_list_id, source))
        break
      case 'contentList':
        dispatchWeb(shareCollection(content.contentList.content_list_id, source))
        break
    }
  }, [dispatchWeb, content, source])

  const shouldIncludeTikTokAction = Boolean(
    isShareToTikTokEnabled &&
      content?.type === 'digital_content' &&
      isOwner &&
      !content.digital_content.is_unlisted &&
      !content.digital_content.is_invalid &&
      !content.digital_content.is_delete
  )

  const getRows = useCallback(() => {
    const shareToTwitterAction = {
      icon: <IconTwitterBird fill={staticTwitterBlue} height={20} width={26} />,
      text: messages.twitter,
      style: styles.shareToTwitterAction,
      callback: handleShareToTwitter
    }

    const TikTokIcon = isLightMode ? IconTikTok : IconTikTokInverted

    const shareToTikTokAction = {
      text: messages.tikTok,
      icon: <TikTokIcon height={26} width={26} />,
      style: isLightMode
        ? styles.shareToTikTokAction
        : styles.shareToTikTokActionDark,
      callback: handleShareToTikTok
    }

    const copyLinkAction = {
      text: messages.copyLink(shareType),
      icon: <IconLink height={26} width={26} fill={secondary} />,
      style: styles.copyLinkAction,
      callback: handleCopyLink
    }

    const shareSheetAction = {
      text: messages.shareSheet(shareType),
      icon: <IconShare height={26} width={26} fill={secondary} />,
      style: styles.copyLinkAction,
      callback: handleOpenShareSheet
    }

    return shouldIncludeTikTokAction
      ? [
          shareToTwitterAction,
          shareToTikTokAction,
          copyLinkAction,
          shareSheetAction
        ]
      : [shareToTwitterAction, copyLinkAction, shareSheetAction]
  }, [
    staticTwitterBlue,
    styles,
    handleShareToTwitter,
    isLightMode,
    handleShareToTikTok,
    secondary,
    handleCopyLink,
    handleOpenShareSheet,
    shouldIncludeTikTokAction,
    shareType
  ])

  return (
    <ActionDrawer
      modalName='Share'
      rows={getRows()}
      renderTitle={() => (
        <View style={styles.title}>
          <IconShare
            style={styles.titleIcon}
            fill={neutral}
            height={18}
            width={20}
          />
          <Text weight='bold' style={styles.titleText}>
            {messages.modalTitle(shareType)}
          </Text>
        </View>
      )}
      styles={{ row: styles.row }}
    />
  )
}
