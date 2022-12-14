import { useCallback, useContext } from 'react'

import type { GestureResponderEvent, PressableProps } from 'react-native'
import { Linking, Pressable } from 'react-native'

import { ToastContext } from 'app/components/toast/toastContext'
import { EventNames } from 'app/types/analytics'
import { make, digital_content } from 'app/utils/analytics'

const messages = {
  error: 'Unable to open this URL'
}

export const useOnOpenLink = (
  source?: 'profile page' | 'digital_content page' | 'collection page'
) => {
  const { toast } = useContext(ToastContext)

  const handlePress = useCallback(
    async (url: string) => {
      const errorToastConfig = {
        content: messages.error,
        type: 'error' as const
      }

      try {
        const supported = await Linking.canOpenURL(url)
        if (supported) {
          await Linking.openURL(url)
          if (source) {
            digital_content(make({ eventName: EventNames.LINK_CLICKING, url, source }))
          }
        } else {
          toast(errorToastConfig)
        }
      } catch (error) {
        toast(errorToastConfig)
      }
    },
    [toast, source]
  )

  return handlePress
}

export const useLink = (url: string) => {
  const onPressLink = useOnOpenLink()

  const handlePress = useCallback(() => {
    return onPressLink(url)
  }, [url, onPressLink])

  return { onPress: handlePress }
}

export type LinkProps = PressableProps & {
  url: string
  analytics?: ReturnType<typeof make>
}

export const Link = (props: LinkProps) => {
  const { url, onPress, analytics, ...other } = props
  const { onPress: onPressLink } = useLink(url)

  const handlePress = useCallback(
    (event: GestureResponderEvent) => {
      onPress?.(event)
      onPressLink()
      if (analytics) {
        digital_content(analytics)
      }
    },
    [onPress, onPressLink, analytics]
  )

  return <Pressable onPress={handlePress} {...other} />
}
