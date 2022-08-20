import cn from 'classnames'
import { connect } from 'react-redux'
import { RouteComponentProps, withRouter } from 'react-router-dom'

import { getModalVisibility } from 'common/store/ui/modals/slice'
import NowPlayingDrawer from 'components/now-playing/NowPlayingDrawer'
import { getKeyboardVisibility } from 'store/application/ui/mobileKeyboard/selectors'
import { getCollectible, getUid as getPlayingUid } from 'store/player/selectors'
import { AppState } from 'store/types'
import { isMobile } from 'utils/clientUtil'

import styles from './PlayBarProvider.module.css'
import DesktopPlayBar from './desktop/PlayBar'

type OwnProps = {
  isMobile: boolean
}

type PlayBarProviderProps = OwnProps &
  ReturnType<typeof mapStateToProps> &
  RouteComponentProps

const PlayBarProvider = ({
  isMobile,
  playingUid,
  collectible,
  keyboardVisible,
  addToContentListOpen
}: PlayBarProviderProps) => {
  return (
    <div
      className={cn(styles.playBarWrapper, {
        [styles.isMobile]: isMobile
      })}
    >
      {isMobile ? (
        <NowPlayingDrawer
          isPlaying={!!playingUid || !!collectible}
          keyboardVisible={keyboardVisible}
          shouldClose={addToContentListOpen === true}
        />
      ) : (
        <>
          <div className={styles.customHr} />
          <DesktopPlayBar />
        </>
      )}
    </div>
  )
}

function mapStateToProps(state: AppState) {
  return {
    playingUid: getPlayingUid(state),
    collectible: getCollectible(state),
    isMobile: isMobile(),
    keyboardVisible: getKeyboardVisibility(state),
    addToContentListOpen: getModalVisibility(state, 'AddToContentList')
  }
}

export default withRouter(connect(mapStateToProps)(PlayBarProvider))
