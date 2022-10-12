import { ID } from '@coliving/common'

export enum Status {
  SHARE_STARTED,
  SHARE_SUCCESS,
  SHARE_ERROR,
  SHARE_UNINITIALIZED
}

export type DigitalContent = {
  id: ID
  title: string
  duration: number
}

export type ShareSoundToTikTokModalState = {
  isAuthenticated: boolean
  digital_content?: DigitalContent
  status: Status
  openId?: string
  accessToken?: string
}

export type AuthenticatedPayload = {
  openId?: string
  accessToken?: string
}

export type RequestOpenPayload = {
  id: ID
}

export type OpenPayload = {
  digital_content: DigitalContent
}

export type SetStatusPayload = {
  status: Status
}
