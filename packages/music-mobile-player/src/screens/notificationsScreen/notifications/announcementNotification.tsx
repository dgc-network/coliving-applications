import type { Announcement } from '@coliving/web/src/common/store/notifications/types'
import Markdown from 'react-native-markdown-display'

import IconColiving from 'app/assets/images/iconColiving.svg'
import { makeStyles } from 'app/styles'

import {
  NotificationHeader,
  NotificationText,
  NotificationTile,
  NotificationTitle
} from '../notification'

const useStyles = makeStyles(({ typography, palette }) => ({
  title: {
    ...typography.h1,
    marginBottom: 0,
    color: palette.secondary
  },
  body: {
    fontSize: typography.fontSize.large,
    fontFamily: typography.fontByWeight.medium,
    lineHeight: 27,
    color: palette.neutral
  },
  link: {
    fontSize: typography.fontSize.large,
    fontFamily: typography.fontByWeight.medium,
    color: palette.secondary
  }
}))

type AnnouncementNotificationProps = {
  notification: Announcement
}

export const AnnouncementNotification = (
  props: AnnouncementNotificationProps
) => {
  const { notification } = props
  const { title, shortDescription } = notification
  const styles = useStyles()

  return (
    <NotificationTile notification={notification}>
      <NotificationHeader icon={IconColiving}>
        <NotificationTitle>
          <Markdown style={{ body: styles.title, link: styles.title }}>
            {title}
          </Markdown>
        </NotificationTitle>
      </NotificationHeader>
      <NotificationText>
        <Markdown style={styles}>{shortDescription}</Markdown>
      </NotificationText>
    </NotificationTile>
  )
}
