import { useState, useCallback, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { ThunkAction } from 'redux-thunk'
import { Action } from 'redux'

import { Status, ServiceType, Address } from 'types'
import Coliving from 'services/coliving'
import { AppState } from 'store/types'
import { getDiscoveryNode } from 'store/cache/discoveryNode/hooks'
import { getContentNode } from 'store/cache/contentNode/hooks'

function modifyColivingService(
  serviceType: ServiceType,
  spID: number,
  oldEndpoint: string,
  newEndpoint: string,
  oldDelegateOwnerWallet: Address,
  newDelegateOwnerWallet: Address,
  setStatus: (status: Status) => void,
  setError: (msg: string) => void
): ThunkAction<void, AppState, Coliving, Action<string>> {
  return async (dispatch, getState, aud) => {
    setStatus(Status.Loading)
    try {
      if (
        newDelegateOwnerWallet &&
        oldDelegateOwnerWallet !== newDelegateOwnerWallet
      ) {
        await aud.ServiceProviderClient.updateDelegateOwnerWallet(
          serviceType,
          oldEndpoint,
          newDelegateOwnerWallet
        )
      }
      if (newEndpoint && oldEndpoint !== newEndpoint) {
        await aud.ServiceProviderClient.updateEndpoint(
          serviceType,
          oldEndpoint,
          newEndpoint
        )
      }
      if (serviceType === ServiceType.DiscoveryNode) {
        dispatch(getDiscoveryNode(spID))
      } else {
        dispatch(getContentNode(spID))
      }

      setStatus(Status.Success)
    } catch (err) {
      setStatus(Status.Failure)
      setError(err.message)
    }
  }
}

export const useModifyService = (shouldReset?: boolean) => {
  const [status, setStatus] = useState<undefined | Status>()
  const [error, setError] = useState<string>('')
  const dispatch = useDispatch()
  useEffect(() => {
    if (shouldReset) {
      setStatus(undefined)
      setError('')
    }
  }, [shouldReset, setStatus, setError])

  const modifyService = useCallback(
    (
      serviceType: ServiceType,
      spID: number,
      oldEndpoint: string,
      newEndpoint: string,
      oldDelegateOwnerWallet: Address,
      delegateOwnerWallet: Address
    ) => {
      if (status !== Status.Loading) {
        dispatch(
          modifyColivingService(
            serviceType,
            spID,
            oldEndpoint,
            newEndpoint,
            oldDelegateOwnerWallet,
            delegateOwnerWallet,
            setStatus,
            setError
          )
        )
      }
    },
    [dispatch, status, setStatus, setError]
  )
  return { status, error, modifyService }
}
