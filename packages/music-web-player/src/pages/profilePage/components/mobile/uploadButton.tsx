import { useCallback } from 'react'

import { Button, ButtonType, IconUpload } from '@coliving/stems'
import { useDispatch } from 'react-redux'

import { setVisibility } from 'common/store/ui/modals/slice'
import MobileUploadDrawer from 'components/mobileUploadDrawer/mobileUploadDrawer'

import styles from './uploadButton.module.css'

const UploadButton = () => {
  const dispatch = useDispatch()

  const onClick = useCallback(() => {
    dispatch(setVisibility({ modal: 'MobileUpload', visible: true }))
  }, [dispatch])

  return (
    <>
      <div className={styles.buttonContainer}>
        <Button
          className={styles.button}
          textClassName={styles.buttonText}
          onClick={onClick}
          text='Upload DigitalContent'
          type={ButtonType.COMMON_ALT}
          leftIcon={<IconUpload />}
          iconClassName={styles.icon} css={undefined}        />
      </div>
      <MobileUploadDrawer />
    </>
  )
}

export default UploadButton
