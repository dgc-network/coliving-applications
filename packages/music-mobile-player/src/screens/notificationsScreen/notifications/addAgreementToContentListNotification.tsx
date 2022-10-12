import { useCallback } from 'react'

import { getNotificationEntities } from '@coliving/web/src/common/store/notifications/selectors'
import type { AddAgreementToContentList } from '@coliving/web/src/common/store/notifications/types'
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
  title: 'DigitalContent Added to ContentList',
  addedAgreement: ' added your digital_content ',
  toContentList: ' to their contentList '
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
  const { digital_content, contentList } = entities
  const contentListOwner = contentList.user

  const navigation = useDrawerNavigation()

  const handlePress = useCallback(() => {
    if (contentList) {
      navigation.navigate({
        native: getEntityScreen(contentList),
        web: { route: getEntityRoute(contentList) }
      })
    }
  }, [contentList, navigation])

  return (
    <NotificationTile notification={notification} onPress={handlePress}>
      <NotificationHeader icon={IconContentLists}>
        <NotificationTitle>{messages.title}</NotificationTitle>
      </NotificationHeader>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <ProfilePicture profile={contentListOwner} />
        <View style={{ flex: 1 }}>
          <NotificationText>
            <UserNameLink user={contentListOwner} />
            {messages.addedAgreement}
            <EntityLink entity={digital_content} />
            {messages.toContentList}
            <EntityLink entity={contentList} />
          </NotificationText>
        </View>
      </View>
    </NotificationTile>
  )
}
