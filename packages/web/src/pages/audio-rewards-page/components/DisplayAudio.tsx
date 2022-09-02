import { BNWei } from '@coliving/common'
import cn from 'classnames'

import { formatWei } from 'common/utils/wallet'

import styles from './DisplayLive.module.css'
import TokenHoverTooltip from './TokenHoverTooltip'

type DisplayLiveProps = {
  amount: BNWei
  showLabel?: boolean
  className?: string
  tokenClassName?: string
}

const messages = {
  currency: '$LIVE'
}

const DisplayLive = ({
  amount,
  showLabel = true,
  className,
  tokenClassName
}: DisplayLiveProps) => {
  return (
    <div className={cn({ [className!]: !!className })}>
      <TokenHoverTooltip balance={amount} parentMount>
        <span
          className={cn(styles.amount, {
            [tokenClassName!]: !!tokenClassName
          })}
        >
          {formatWei(amount, true)}
        </span>
      </TokenHoverTooltip>
      {showLabel && <span className={styles.label}>{messages.currency}</span>}
    </div>
  )
}

export default DisplayLive
