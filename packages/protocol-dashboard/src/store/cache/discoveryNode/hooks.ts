import { useMemo, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { ThunkAction } from 'redux-thunk'
import { Action } from 'redux'
import semver from 'semver'

import {
  Address,
  Node,
  Status,
  SortNode,
  ServiceType,
  DiscoveryNode
} from 'types'
import Coliving from 'services/coliving'
import { AppState } from 'store/types'
import { setLoading, setNodes, setTotal } from './slice'
import { useEffect } from 'react'

type UseDiscoveryNodesProps = {
  owner?: Address
  sortBy?: SortNode
  limit?: number
}

const filterNodes = (
  nodes: {
    [spId: number]: DiscoveryNode
  },
  { owner, sortBy, limit }: UseDiscoveryNodesProps = {}
) => {
  let dpNodes = Object.values(nodes)

  const filterFunc = (node: DiscoveryNode) => {
    return (!owner || node.owner === owner) && !node.isDeregistered
  }

  const sortFunc = (n1: DiscoveryNode, n2: DiscoveryNode) => {
    if (semver.gt(n1.endpoint, n2.endpoint)) return 1
    else if (semver.lt(n1.endpoint, n2.endpoint)) return -1
    return 0
  }

  dpNodes = dpNodes.filter(filterFunc)
  if (sortBy) dpNodes = dpNodes.sort(sortFunc)
  if (limit) dpNodes = dpNodes.slice(0, limit)

  return dpNodes
}

// -------------------------------- Selectors  --------------------------------
export const getStatus = (state: AppState) =>
  state.cache.discoveryNode.status
export const getTotal = (state: AppState) => state.cache.discoveryNode.total
export const getNode = (spID: number) => (state: AppState) =>
  state.cache.discoveryNode.nodes[spID]

export const getNodes = (state: AppState) => state.cache.discoveryNode.nodes
export const getFilteredNodes = ({
  owner,
  sortBy,
  limit
}: UseDiscoveryNodesProps = {}) => (state: AppState) => {
  const nodes = getNodes(state)
  return filterNodes(nodes, { owner, sortBy, limit })
}

// -------------------------------- Helpers  --------------------------------

const processDP = async (
  node: Node,
  aud: Coliving
): Promise<DiscoveryNode> => {
  const { version, country } = await Coliving.getDiscoveryNodeMetadata(
    node.endpoint
  )
  const isDeregistered = node.endpoint === ''
  let previousInfo = {}
  if (isDeregistered) {
    previousInfo = await aud.ServiceProviderClient.getDeregisteredService(
      ServiceType.DiscoveryNode,
      node.spID
    )
  }
  return {
    ...node,
    ...previousInfo,
    type: ServiceType.DiscoveryNode,
    version,
    country,
    isDeregistered
  }
}

// -------------------------------- Thunk Actions  --------------------------------

// Async function to get
export function fetchDiscoveryNodes(): ThunkAction<
  void,
  AppState,
  Coliving,
  Action<string>
> {
  return async (dispatch, getState, aud) => {
    const status = getStatus(getState())
    if (status) return

    dispatch(setLoading())
    const discoveryNodes = await aud.ServiceProviderClient.getServiceProviderList(
      ServiceType.DiscoveryNode
    )
    const legacy = (
      await aud.ServiceProviderClient.getServiceProviderList(
        // @ts-ignore
        'discovery-node'
      )
    ).map((d, i) => ({ ...d, spID: 100 + i }))

    const discoveryNodeVersions = await Promise.all(
      discoveryNodes.concat(legacy).map(node => processDP(node, aud))
    )
    const nodes = discoveryNodeVersions.reduce(
      (acc: { [spId: number]: DiscoveryNode }, dp) => {
        acc[dp.spID] = dp
        return acc
      },
      {}
    )

    dispatch(
      setNodes({
        status: Status.Success,
        nodes
      })
    )
  }
}

// Async function to get
export function getDiscoveryNode(
  spID: number,
  setStatus?: (status: Status) => void
): ThunkAction<void, AppState, Coliving, Action<string>> {
  return async (dispatch, getState, aud) => {
    const numDiscoveryNodes = await aud.ServiceProviderClient.getTotalServiceTypeProviders(
      ServiceType.DiscoveryNode
    )
    dispatch(setTotal({ total: numDiscoveryNodes }))
    if (spID > numDiscoveryNodes) {
      if (setStatus) setStatus(Status.Failure)
      return null
    }

    const dpNode = await aud.ServiceProviderClient.getServiceEndpointInfo(
      ServiceType.DiscoveryNode,
      spID
    )
    const node = await processDP(dpNode, aud)

    dispatch(setNodes({ nodes: { [dpNode.spID]: node } }))
    if (setStatus) setStatus(Status.Success)
  }
}

// -------------------------------- Hooks  --------------------------------

export const useDiscoveryNodes = ({
  owner,
  sortBy,
  limit
}: UseDiscoveryNodesProps) => {
  const status = useSelector(getStatus)
  const allNodes = useSelector(getNodes)
  const nodes = useMemo(() => filterNodes(allNodes, { owner, sortBy, limit }), [
    allNodes,
    owner,
    sortBy,
    limit
  ])

  const dispatch = useDispatch()
  useEffect(() => {
    if (!status) {
      dispatch(fetchDiscoveryNodes())
    }
  }, [dispatch, status])

  return { status, nodes }
}

type UseDiscoveryNodeProps = { spID: number }
export const useDiscoveryNode = ({ spID }: UseDiscoveryNodeProps) => {
  const [status, setStatus] = useState(Status.Loading)
  const totalDpNodes = useSelector(getTotal)
  const dp = useSelector(getNode(spID))
  const dispatch = useDispatch()

  useEffect(() => {
    if (!dp && typeof totalDpNodes !== 'number') {
      dispatch(getDiscoveryNode(spID, setStatus))
    }
  }, [dispatch, dp, totalDpNodes, spID])
  if (dp && status !== Status.Success) setStatus(Status.Success)
  if (status === Status.Success) {
    return { node: dp, status }
  }
  return {
    node: null,
    status
  }
}
