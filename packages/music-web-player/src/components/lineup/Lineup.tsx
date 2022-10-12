import { Status } from '@coliving/common'
import { connect } from 'react-redux'

import DesktopContentListTile from 'components/digital_content/desktop/ConnectedContentListTile'
import DesktopAgreementTile from 'components/digital_content/desktop/ConnectedAgreementTile'
import MobileContentListTile from 'components/digital_content/mobile/ConnectedContentListTile'
import MobileAgreementTile from 'components/digital_content/mobile/ConnectedAgreementTile'
import { AppState } from 'store/types'
import { isMobile } from 'utils/clientUtil'

import LineupProvider, { LineupProviderProps } from './lineupProvider'
import { LineupVariant } from './types'

export type LineupWithoutTile = Omit<
  LineupProviderProps,
  'agreementTile' | 'skeletonTile' | 'contentListTile'
>
type LineupProps = LineupWithoutTile & ReturnType<typeof mapStateToProps>

/** A lineup renders a LineupProvider, injecting different tiles
 * depending on the client state.
 */
const Lineup = (props: LineupProps) => {
  const mobile = props.isMobile
  const agreementTile = mobile ? MobileAgreementTile : DesktopAgreementTile
  const contentListTile = mobile ? MobileContentListTile : DesktopContentListTile

  return (
    <LineupProvider
      {...props}
      agreementTile={agreementTile}
      contentListTile={contentListTile}
    />
  )
}

Lineup.defaultProps = {
  lineup: {
    entries: [] as any[],
    order: {},
    total: 0,
    deleted: 0,
    nullCount: 0,
    status: Status.LOADING,
    hasMore: true,
    inView: true,
    prefix: '',
    page: 0,
    isMetadataLoading: false
  },
  start: 0,
  playingUid: '',
  playing: false,
  variant: LineupVariant.MAIN,
  selfLoad: true,
  delineate: false,
  loadMore: () => {},
  ordered: false,
  setInView: undefined
}

function mapStateToProps(state: AppState) {
  return {
    isMobile: isMobile()
  }
}

export default connect(mapStateToProps)(Lineup)
