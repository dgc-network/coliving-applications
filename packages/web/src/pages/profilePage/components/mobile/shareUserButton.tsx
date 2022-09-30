import { useCallback } from 'react'

import { ID, ShareSource, Nullable } from '@coliving/common'
import { IconShare, IconButton } from '@coliving/stems'
import { useDispatch } from 'react-redux'

import { requestOpen as requestOpenShareModal } from 'common/store/ui/shareModal/slice'

import styles from './shareUserButton.module.css'

type ShareUserButtonProps = {
  userId: Nullable<ID>
}

export const ShareUserButton = ({ userId }: ShareUserButtonProps) => {
  const dispatch = useDispatch()
  const handleClick = useCallback(() => {
    if (userId) {
      dispatch(
        requestOpenShareModal({
          type: 'profile',
          profileId: userId,
          source: ShareSource.PAGE
        })
      )
    }
  }, [dispatch, userId])

  return (
    <IconButton
      aria-label='share'
      className={styles.button}
      icon={<IconShare />}
      onClick={handleClick}
    />
  )
}
