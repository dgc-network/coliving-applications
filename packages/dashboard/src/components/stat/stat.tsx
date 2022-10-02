import React, { ReactNode } from 'react'

import Paper from 'components/paper'
import styles from './Stat.module.css'
import Loading from 'components/loading'
import Error from 'components/error'

type OwnProps = {
  stat: ReactNode
  label: string
  error?: boolean
}

type StatProps = OwnProps

const Stat: React.FC<StatProps> = ({ stat, label, error }) => {
  return (
    <Paper className={styles.container}>
      {error ? (
        <div className={styles.stat}>
          <Error />
        </div>
      ) : stat !== null ? (
        <div className={styles.stat}>{stat}</div>
      ) : (
        <div className={styles.loadingContainer}>
          <Loading className={styles.loading} />
        </div>
      )}
      <div className={styles.label}>{label}</div>
    </Paper>
  )
}

export default Stat
