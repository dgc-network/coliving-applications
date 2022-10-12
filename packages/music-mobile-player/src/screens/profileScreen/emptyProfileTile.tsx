import { getUserId } from '@coliving/web/src/common/store/account/selectors'

import { EmptyTile } from 'app/components/core'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'

import { useSelectProfile } from './selectors'

const messages = {
  you: 'You',
  haveNot: "haven't",
  hasNot: "hasn't",
  digitalContents: 'created any digitalContents yet',
  albums: 'created any albums yet',
  contentLists: 'created any contentLists yet',
  reposts: 'reposted anything yet'
}

type Tab = 'digitalContents' | 'albums' | 'contentLists' | 'reposts'

export const useEmptyProfileText = (tab: Tab) => {
  const { user_id, name } = useSelectProfile(['user_id', 'name'])
  const accountId = useSelectorWeb(getUserId)

  const isOwner = user_id === accountId

  const youAction = `${messages.you} ${messages.haveNot}`
  const nameAction = `${name} ${messages.hasNot}`
  return `${isOwner ? youAction : nameAction} ${messages[tab]}`
}

type EmptyProfileTileProps = {
  tab: Tab
}

export const EmptyProfileTile = (props: EmptyProfileTileProps) => {
  const { tab } = props
  const emptyText = useEmptyProfileText(tab)

  return <EmptyTile message={emptyText} />
}
