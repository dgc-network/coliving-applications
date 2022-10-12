import { Button, ButtonType } from '@coliving/stems'
import cn from 'classnames'

import styles from './notificationPermissionsPage.module.css'

const messages = {
  title: 'Can we send you Notifications?',
  description:
    'We’ll notify you when people follow you, repost your digitalContents, and more!',
  notice: 'You can customize this later in settings.',
  allow: 'Allow Notifications',
  skip: 'Skip for now'
}

type NotificationPermissionsPageProps = {
  onAllowNotifications: () => void
  onSkip: () => void
}

const NotificationPermissionsPage = (
  props: NotificationPermissionsPageProps
) => {
  return (
    <div className={cn(styles.container)}>
      <div className={cn(styles.title)}>{messages.title}</div>
      <div className={cn(styles.bodyText, styles.description)}>
        {messages.description}
      </div>
      <div className={cn(styles.bodyText, styles.notice)}>
        {messages.notice}
      </div>
      <Button
        onClick={props.onAllowNotifications}
        text={messages.allow}
        type={ButtonType.PRIMARY_ALT} css={undefined}      />
      <div className={cn(styles.skipText)} onClick={props.onSkip}>
        {messages.skip}
      </div>
    </div>
  )
}

export default NotificationPermissionsPage
