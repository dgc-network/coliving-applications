import type { TextProps } from './text'
import { Text } from './text'

const messages = {
  digitalcoin: 'digitalcoin tokens'
}

type LiveProps = TextProps

export const LiveText = (props: LiveProps) => {
  return (
    <Text accessibilityLabel={messages.digitalcoin} {...props}>
      $LIVE
    </Text>
  )
}
