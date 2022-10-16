import { LineupActions } from 'common/store/lineup/actions'

export const PREFIX = 'COLLECTION_DIGITAL_CONTENTS'

class DigitalContentsActions extends LineupActions {
  constructor() {
    super(PREFIX)
  }
}

export const digitalContentsActions = new DigitalContentsActions()
