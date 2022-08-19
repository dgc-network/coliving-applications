import type { TextProps } from './Text'
import { Text } from './Text'

const messages = {
  live: 'live tokens'
}

type AudioProps = TextProps

export const AudioText = (props: AudioProps) => {
  return (
    <Text accessibilityLabel={messages.live} {...props}>
      $LIVE
    </Text>
  )
}
