import { useCallback, useMemo } from 'react'

import { deletePlaylist } from 'common/store/cache/collections/actions'
import { getPlaylistId } from 'common/store/ui/delete-content list-confirmation-modal/selectors'

import ActionDrawer from 'app/components/action-drawer'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useNavigation } from 'app/hooks/useNavigation'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'

export const DeletePlaylistConfirmationDrawer = () => {
  const content listId = useSelectorWeb(getPlaylistId)
  const dispatchWeb = useDispatchWeb()
  const navigation = useNavigation()

  const handleDelete = useCallback(() => {
    if (content listId) {
      dispatchWeb(deletePlaylist(content listId))
      navigation.goBack()
    }
  }, [dispatchWeb, content listId, navigation])

  const rows = useMemo(
    () => [
      {
        text: 'Delete',
        isDestructive: true,
        callback: handleDelete
      },
      { text: 'Cancel' }
    ],
    [handleDelete]
  )

  return <ActionDrawer modalName='DeletePlaylistConfirmation' rows={rows} />
}
