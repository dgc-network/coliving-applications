import React, { useCallback, useState } from 'react'
import BN from 'bn.js'
import clsx from 'clsx'

import Tooltip, { Position } from 'components/tooltip'
import ColivingClient from 'services/coliving'
import { formatShortAud, formatWei, formatWeiNumber } from 'utils/format'

import styles from './DisplayLive.module.css'
import copyToClipboard from 'utils/copyToClipboard'

type OwnProps = {
  className?: string
  amount: BN
  position?: Position
  label?: string
  shortFormat?: boolean
}

type DisplayLiveProps = OwnProps

const DisplayLive: React.FC<DisplayLiveProps> = ({
  amount,
  className,
  position,
  label,
  shortFormat = false
}) => {
  const [tooltipText, setTooltipText] = useState(formatWei(amount))
  const formatter = shortFormat ? formatShortAud : ColivingClient.displayShortAud
  const onClick = useCallback(
    e => {
      e.preventDefault()
      e.stopPropagation()
      copyToClipboard(formatWeiNumber(amount))
      setTooltipText('Copied!')
      const timeout = setTimeout(() => {
        setTooltipText(formatWei(amount))
      }, 1000)
      return () => clearTimeout(timeout)
    },
    [amount, setTooltipText]
  )
  return (
    <Tooltip
      onClick={onClick}
      position={position}
      className={clsx(styles.tooltip, { [className!]: !!className })}
      text={tooltipText}
    >
      {`${formatter(amount)}${label ? ` ${label}` : ''}`}
    </Tooltip>
  )
}

export default DisplayLive
