import React, { ReactNode } from 'react'

import Stat from 'components/stat'
import { TICKER } from 'utils/consts'
import styles from './TotalStakedStat.module.css'
import { Status } from 'types'
import useTotalStaked from 'hooks/useTotalStaked'
import DisplayLive from 'components/displayLive'

const messages = {
  staked: `Active Stake ${TICKER}`
}

type OwnProps = {}

type TotalStakedStatProps = OwnProps

const TotalStakedStat: React.FC<TotalStakedStatProps> = () => {
  const { status, total } = useTotalStaked()
  let stat: ReactNode = null

  if (total && status === Status.Success) {
    stat = <DisplayLive className={styles.stat} amount={total} shortFormat />
  }

  return <Stat label={messages.staked} stat={stat} />
}

export default TotalStakedStat
