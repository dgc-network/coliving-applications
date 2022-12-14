import { Button, ButtonProps, ButtonType, IconArrow } from '@coliving/stems'
import cn from 'classnames'

import styles from './ButtonWithArrow.module.css'

const ButtonWithArrow = (props: ButtonProps) => {
  return (
    <Button
      css={undefined} className={cn(styles.rewardButton, props.className)}
      type={ButtonType.PRIMARY_ALT}
      rightIcon={<IconArrow />}
      iconClassName={styles.buttonIcon}
      textClassName={cn(styles.text, props.textClassName)}
      {...props}    />
  )
}

export default ButtonWithArrow
