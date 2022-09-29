import { useRef } from 'react'

import {
  Button,
  ButtonSize,
  ButtonType,
  IconShare,
  IconPencil
} from '@coliving/stems'
import PropTypes from 'prop-types'

import { LandlordRecommendationsPopup } from 'components/landlordRecommendations/landlordRecommendationsPopup'
import FollowButton from 'components/followButton/followButton'
import Stats from 'components/stats/stats'
import SubscribeButton from 'components/subscribeButton/subscribeButton'

import styles from './StatBanner.module.css'

const BUTTON_COLLAPSE_WIDTHS = {
  first: 1066,
  second: 1140
}

const StatBanner = (props) => {
  let buttonOne, buttonTwo, subscribeButton
  const followButtonRef = useRef()

  switch (props.mode) {
    case 'owner':
      buttonOne = (
        <Button
          size={ButtonSize.SMALL}
          type={ButtonType.COMMON}
          text='SHARE'
          leftIcon={<IconShare />}
          onClick={props.onShare}
          widthToHideText={BUTTON_COLLAPSE_WIDTHS.first}
        />
      )
      buttonTwo = (
        <Button
          key='edit'
          className={styles.buttonTwo}
          size={ButtonSize.SMALL}
          type={ButtonType.SECONDARY}
          text='EDIT PAGE'
          leftIcon={<IconPencil />}
          onClick={props.onEdit}
          widthToHideText={BUTTON_COLLAPSE_WIDTHS.second}
        />
      )
      break
    case 'editing':
      buttonOne = (
        <Button
          size={ButtonSize.SMALL}
          type={ButtonType.COMMON}
          text='CANCEL'
          onClick={props.onCancel}
        />
      )
      buttonTwo = (
        <Button
          key='save'
          className={styles.buttonTwo}
          size={ButtonSize.SMALL}
          type={ButtonType.PRIMARY_ALT}
          text='SAVE CHANGES'
          onClick={props.onSave}
        />
      )
      break
    default:
      buttonOne = (
        <Button
          size={ButtonSize.SMALL}
          type={ButtonType.COMMON}
          text='SHARE'
          leftIcon={<IconShare />}
          onClick={props.onShare}
          widthToHideText={BUTTON_COLLAPSE_WIDTHS.first}
        />
      )
      buttonTwo = (
        <div ref={followButtonRef}>
          <FollowButton
            following={props.following}
            onFollow={props.onFollow}
            onUnfollow={props.onUnfollow}
            widthToHideText={BUTTON_COLLAPSE_WIDTHS.second}
            className={styles.followButton}
          />
          <LandlordRecommendationsPopup
            anchorRef={followButtonRef}
            landlordId={props.profileId}
            isVisible={props.areLandlordRecommendationsVisible}
            onClose={props.onCloseLandlordRecommendations}
          />
        </div>
      )
      if (props.onToggleSubscribe) {
        subscribeButton = (
          <SubscribeButton
            className={styles.subscribeButton}
            isSubscribed={props.isSubscribed}
            isFollowing={props.following}
            onToggleSubscribe={props.onToggleSubscribe}
          />
        )
      }
      break
  }

  return (
    <div className={styles.wrapper}>
      {!props.empty ? (
        <div className={styles.statBanner}>
          <div className={styles.stats}>
            <Stats
              clickable
              currentUserId={props.userId}
              userId={props.profileId}
              stats={props.stats}
              size='large'
            />
          </div>
          <div className={styles.buttons}>
            {buttonOne}
            {subscribeButton}
            {buttonTwo}
          </div>
        </div>
      ) : null}
    </div>
  )
}

StatBanner.propTypes = {
  stats: PropTypes.array,
  mode: PropTypes.oneOf(['visitor', 'owner', 'editing']),
  empty: PropTypes.bool,
  handle: PropTypes.string,
  profileId: PropTypes.number,
  areLandlordRecommendationsVisible: PropTypes.bool,
  onCloseLandlordRecommendations: PropTypes.func,
  userId: PropTypes.number,
  onClickLandlordName: PropTypes.func,
  onEdit: PropTypes.func,
  onShare: PropTypes.func,
  onSave: PropTypes.func,
  onCancel: PropTypes.func,
  onFollow: PropTypes.func,
  onUnfollow: PropTypes.func,
  following: PropTypes.bool,
  isSubscribed: PropTypes.bool,
  onToggleSubscribe: PropTypes.func
}

StatBanner.defaultProps = {
  stats: [
    { number: 0, title: 'agreements' },
    { number: 0, title: 'followers' },
    { number: 0, title: 'reposts' }
  ],
  mode: 'visitor',
  empty: false,
  showSuggestedLandlords: false
}

export default StatBanner
