import type { User } from '@coliving/common'
import { getOptimisticSupporting } from '@coliving/web/src/common/store/tipping/selectors'
import { getId as getSupportingId } from 'common/store/user-list/supporting/selectors'

import { useSelectorWeb } from 'app/hooks/useSelectorWeb'

import { Tip } from './tip'

type SupportingInfoProps = {
  user: User
}

export const SupportingInfo = (props: SupportingInfoProps) => {
  const supportingMap = useSelectorWeb(getOptimisticSupporting)
  const supportingId = useSelectorWeb(getSupportingId)
  const supportingForUser = supportingId
    ? supportingMap[supportingId] ?? null
    : null
  const supporting = supportingForUser?.[props.user.user_id] ?? null

  return supporting ? <Tip amount={supporting.amount} /> : null
}
