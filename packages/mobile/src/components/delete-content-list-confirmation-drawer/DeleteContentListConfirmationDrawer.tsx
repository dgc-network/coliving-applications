import { useCallback, useMemo } from 'react'

import { deleteContentList } from 'common/store/cache/collections/actions'
import { getContentListId } from 'common/store/ui/delete-content-list-confirmation-modal/selectors'

import ActionDrawer from 'app/components/action-drawer'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useNavigation } from 'app/hooks/useNavigation'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'

export const DeleteContentListConfirmationDrawer = () => {
  const contentListId = useSelectorWeb(getContentListId)
  const dispatchWeb = useDispatchWeb()
  const navigation = useNavigation()

  const handleDelete = useCallback(() => {
    if (contentListId) {
      dispatchWeb(deleteContentList(contentListId))
      navigation.goBack()
    }
  }, [dispatchWeb, contentListId, navigation])

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
