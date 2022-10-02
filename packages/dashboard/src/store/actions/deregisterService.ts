import { useState, useCallback, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { ThunkAction } from 'redux-thunk'
import { Action } from 'redux'

import { Status, ServiceType } from 'types'
import Coliving from 'services/coliving'
import { AppState } from 'store/types'
import { getDiscoveryNode } from 'store/cache/discoveryNode/hooks'
import { getContentNode } from 'store/cache/contentNode/hooks'

function deregisterColivingService(
  serviceType: ServiceType,
  spID: number,
  endpoint: string,
  setStatus: (status: Status) => void,
  setError: (msg: string) => void
): ThunkAction<void, AppState, Coliving, Action<string>> {
  return async (dispatch, getState, aud) => {
    setStatus(Status.Loading)
    try {
      await aud.ServiceProviderClient.deregister(serviceType, endpoint)

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

export const useDeregisterService = (shouldReset?: boolean) => {
  const [status, setStatus] = useState<undefined | Status>()
  const [error, setError] = useState<string>('')
  const dispatch = useDispatch()
  useEffect(() => {
    if (shouldReset) {
      setStatus(undefined)
      setError('')
    }
  }, [shouldReset, setStatus, setError])

  const deregisterService = useCallback(
    (serviceType: ServiceType, spID: number, endpoint: string) => {
      if (status !== Status.Loading) {
        dispatch(
          deregisterColivingService(
            serviceType,
            spID,
            endpoint,
            setStatus,
            setError
          )
        )
      }
    },
    [dispatch, status, setStatus, setError]
  )
  return { status, error, deregisterService }
}
