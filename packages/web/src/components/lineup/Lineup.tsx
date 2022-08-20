import { Status } from '@coliving/common'
import { connect } from 'react-redux'

import DesktopPlaylistTile from 'components/agreement/desktop/ConnectedPlaylistTile'
import DesktopAgreementTile from 'components/agreement/desktop/ConnectedAgreementTile'
import MobilePlaylistTile from 'components/agreement/mobile/ConnectedPlaylistTile'
import MobileAgreementTile from 'components/agreement/mobile/ConnectedAgreementTile'
import { AppState } from 'store/types'
import { isMobile } from 'utils/clientUtil'

import LineupProvider, { LineupProviderProps } from './LineupProvider'
import { LineupVariant } from './types'

export type LineupWithoutTile = Omit<
  LineupProviderProps,
  'agreementTile' | 'skeletonTile' | 'content listTile'
>
type LineupProps = LineupWithoutTile & ReturnType<typeof mapStateToProps>

/** A lineup renders a LineupProvider, injecting different tiles
 * depending on the client state.
 */
const Lineup = (props: LineupProps) => {
  const mobile = props.isMobile
  const agreementTile = mobile ? MobileAgreementTile : DesktopAgreementTile
  const content listTile = mobile ? MobilePlaylistTile : DesktopPlaylistTile

  return (
    <LineupProvider
      {...props}
      agreementTile={agreementTile}
      content listTile={content listTile}
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
