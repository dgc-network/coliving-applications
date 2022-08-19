import styles from './AudioText.module.css'

const messages = {
  liveLabel: 'live tokens'
}

type AudioTextProps = {
  value: number
}

export const AudioText = ({ value }: AudioTextProps) => {
  return (
    <span className={styles.root}>
      {value} <span aria-label={messages.liveLabel}>$LIVE</span>
    </span>
  )
}
