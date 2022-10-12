import { ID, LineupState } from '@coliving/common'

export default interface DigitalContentPageState {
  digitalContentId: ID | null
  digitalContentPermalink: string | null
  rank: {
    week: number | null
    month: number | null
    year: number | null
  }
  trendingDigitalContentRanks: {
    week: ID[] | null
    month: ID[] | null
    year: ID[] | null
  }
  digitalContents: LineupState<{ id: ID }>
}
