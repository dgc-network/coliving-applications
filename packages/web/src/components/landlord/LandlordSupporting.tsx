import { useCallback, useEffect } from 'react'

import { ID, User } from '@coliving/common'
import { useDispatch } from 'react-redux'

import { ReactComponent as IconTip } from 'assets/img/iconTip.svg'
import { useSelector } from 'common/hooks/useSelector'
import { getUsers } from 'common/store/cache/users/selectors'
import { getOptimisticSupporting } from 'common/store/tipping/selectors'
import { fetchSupportingForUser } from 'common/store/tipping/slice'
import { loadMore, reset } from 'common/store/userList/actions'
import { stringWeiToBN } from 'common/utils/wallet'
import { UserProfilePictureList } from 'components/notification/notification/components/userProfilePictureList'
import { USER_LIST_TAG as SUPPORTING_TAG } from 'pages/supporting-page/sagas'
import {
  setUsers,
  setVisibility
} from 'store/application/ui/userListModal/slice'
import {
  UserListEntityType,
  UserListType
} from 'store/application/ui/userListModal/types'
import { MAX_LANDLORD_HOVER_TOP_SUPPORTING } from 'utils/constants'

import styles from './LandlordSupporting.module.css'

const messages = {
  supporting: 'Supporting'
}

type LandlordSupportingProps = {
  landlord: User
  onNavigateAway?: () => void
}
export const LandlordSupporting = (props: LandlordSupportingProps) => {
  const { landlord, onNavigateAway } = props
  const { user_id, supporting_count } = landlord
  const dispatch = useDispatch()

  const supportingMap = useSelector(getOptimisticSupporting)
  const hasNotPreviouslyFetchedSupportingForLandlord =
    supportingMap[user_id] === undefined
  const supportingForLandlord = supportingMap[user_id] ?? {}
  const supportingForLandlordIds = Object.keys(
    supportingForLandlord
  ) as unknown as ID[]
  const rankedSupportingList = supportingForLandlordIds
    .sort((k1, k2) => {
      const amount1BN = stringWeiToBN(supportingForLandlord[k1].amount)
      const amount2BN = stringWeiToBN(supportingForLandlord[k2].amount)
      return amount1BN.gte(amount2BN) ? -1 : 1
    })
    .map((k) => supportingForLandlord[k])

  const rankedSupporting = useSelector((state) => {
    const usersMap = getUsers(state, {
      ids: rankedSupportingList.map((supporting) => supporting.receiver_id)
    })
    return rankedSupportingList
      .sort((s1, s2) => s1.rank - s2.rank)
      .map((s) => usersMap[s.receiver_id])
      .filter(Boolean)
  })

  /**
   * It's possible that we don't have the data for which landlords
   * this landlord is supporting. Thus, we fetch in this case.
   */
  useEffect(() => {
    if (hasNotPreviouslyFetchedSupportingForLandlord) {
      dispatch(fetchSupportingForUser({ userId: user_id }))
    }
  }, [dispatch, hasNotPreviouslyFetchedSupportingForLandlord, user_id])

  const handleClick = useCallback(() => {
    /**
     * It's possible that we are already in the supporting
     * user list modal, and that we are hovering over one
     * of the users.
     * Clicking on the supporting section is supposed to
     * load a new user list modal that shows the users who
     * are being supported by the user represented by the
     * landlord card.
     */
    dispatch(reset(SUPPORTING_TAG))
    dispatch(
      setUsers({
        userListType: UserListType.SUPPORTING,
        entityType: UserListEntityType.USER,
        id: user_id
      })
    )
    dispatch(loadMore(SUPPORTING_TAG))
    // Wait until event bubbling finishes so that any modals are already dismissed
    // Without this, the user list won't be visible if the popover is from an existing user list
    setTimeout(() => {
      dispatch(setVisibility(true))
    }, 0)

    // Used to dismiss popovers etc
    if (onNavigateAway) {
      onNavigateAway()
    }
  }, [dispatch, user_id, onNavigateAway])

  return rankedSupportingList.length > 0 ? (
    <div className={styles.supportingContainer} onClick={handleClick}>
      <div className={styles.supportingTitleContainer}>
        <IconTip className={styles.supportingIcon} />
        <span className={styles.supportingTitle}>{messages.supporting}</span>
      </div>
      <div className={styles.line} />
      <UserProfilePictureList
        limit={MAX_LANDLORD_HOVER_TOP_SUPPORTING}
        users={rankedSupporting}
        totalUserCount={supporting_count}
        disableProfileClick
        disablePopover
        profilePictureClassname={styles.profilePictureWrapper}
      />
    </div>
  ) : supporting_count > 0 ? (
    <div className={styles.emptyContainer} />
  ) : null
}
