import React from 'react'
import BN from 'bn.js'
import clsx from 'clsx'

import Paper from 'components/paper'
import styles from './UserStakedStat.module.css'
import { Status } from 'types'
import { TICKER } from 'utils/consts'
import { Address } from 'types'
import Loading from 'components/loading'
import DisplayLive from 'components/displayLive'

const messages = {
  delegated: `DELEGATED`
}

type OwnProps = {
  className?: string
  wallet: Address
  totalDelegates: BN
  totalDelegatesStatus: Status
  isLoading?: boolean
}

type UserStakedStatProps = OwnProps

const UserStakedStat: React.FC<UserStakedStatProps> = (
  props: UserStakedStatProps
) => {
  return (
    <Paper className={clsx(styles.stakedContainer, props.className)}>
      {props.isLoading ? (
        <Loading />
      ) : (
        <>
          {props.totalDelegatesStatus !== Status.Success ? null : (
            <DisplayLive
              className={styles.stakedAmount}
              amount={props.totalDelegates}
            />
          )}
          <div className={styles.label}>{TICKER}</div>
          <div className={styles.description}>{messages.delegated}</div>
        </>
      )}
    </Paper>
  )
}

export default UserStakedStat
