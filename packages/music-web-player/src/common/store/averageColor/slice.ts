import { CID, Color, Agreement, Nullable } from '@coliving/common'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import { CommonState } from 'common/store'

const initialState: {
  averageColor: { [multihash: string]: Color }
  dominantColors: { [multihash: string]: Color[] }
} = {
  averageColor: {},
  dominantColors: {}
}

/**
 * This slice agreements computed average colors and dominant colors for a given agreement art CID.
 * Colors is a map of art cid -> Color
 */
const slice = createSlice({
  name: 'ui/averageColor',
  initialState,
  reducers: {
    setAverageColor: (
      state,
      action: PayloadAction<{ multihash: string; color: Color }>
    ) => {
      const { multihash, color } = action.payload
      state.averageColor[multihash] = color
    },
    setDominantColors: (
      state,
      action: PayloadAction<{ multihash: string; colors: Color[] }>
    ) => {
      const { multihash, colors } = action.payload
      state.dominantColors[multihash] = colors
    }
  }
})

export const { setAverageColor, setDominantColors } = slice.actions

export const getAverageColor = (
  state: CommonState,
  { multihash }: { multihash: Nullable<CID> }
): Nullable<Color> =>
  (multihash && state.ui.averageColor.averageColor[multihash]) || null

export const getAverageColorByAgreement = (
  state: CommonState,
  { agreement }: { agreement: Nullable<Agreement> }
): Nullable<Color> => {
  const multihash = agreement?.cover_art_sizes ?? agreement?.cover_art
  if (!multihash) return null
  return state.ui.averageColor.averageColor[multihash] ?? null
}

export const getDominantColorsByAgreement = (
  state: CommonState,
  { agreement }: { agreement: Nullable<Agreement> }
): Nullable<Color[]> => {
  const multihash = agreement?.cover_art_sizes ?? agreement?.cover_art
  if (!multihash) return null
  return state.ui.averageColor.dominantColors[multihash] ?? null
}

export default slice.reducer
