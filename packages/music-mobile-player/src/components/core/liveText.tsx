import type { TextProps } from './text'
import { Text } from './text'

const messages = {
  live: 'live tokens'
}

type LiveProps = TextProps

export const LiveText = (props: LiveProps) => {
  return (
    <Text accessibilityLabel={messages.live} {...props}>
      $LIVE
    </Text>
  )
}
