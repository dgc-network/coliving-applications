import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Album, ContentList, Agreement } from 'types'

export type State = {
  topAgreements: Agreement[] | null | MusicError
  topContentLists: ContentList[] | null | MusicError
  topAlbums: Album[] | null | MusicError
}

export const initialState: State = {
  topAgreements: null,
  topContentLists: null,
  topAlbums: null
}

export enum MusicError {
  ERROR = 'error'
}

type SetTopAgreements = { agreements: Agreement[] | MusicError }
type SetTopContentLists = { contentLists: ContentList[] | MusicError }
type SetTopAlbums = { albums: Album[] | MusicError }

const slice = createSlice({
  name: 'music',
  initialState,
  reducers: {
    setTopAgreements: (state, action: PayloadAction<SetTopAgreements>) => {
      const { agreements } = action.payload
      state.topAgreements = agreements
    },
    setTopContentLists: (state, action: PayloadAction<SetTopContentLists>) => {
      const { contentLists } = action.payload
      state.topContentLists = contentLists
    },
    setTopAlbums: (state, action: PayloadAction<SetTopAlbums>) => {
      const { albums } = action.payload
      state.topAlbums = albums
    }
  }
})

export const { setTopAgreements, setTopContentLists, setTopAlbums } = slice.actions

export default slice.reducer
