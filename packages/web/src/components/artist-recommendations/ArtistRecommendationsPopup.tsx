import { MutableRefObject, useContext } from 'react'

import { ID, User } from '@coliving/common'
import { Popup, PopupPosition } from '@coliving/stems'
import { useSelector } from 'react-redux'

import { getUser } from 'common/store/cache/users/selectors'
import { MainContentContext } from 'pages/MainContentContext'
import { AppState } from 'store/types'
import zIndex from 'utils/zIndex'

import { LandlordRecommendations } from './LandlordRecommendations'
import styles from './LandlordRecommendationsPopup.module.css'

type LandlordRecommendationsPopupProps = {
  anchorRef: MutableRefObject<HTMLElement>
  landlordId: ID
  isVisible: boolean
  onClose: () => void
  onLandlordNameClicked: (handle: string) => void
  onFollowAll: (userIds: ID[]) => void
  onUnfollowAll: (userIds: ID[]) => void
}

export const LandlordRecommendationsPopup = ({
  anchorRef,
  landlordId,
  isVisible,
  onClose
}: LandlordRecommendationsPopupProps) => {
  const { mainContentRef } = useContext(MainContentContext)

  // Get the landlord
  const user = useSelector<AppState, User | null>((state) =>
    getUser(state, { id: landlordId })
  )
  if (!user) return null
  const { name } = user

  return (
    <Popup
      position={PopupPosition.BOTTOM_LEFT}
      anchorRef={anchorRef}
      isVisible={isVisible}
      zIndex={zIndex.FOLLOW_RECOMMENDATIONS_POPUP}
      onClose={onClose}
      className={styles.popup}
      containerRef={mainContentRef}
    >
      <LandlordRecommendations
        itemClassName={styles.popupItem}
        renderHeader={() => (
          <h2 className={styles.headerTitle}>Suggested Landlords</h2>
        )}
        renderSubheader={() => (
          <p className={styles.popupItem}>
            Here are some accounts that vibe well with {name}
          </p>
        )}
        landlordId={landlordId}
        onClose={onClose}
      />
    </Popup>
  )
}
