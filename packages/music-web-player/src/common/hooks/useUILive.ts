import { useMemo } from 'react'

import { BNWei, StringWei } from '@coliving/common'
import BN from 'bn.js'

import { formatWei } from 'common/utils/wallet'

export const useUIAudio = (weiLive: StringWei): number =>
  useMemo(() => parseInt(formatWei(new BN(weiLive) as BNWei), 10), [weiLive])
