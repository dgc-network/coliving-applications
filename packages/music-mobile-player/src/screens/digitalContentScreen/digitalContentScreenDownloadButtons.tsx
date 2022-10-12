import { useCallback } from 'react'

import type { CID, ID, User } from '@coliving/common'
import { Name } from '@coliving/common'
import type { ButtonType as DownloadButtonType } from '@coliving/web/src/common/hooks/useDownloadDigitalContentButtons'
import {
  ButtonState,
  useDownloadDigitalContentButtons
} from '@coliving/web/src/common/hooks/useDownloadDigitalContentButtons'
import { downloadDigitalContent } from '@coliving/web/src/common/store/social/digital_contents/actions'
import { View } from 'react-native'
import type { useSelector } from 'react-redux'

import IconDownload from 'app/assets/images/iconDownload.svg'
import { Button } from 'app/components/core'
import LoadingSpinner from 'app/components/loadingSpinner'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { useToast } from 'app/hooks/useToast'
import type { SearchUser } from 'app/store/search/types'
import { makeStyles } from 'app/styles/makeStyles'
import { make, digital_content } from 'app/utils/analytics'

export type DownloadButtonProps = {
  state: ButtonState
  type: DownloadButtonType
  label: string
  onClick?: () => void
}

export const messages = {
  followToDownload: 'Must follow author to download',
  addDownloadPrefix: (label: string) => `Download ${label}`
}

const useStyles = makeStyles(({ palette }) => ({
  buttonContainer: {
    alignSelf: 'center',
    marginBottom: 6
  }
}))

const DownloadButton = ({
  label,
  state,
  onClick = () => {}
}: DownloadButtonProps) => {
  const { toast } = useToast()

  const styles = useStyles()
  const requiresFollow = state === ButtonState.REQUIRES_FOLLOW
  const isProcessing = state === ButtonState.PROCESSING
  const isDisabled = state === ButtonState.PROCESSING || requiresFollow

  const handlePress = useCallback(() => {
    if (requiresFollow) {
      toast({ content: messages.followToDownload })
    }

    if (isDisabled) {
      return
    }

    onClick()
  }, [isDisabled, onClick, requiresFollow, toast])

  // Manually handling disabled state in order to show a toast
  // when a follow is required
  return (
    <Button
      variant='common'
      icon={isProcessing ? LoadingSpinner : IconDownload}
      iconPosition='left'
      title={messages.addDownloadPrefix(label)}
      styles={{
        root: styles.buttonContainer,
        button: isDisabled && { opacity: 0.5 }
      }}
      onPress={handlePress}
      size='small'
    />
  )
}

type DigitalContentScreenDownloadButtonsProps = {
  following: boolean
  isHidden?: boolean
  isOwner: boolean
  digitalContentId: ID
  user: User | SearchUser
}

export const DigitalContentScreenDownloadButtons = ({
  following,
  isOwner,
  digitalContentId,
  user
}: DigitalContentScreenDownloadButtonsProps) => {
  const dispatchWeb = useDispatchWeb()

  const onDownload = useCallback(
    (id: ID, cid: CID, category?: string, parentDigitalContentId?: ID) => {
      const { content_node_endpoint } = user
      if (!content_node_endpoint) {
        return
      }
      dispatchWeb(downloadDigitalContent(id, cid, content_node_endpoint, category))
      digital_content(
        make({
          eventName: Name.AGREEMENT_PAGE_DOWNLOAD,
          id,
          category,
          parent_digital_content_id: parentDigitalContentId
        })
      )
    },
    [dispatchWeb, user]
  )

  const buttons = useDownloadDigitalContentButtons({
    digitalContentId,
    onDownload,
    isOwner,
    following,
    useSelector: useSelectorWeb as typeof useSelector
  })

  const shouldHide = buttons.length === 0
  if (shouldHide) {
    return null
  }

  return (
    <View style={{ marginBottom: 12 }}>
      {buttons.map((props) => (
        <DownloadButton {...props} key={props.label} />
      ))}
    </View>
  )
}
