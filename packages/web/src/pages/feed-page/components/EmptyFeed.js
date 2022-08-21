import { memo } from 'react'

import { Button, ButtonType, ButtonSize } from '@coliving/stems'
import cn from 'classnames'
import PropTypes from 'prop-types'

import styles from './EmptyFeed.module.css'
import FollowLandlords from './FollowUsers'

const messages = {
  noFollowers: 'Awkward. It looks like you’re not following anyone!'
}

const EmptyFeed = (props) => {
  return (
    <div className={cn(styles.emptyFeed)}>
      {props.hasAccount ? null : (
        <div className={styles.banner}>
          <div className={styles.bannerText}>
            {`You'll Need An Account Before You Can Use Your Feed!`}
          </div>
        </div>
      )}
      <div className={styles.contentWrapper}>
        <div className={styles.body}>
          {props.hasAccount ? (
            <FollowLandlords
              header={
                <>
                  {messages.noFollowers}{' '}
                  <i className='emoji face-screaming-in-fear' />
                </>
              }
              fetchFollowUsers={props.fetchFollowUsers}
              followUsers={props.followUsers}
              users={props.suggestedFollows}
            />
          ) : (
            <>
              <div className={styles.title}>
                With an Coliving account you can...
              </div>
              <div className={styles.item}>
                Follow your favorite landlords{' '}
                <i className='emoji small grinning-face-with-star-eyes' />
              </div>
              <div className={styles.item}>
                Upload and share your music{' '}
                <i className='emoji small multiple-musical-notes' />
              </div>
              <div className={styles.item}>
                Create and publish contentLists{' '}
                <i className='emoji small headphone' />
              </div>
              <div className={styles.item}>and much more!</div>
              <Button
                text='Sign Up'
                type={ButtonType.PRIMARY_ALT}
                size={ButtonSize.SMALL}
                onClick={props.onClick}
                className={styles.button}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

EmptyFeed.propTypes = {
  hasAccount: PropTypes.bool,
  onClick: PropTypes.func,
  fetchFollowUsers: PropTypes.func,
  followUsers: PropTypes.func,
  suggestedFollows: PropTypes.arrayOf(
    PropTypes.shape({
      user_id: PropTypes.number,
      name: PropTypes.string,
      handle: PropTypes.string,
      is_verified: PropTypes.bool,
      follower_count: PropTypes.number
    })
  )
}

export default memo(EmptyFeed)
