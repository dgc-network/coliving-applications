import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Album, ContentList, DigitalContent } from 'types'

export type State = {
  topDigitalContents: DigitalContent[] | null | MusicError
  topContentLists: ContentList[] | null | MusicError
  topAlbums: Album[] | null | MusicError
}

export const initialState: State = {
  topDigitalContents: null,
  topContentLists: null,
  topAlbums: null
}

export enum MusicError {
  ERROR = 'error'
}

type SetTopDigitalContents = { digitalContents: DigitalContent[] | MusicError }
type SetTopContentLists = { contentLists: ContentList[] | MusicError }
type SetTopAlbums = { albums: Album[] | MusicError }

const slice = createSlice({
  name: 'music',
  initialState,
  reducers: {
    setTopDigitalContents: (state, action: PayloadAction<SetTopDigitalContents>) => {
      const { digitalContents } = action.payload
      state.topDigitalContents = digitalContents
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

export const { setTopDigitalContents, setTopContentLists, setTopAlbums } = slice.actions

export default slice.reducer
