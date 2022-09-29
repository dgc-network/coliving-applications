import LoadingSpinner from 'components/loadingSpinner/loadingSpinner'

import styles from './LoadingSpinnerFullPage.module.css'

const LoadingSpinnerFullPage = () => {
  return (
    <div className={styles.container}>
      <LoadingSpinner className={styles.spinner} />
    </div>
  )
}

export default LoadingSpinnerFullPage
