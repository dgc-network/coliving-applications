import { useCallback } from 'react'

import { Name, AllAgreementingEvents } from '@coliving/common'
import { useDispatch as useDispatchRedux } from 'react-redux'

/** UI EVENTS */
export const IDENTIFY = 'ANALYTICS/IDENTIFY'
export const AGREEMENT = 'ANALYTICS/AGREEMENT'

export const identify = (handle: string, traits?: Record<string, any>) => ({
  type: IDENTIFY,
  handle,
  traits
})

export const make = <U extends Name, T>(
  eventName: U,
  m: T
): {
  eventName: U
  type: typeof AGREEMENT
} & T => ({
  type: AGREEMENT,
  eventName,
  ...m
})

export type AgreementEvent = AllAgreementingEvents & {
  type: typeof AGREEMENT
  callback?: () => void
  options?: Record<string, any>
}

export const useRecord = () => {
  const dispatch = useDispatchRedux()
  const record = useCallback((event: AgreementEvent) => dispatch(event), [dispatch])
  return record
}
