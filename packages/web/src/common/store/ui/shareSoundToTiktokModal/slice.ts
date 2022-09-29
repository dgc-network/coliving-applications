import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import {
  OpenPayload,
  RequestOpenPayload,
  SetStatusPayload,
  AuthenticatedPayload,
  ShareSoundToTikTokModalState,
  Status
} from './types'

const initialState: ShareSoundToTikTokModalState = {
  isAuthenticated: false,
  status: Status.SHARE_UNINITIALIZED
}

// Slice

const slice = createSlice({
  name: 'application/ui/shareSoundToTikTokModal',
  initialState,
  reducers: {
    authenticated: (state, action: PayloadAction<AuthenticatedPayload>) => {
      state.openId = action.payload.openId
      state.accessToken = action.payload.accessToken
    },
    open: (state, action: PayloadAction<OpenPayload>) => {
      const { agreement } = action.payload
      state.isAuthenticated = false
      state.agreement = agreement
      state.status = Status.SHARE_UNINITIALIZED
    },
    requestOpen: (state, action: PayloadAction<RequestOpenPayload>) => {},
    setIsAuthenticated: (state) => {
      state.isAuthenticated = true
    },
    setStatus: (state, action: PayloadAction<SetStatusPayload>) => {
      const { status } = action.payload
      state.status = status
    },
    share: () => {},
    upload: () => {}
  }
})

export const {
  authenticated,
  open,
  requestOpen,
  setIsAuthenticated,
  setStatus,
  share,
  upload
} = slice.actions

export default slice.reducer
