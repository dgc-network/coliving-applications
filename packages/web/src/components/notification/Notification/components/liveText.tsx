import styles from './liveText.module.css'

const messages = {
  liveLabel: 'live tokens'
}

type LiveTextProps = {
  value: number
}

export const LiveText = ({ value }: LiveTextProps) => {
  return (
    <span className={styles.root}>
      {value} <span aria-label={messages.liveLabel}>$LIVE</span>
    </span>
  )
}
