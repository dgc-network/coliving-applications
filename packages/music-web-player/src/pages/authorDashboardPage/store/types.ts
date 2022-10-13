import { Status, Collection, DigitalContent } from '@coliving/common'

export default interface LandlordDashboardState {
  status: Status
  digitalContents: DigitalContent[]
  unlistedDigitalContents: DigitalContent[]
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
