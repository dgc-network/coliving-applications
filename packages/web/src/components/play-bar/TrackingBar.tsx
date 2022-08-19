import styles from './AgreementingBar.module.css'

type AgreementingBarProps = {
  percentComplete: number
}

const AgreementingBar = ({ percentComplete }: AgreementingBarProps) => {
  return (
    <div className={styles.rail}>
      <div
        className={styles.agreementer}
        style={{ width: `${percentComplete}%` }}
      />
    </div>
  )
}

export default AgreementingBar
