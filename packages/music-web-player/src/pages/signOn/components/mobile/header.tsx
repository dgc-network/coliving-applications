import { ReactComponent as Logo } from 'assets/img/colivingLogoHorizontal.svg'

import styles from './header.module.css'

export const SignOnHeader = () => {
  return (
    <div className={styles.container}>
      <Logo className={styles.img} />
    </div>
  )
}

export default SignOnHeader
