import { Status } from '@coliving/common'
import { connect } from 'react-redux'

import DesktopContentListTile from 'components/digital_content/desktop/ConnectedContentListTile'
import DesktopDigitalContentTile from 'components/digital_content/desktop/ConnectedDigitalContentTile'
import MobileContentListTile from 'components/digital_content/mobile/ConnectedContentListTile'
import MobileDigitalContentTile from 'components/digital_content/mobile/ConnectedDigitalContentTile'
import { AppState } from 'store/types'
import { isMobile } from 'utils/clientUtil'

import LineupProvider, { LineupProviderProps } from './lineupProvider'
import { LineupVariant } from './types'

export type LineupWithoutTile = Omit<
  LineupProviderProps,
  'digitalContentTile' | 'skeletonTile' | 'contentListTile'
>
type LineupProps = LineupWithoutTile & ReturnType<typeof mapStateToProps>

/** A lineup renders a LineupProvider, injecting different tiles
 * depending on the client state.
 */
const Lineup = (props: LineupProps) => {
  const mobile = props.isMobile
  const digitalContentTile = mobile ? MobileDigitalContentTile : DesktopDigitalContentTile
  const contentListTile = mobile ? MobileContentListTile : DesktopContentListTile

  return (
    <LineupProvider
      {...props}
      digitalContentTile={digitalContentTile}
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
