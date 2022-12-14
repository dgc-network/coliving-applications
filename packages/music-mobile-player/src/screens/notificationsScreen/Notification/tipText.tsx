import { formatNumberCommas } from '@coliving/web/src/common/utils/formatUtil'

import { AudioText } from 'app/components/core'

import { NotificationText } from './notificationText'

type TipTextProps = {
  value: number
}

export const TipText = (props: TipTextProps) => {
  const { value } = props
  return (
    <NotificationText weight='bold'>
      {formatNumberCommas(value)} <AudioText fontSize='large' weight='bold' />
    </NotificationText>
  )
}
