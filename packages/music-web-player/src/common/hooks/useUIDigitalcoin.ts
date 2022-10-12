import { useMemo } from 'react'

import { BNWei, StringWei } from '@coliving/common'
import BN from 'bn.js'

import { formatWei } from 'common/utils/wallet'

export const useUIAudio = (weiDigitalcoin: StringWei): number =>
  useMemo(() => parseInt(formatWei(new BN(weiDigitalcoin) as BNWei), 10), [weiDigitalcoin])
