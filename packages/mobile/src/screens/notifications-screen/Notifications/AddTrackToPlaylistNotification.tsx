import { useCallback } from 'react'

import { getNotificationEntities } from '-client/src/common/store/notifications/selectors'
import type { AddAgreementToPlaylist } from '-client/src/common/store/notifications/types'
import { isEqual } from 'lodash'
import { View } from 'react-native'

import IconPlaylists from 'app/assets/images/iconPlaylists.svg'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'

import {
  NotificationHeader,
  NotificationText,
  NotificationTile,
  NotificationTitle,
  EntityLink,
  UserNameLink,
  ProfilePicture
} from '../Notification'
import { getEntityRoute, getEntityScreen } from '../Notification/utils'
import { useDrawerNavigation } from '../useDrawerNavigation'

const messages = {
  title: 'Agreement Added to Playlist',
  addedAgreement: ' added your agreement ',
  toPlaylist: ' to their content list '
}
type AddAgreementToPlaylistNotificationProps = {
  notification: AddAgreementToPlaylist
}

export const AddAgreementToPlaylistNotification = (
  props: AddAgreementToPlaylistNotificationProps
) => {
  const { notification } = props
  const entities = useSelectorWeb(
    (state) => getNotificationEntities(state, notification),
    isEqual
  )
  const { agreement, content list } = entities
  const content listOwner = content list.user

  const navigation = useDrawerNavigation()

  const handlePress = useCallback(() => {
    if (content list) {
      navigation.navigate({
        native: getEntityScreen(content list),
        web: { route: getEntityRoute(content list) }
      })
    }
  }, [content list, navigation])

  return (
    <NotificationTile notification={notification} onPress={handlePress}>
      <NotificationHeader icon={IconPlaylists}>
        <NotificationTitle>{messages.title}</NotificationTitle>
      </NotificationHeader>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <ProfilePicture profile={content listOwner} />
        <View style={{ flex: 1 }}>
          <NotificationText>
            <UserNameLink user={content listOwner} />
            {messages.addedAgreement}
            <EntityLink entity={agreement} />
            {messages.toPlaylist}
            <EntityLink entity={content list} />
          </NotificationText>
        </View>
      </View>
    </NotificationTile>
  )
}
