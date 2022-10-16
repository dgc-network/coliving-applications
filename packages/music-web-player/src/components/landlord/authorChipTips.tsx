import { useEffect, useState } from 'react'

import { ID, StringWei, Nullable } from '@coliving/common'
import { IconTrophy, IconTrending } from '@coliving/stems'
import cn from 'classnames'

import { ReactComponent as IconTip } from 'assets/img/iconTip.svg'
import { useSelector } from 'common/hooks/useSelector'
import {
  getOptimisticSupporters,
  getOptimisticSupporting
} from 'common/store/tipping/selectors'
import { getId as getSupportingId } from 'common/store/userList/supporting/selectors'
import { getId as getSupportersId } from 'common/store/userList/topSupporters/selectors'
import { formatWei, stringWeiToBN } from 'common/utils/wallet'
import { USER_LIST_TAG as SUPPORTING_USER_LIST_TAG } from 'pages/supportingPage/sagas'
import { USER_LIST_TAG as TOP_SUPPORTERS_USER_LIST_TAG } from 'pages/topSupportersPage/sagas'
import { TIPPING_TOP_RANK_THRESHOLD } from 'utils/constants'

import styles from './LandlordChip.module.css'

const messages = {
  digitalcoin: '$DGC',
  supporter: 'Supporter'
}

type LandlordChipTipsProps = {
  landlordId: ID
  tag: string
}

export const LandlordChipTips = ({ landlordId, tag }: LandlordChipTipsProps) => {
  const supportingId = useSelector(getSupportingId)
  const supportersId = useSelector(getSupportersId)
  const supportingMap = useSelector(getOptimisticSupporting)
  const supportersMap = useSelector(getOptimisticSupporters)
  const [amount, setAmount] = useState<Nullable<StringWei>>(null)
  const [rank, setRank] = useState<Nullable<number>>(null)

  useEffect(() => {
    if (landlordId && supportingId && tag === SUPPORTING_USER_LIST_TAG) {
      const userSupportingMap = supportingMap[supportingId] ?? {}
      const landlordSupporting = userSupportingMap[landlordId] ?? {}
      setAmount(landlordSupporting.amount ?? null)
    } else if (
      landlordId &&
      supportersId &&
      tag === TOP_SUPPORTERS_USER_LIST_TAG
    ) {
      const userSupportersMap = supportersMap[supportersId] ?? {}
      const landlordSupporter = userSupportersMap[landlordId] ?? {}
      setRank(landlordSupporter.rank ?? null)
      setAmount(landlordSupporter.amount ?? null)
    }
  }, [landlordId, supportingId, supportersId, supportingMap, supportersMap, tag])

  return (
    <div className={styles.tipContainer}>
      {TOP_SUPPORTERS_USER_LIST_TAG === tag ? (
        <div className={styles.rank}>
          {rank && rank >= 1 && rank <= TIPPING_TOP_RANK_THRESHOLD ? (
            <div className={styles.topSupporter}>
              <IconTrophy className={styles.icon} />
              <span className={styles.topRankNumber}>#{rank}</span>
              <span>{messages.supporter}</span>
            </div>
          ) : (
            <div className={styles.supporter}>
              <IconTrending className={styles.icon} />
              <span className={styles.rankNumber}>#{rank}</span>
            </div>
          )}
        </div>
      ) : null}
      {amount && (
        <div className={cn(styles.amount)}>
          <IconTip className={styles.icon} />
          <span className={styles.value}>
            {formatWei(stringWeiToBN(amount), true)}
          </span>
          <span className={styles.label}>{messages.digitalcoin}</span>
        </div>
      )}
    </div>
  )
}
