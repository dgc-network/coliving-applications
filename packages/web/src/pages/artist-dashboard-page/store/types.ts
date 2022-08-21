import { Status, Collection, Agreement } from '@coliving/common'

export default interface LandlordDashboardState {
  status: Status
  agreements: Agreement[]
  unlistedAgreements: Agreement[]
  collections: Collection
  listenData: {
    all: {
      labels: string[]
      values: number[]
    }
    [id: number]: {
      labels: string[]
      values: number[]
    }
  }
}
