import { useState, useCallback, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { ThunkAction } from 'redux-thunk'
import { Action } from 'redux'

import { Status } from 'types'
import Coliving from 'services/coliving'
import { AppState } from 'store/types'
import { fetchProposal } from 'store/cache/proposals/hooks'

function executeColivingProposal(
  proposalId: number,
  setStatus: (status: Status) => void,
  setError: (msg: string) => void
): ThunkAction<void, AppState, Coliving, Action<string>> {
  return async (dispatch, getState, aud) => {
    setStatus(Status.Loading)
    try {
      await aud.Governance.evaluateProposalOutcome({ proposalId })

      // Repull proposal
      await dispatch(fetchProposal(proposalId))

      setStatus(Status.Success)
    } catch (err) {
      setStatus(Status.Failure)
      setError(err.message)
    }
  }
}

export const useExecuteProposal = (shouldReset?: boolean) => {
  const [status, setStatus] = useState<undefined | Status>()
  const [error, setError] = useState<string>('')
  const dispatch = useDispatch()

  useEffect(() => {
    if (shouldReset) {
      setStatus(undefined)
      setError('')
    }
  }, [shouldReset, setStatus, setError])

  const executeProposal = useCallback(
    (proposalId: number) => {
      dispatch(executeColivingProposal(proposalId, setStatus, setError))
    },
    [dispatch, setStatus, setError]
  )

  return { status, error, executeProposal }
}
