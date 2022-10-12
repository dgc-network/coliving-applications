import { useContext, useEffect } from 'react'

import { useDispatch, useSelector } from 'react-redux'

import { ReactComponent as IconCaretRight } from 'assets/img/iconCaretRight.svg'
import { getShowRewardClaimedToast } from 'common/store/pages/digitalcoin-rewards/selectors'
import { resetRewardClaimedToast } from 'common/store/pages/digitalcoin-rewards/slice'
import { ToastContext } from 'components/toast/toastContext'
import ToastLinkContent from 'components/toast/mobile/toastLinkContent'
import { getLocationPathname } from 'store/routing/selectors'
import { CLAIM_REWARD_TOAST_TIMEOUT_MILLIS } from 'utils/constants'
import { LIVE_PAGE } from 'utils/route'

import styles from './RewardClaimedToast.module.css'

const messages = {
  challengeCompleted: 'You’ve Completed an $LIVE Rewards Challenge!',
  seeMore: 'See more'
}

export const RewardClaimedToast = () => {
  const { toast } = useContext(ToastContext)
  const dispatch = useDispatch()
  const showToast = useSelector(getShowRewardClaimedToast)
  const pathname = useSelector(getLocationPathname)

  useEffect(() => {
    if (showToast) {
      const toastContent = (
        <div className={styles.rewardClaimedToast}>
          <span className={styles.rewardClaimedToastIcon}>
            <i className='emoji face-with-party-horn-and-party-hat' />
          </span>
          {pathname === LIVE_PAGE ? (
            messages.challengeCompleted
          ) : (
            <ToastLinkContent
              text={messages.challengeCompleted}
              linkText={messages.seeMore}
              link={LIVE_PAGE}
              linkIcon={<IconCaretRight className={styles.seeMoreCaret} />}
            />
          )}
        </div>
      )

      toast(toastContent, CLAIM_REWARD_TOAST_TIMEOUT_MILLIS)
      dispatch(resetRewardClaimedToast())
    }
  }, [toast, dispatch, showToast, pathname])

  return null
}
