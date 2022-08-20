import { useCallback } from 'react'

import { getNotificationEntities } from '-client/src/common/store/notifications/selectors'
import type { AddAgreementToContentList } from '-client/src/common/store/notifications/types'
import { isEqual } from 'lodash'
import { View } from 'react-native'

import IconContentLists from 'app/assets/images/iconContentLists.svg'
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
  title: 'Agreement Added to ContentList',
  addedAgreement: ' added your agreement ',
  toContentList: ' to their content list '
}
type AddAgreementToContentListNotificationProps = {
  notification: AddAgreementToContentList
}

export const AddAgreementToContentListNotification = (
  props: AddAgreementToContentListNotificationProps
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
      <NotificationHeader icon={IconContentLists}>
        <NotificationTitle>{messages.title}</NotificationTitle>
      </NotificationHeader>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <ProfilePicture profile={content listOwner} />
        <View style={{ flex: 1 }}>
          <NotificationText>
            <UserNameLink user={content listOwner} />
            {messages.addedAgreement}
            <EntityLink entity={agreement} />
            {messages.toContentList}
            <EntityLink entity={content list} />
          </NotificationText>
        </View>
      </View>
    </NotificationTile>
  )
}
