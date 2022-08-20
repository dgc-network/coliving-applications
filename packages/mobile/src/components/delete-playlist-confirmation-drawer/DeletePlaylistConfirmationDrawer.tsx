import { useCallback, useMemo } from 'react'

import { deleteContentList } from 'common/store/cache/collections/actions'
import { getContentListId } from 'common/store/ui/delete-content list-confirmation-modal/selectors'

import ActionDrawer from 'app/components/action-drawer'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useNavigation } from 'app/hooks/useNavigation'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'

export const DeleteContentListConfirmationDrawer = () => {
  const content listId = useSelectorWeb(getContentListId)
  const dispatchWeb = useDispatchWeb()
  const navigation = useNavigation()

  const handleDelete = useCallback(() => {
    if (content listId) {
      dispatchWeb(deleteContentList(content listId))
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

  return <ActionDrawer modalName='DeleteContentListConfirmation' rows={rows} />
}
