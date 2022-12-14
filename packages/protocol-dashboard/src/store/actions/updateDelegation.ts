import { useState, useCallback, useEffect } from 'react'
import { useDispatch } from 'react-redux'

import { Address, Status, BigNumber } from 'types'
import { undelegateColivingStake } from 'store/actions/undelegateStake'
import { delegateColivingStake } from 'store/actions/delegateStake'

export const useUpdateDelegation = (
  isIncrease: boolean,
  shouldReset?: boolean
) => {
  const [status, setStatus] = useState<undefined | Status>()
  const [error, setError] = useState<string>('')
  const dispatch = useDispatch()
  useEffect(() => {
    if (shouldReset) {
      setStatus(undefined)
      setError('')
    }
  }, [shouldReset, setStatus, setError])

  const updateDelegation = useCallback(
    (wallet: Address, amount: BigNumber) => {
      if (status !== Status.Loading) {
        if (isIncrease) {
          dispatch(delegateColivingStake(wallet, amount, setStatus, setError))
        } else {
          dispatch(undelegateColivingStake(wallet, amount, setStatus, setError))
        }
      }
    },
    [isIncrease, dispatch, status, setStatus, setError]
  )
  return { status, error, updateDelegation }
}

export default useUpdateDelegation
