import { ID, LineupState } from '@coliving/common'

export default interface AgreementPageState {
  agreementId: ID | null
  agreementPermalink: string | null
  rank: {
    week: number | null
    month: number | null
    year: number | null
  }
  trendingAgreementRanks: {
    week: ID[] | null
    month: ID[] | null
    year: ID[] | null
  }
  agreements: LineupState<{ id: ID }>
}
