import styles from './liveText.module.css'

const messages = {
  liveLabel: 'digitalcoin tokens'
}

type LiveTextProps = {
  value: number
}

export const LiveText = ({ value }: LiveTextProps) => {
  return (
    <span className={styles.root}>
      {value} <span aria-label={messages.liveLabel}>$DGC</span>
    </span>
  )
}
