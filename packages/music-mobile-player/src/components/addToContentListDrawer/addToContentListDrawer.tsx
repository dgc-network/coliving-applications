import { useContext, useState } from 'react'

import { CreateContentListSource } from '@coliving/common'
import { getAccountWithOwnContentLists } from '@coliving/web/src/common/store/account/selectors'
import {
  addAgreementToContentList,
  createContentList
} from '@coliving/web/src/common/store/cache/collections/actions'
import {
  getAgreementId,
  getAgreementTitle
} from '@coliving/web/src/common/store/ui/add-to-content-list/selectors'
import { newCollectionMetadata } from '@coliving/web/src/schemas'
import { FEED_PAGE, contentListPage } from '@coliving/web/src/utils/route'
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native'
import { View } from 'react-native'

import Button, { ButtonType } from 'app/components/button'
import { Card } from 'app/components/card'
import { CardList } from 'app/components/core'
import { AppDrawer, useDrawerState } from 'app/components/drawer'
import { ToastContext } from 'app/components/toast/toastContext'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { usePushRouteWeb } from 'app/hooks/usePushRouteWeb'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { makeStyles, shadow } from 'app/styles'

const messages = {
  title: 'Add To ContentList',
  addedToast: 'Added To ContentList!',
  createdToast: 'ContentList Created!'
}

const useStyles = makeStyles(() => ({
  buttonContainer: {
    alignSelf: 'center',
    borderRadius: 4,
    marginBottom: 16,
    ...shadow()
  },
  button: {
    width: 256
  },
  cardList: {
    paddingBottom: 240
  }
}))

export const AddToContentListDrawer = () => {
  const styles = useStyles()
  const { toast } = useContext(ToastContext)
  const dispatchWeb = useDispatchWeb()
  const pushRouteWeb = usePushRouteWeb()
  const { onClose } = useDrawerState('AddToContentList')
  const agreementId = useSelectorWeb(getAgreementId)
  const agreementTitle = useSelectorWeb(getAgreementTitle)
  const user = useSelectorWeb(getAccountWithOwnContentLists)
  const [isDrawerGestureSupported, setIsDrawerGestureSupported] = useState(true)

  if (!user || !agreementId || !agreementTitle) {
    return null
  }
  const userContentLists = user.contentLists ?? []

  const addToNewContentList = () => {
    const metadata = newCollectionMetadata({
      content_list_name: agreementTitle,
      is_private: false
    })
    const tempId = `${Date.now()}`
    dispatchWeb(
      createContentList(tempId, metadata, CreateContentListSource.FROM_AGREEMENT, agreementId)
    )
    dispatchWeb(addAgreementToContentList(agreementId!, tempId))
    toast({ content: messages.createdToast })
    pushRouteWeb(contentListPage(user.handle, agreementTitle, tempId), FEED_PAGE)
    onClose()
  }

  const handleScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { y } = e.nativeEvent.contentOffset

    if (isDrawerGestureSupported && y > 0) {
      setIsDrawerGestureSupported(false)
    } else if (!isDrawerGestureSupported && y <= 0) {
      setIsDrawerGestureSupported(true)
    }
  }

  return (
    <AppDrawer
      modalName='AddToContentList'
      isFullscreen
      isGestureSupported={isDrawerGestureSupported}
      title={messages.title}
    >
      <View>
        <View style={styles.buttonContainer}>
          <Button
            title='Create New ContentList'
            onPress={addToNewContentList}
            containerStyle={styles.button}
            type={ButtonType.COMMON}
          />
        </View>
        <CardList
          onScrollEndDrag={handleScrollEnd}
          contentContainerStyle={styles.cardList}
          data={userContentLists}
          renderItem={({ item }) => (
            <Card
              key={item.content_list_id}
              id={item.content_list_id}
              type='collection'
              imageSize={item._cover_art_sizes}
              primaryText={item.content_list_name}
              secondaryText={user.name}
              onPress={() => {
                toast({ content: messages.addedToast })
                dispatchWeb(addAgreementToContentList(agreementId!, item.content_list_id))
                onClose()
              }}
              user={user}
            />
          )}
        />
      </View>
    </AppDrawer>
  )
}
