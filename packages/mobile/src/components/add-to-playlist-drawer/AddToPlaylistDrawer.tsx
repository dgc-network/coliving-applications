import { useContext, useState } from 'react'

import { CreatePlaylistSource } from '@/common'
import { getAccountWithOwnPlaylists } from '-client/src/common/store/account/selectors'
import {
  addAgreementToPlaylist,
  createPlaylist
} from '-client/src/common/store/cache/collections/actions'
import {
  getAgreementId,
  getAgreementTitle
} from '-client/src/common/store/ui/add-to-content list/selectors'
import { newCollectionMetadata } from '-client/src/schemas'
import { FEED_PAGE, content listPage } from '-client/src/utils/route'
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native'
import { View } from 'react-native'

import Button, { ButtonType } from 'app/components/button'
import { Card } from 'app/components/card'
import { CardList } from 'app/components/core'
import { AppDrawer, useDrawerState } from 'app/components/drawer'
import { ToastContext } from 'app/components/toast/ToastContext'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { usePushRouteWeb } from 'app/hooks/usePushRouteWeb'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { makeStyles, shadow } from 'app/styles'

const messages = {
  title: 'Add To Playlist',
  addedToast: 'Added To Playlist!',
  createdToast: 'Playlist Created!'
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

export const AddToPlaylistDrawer = () => {
  const styles = useStyles()
  const { toast } = useContext(ToastContext)
  const dispatchWeb = useDispatchWeb()
  const pushRouteWeb = usePushRouteWeb()
  const { onClose } = useDrawerState('AddToPlaylist')
  const agreementId = useSelectorWeb(getAgreementId)
  const agreementTitle = useSelectorWeb(getAgreementTitle)
  const user = useSelectorWeb(getAccountWithOwnPlaylists)
  const [isDrawerGestureSupported, setIsDrawerGestureSupported] = useState(true)

  if (!user || !agreementId || !agreementTitle) {
    return null
  }
  const userPlaylists = user.content lists ?? []

  const addToNewPlaylist = () => {
    const metadata = newCollectionMetadata({
      content list_name: agreementTitle,
      is_private: false
    })
    const tempId = `${Date.now()}`
    dispatchWeb(
      createPlaylist(tempId, metadata, CreatePlaylistSource.FROM_AGREEMENT, agreementId)
    )
    dispatchWeb(addAgreementToPlaylist(agreementId!, tempId))
    toast({ content: messages.createdToast })
    pushRouteWeb(content listPage(user.handle, agreementTitle, tempId), FEED_PAGE)
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
      modalName='AddToPlaylist'
      isFullscreen
      isGestureSupported={isDrawerGestureSupported}
      title={messages.title}
    >
      <View>
        <View style={styles.buttonContainer}>
          <Button
            title='Create New Playlist'
            onPress={addToNewPlaylist}
            containerStyle={styles.button}
            type={ButtonType.COMMON}
          />
        </View>
        <CardList
          onScrollEndDrag={handleScrollEnd}
          contentContainerStyle={styles.cardList}
          data={userPlaylists}
          renderItem={({ item }) => (
            <Card
              key={item.content list_id}
              id={item.content list_id}
              type='collection'
              imageSize={item._cover_art_sizes}
              primaryText={item.content list_name}
              secondaryText={user.name}
              onPress={() => {
                toast({ content: messages.addedToast })
                dispatchWeb(addAgreementToPlaylist(agreementId!, item.content list_id))
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
