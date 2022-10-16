import type { TextProps } from './text'
import { Text } from './text'

const messages = {
  digitalcoin: 'digitalcoin tokens'
}

type DigitalcoinProps = TextProps

export const LiveText = (props: DigitalcoinProps) => {
  return (
    <Text accessibilityLabel={messages.digitalcoin} {...props}>
      $DGC
    </Text>
  )
}
