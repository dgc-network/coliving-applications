import { useCallback } from 'react'

import { Name, AllTrackingEvents } from '@coliving/common'
import { useDispatch as useDispatchRedux } from 'react-redux'

/** UI EVENTS */
export const IDENTIFY = 'ANALYTICS/IDENTIFY'
export const DIGITAL_CONTENT = 'ANALYTICS/DIGITAL_CONTENT'

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
  type: typeof DIGITAL_CONTENT
} & T => ({
  type: DIGITAL_CONTENT,
  eventName,
  ...m
})

export type DigitalContentEvent = AllTrackingEvents & {
  type: typeof DIGITAL_CONTENT
  callback?: () => void
  options?: Record<string, any>
}

export const useRecord = () => {
  const dispatch = useDispatchRedux()
  const record = useCallback((event: DigitalContentEvent) => dispatch(event), [dispatch])
  return record
}
