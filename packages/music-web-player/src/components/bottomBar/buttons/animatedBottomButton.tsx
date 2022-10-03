import AnimatedButtonProvider, {
  AnimatedButtonProviderProps
} from 'components/animatedButton/animatedButtonProvider'

import styles from './AnimatedBottomButton.module.css'

const AnimatedBottomButton = (props: AnimatedButtonProviderProps) => {
  return (
    <AnimatedButtonProvider
      {...props}
      className={styles.animatedButton}
      activeClassName={styles.activeButton}
      wrapperClassName={styles.iconWrapper}
    />
  )
}

export default AnimatedBottomButton
