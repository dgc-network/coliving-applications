import { ReactNode } from 'react'

import styles from './notificationHeader.module.css'

type NotificationHeaderProps = {
  icon: ReactNode
  children: ReactNode
}

export const NotificationHeader = (props: NotificationHeaderProps) => {
  const { icon, children } = props
  return (
    <div className={styles.root}>
      {icon}
      {children}
    </div>
  )
}
