import React from 'react'
import clsx from 'clsx'
import SimpleBar from 'simplebar-react'

import styles from './TimelineModal.module.css'
import Modal from 'components/modal'
import TimelineEvent from './timelineEvent'
import { TimelineEvent as TimelineEventType } from 'models/timelineEvents'

const messages = {
  title: 'Timeline'
}

type OwnProps = {
  className?: string
  isOpen: boolean
  onClose: () => void
  events: TimelineEventType[]
}

type TimelineModalProps = OwnProps

const TimelineModal: React.FC<TimelineModalProps> = ({
  className,
  isOpen,
  onClose,
  events
}: TimelineModalProps) => {
  return (
    <Modal
      isCloseable
      dismissOnClickOutside
      wrapperClassName={styles.timelineWrapper}
      headerClassName={styles.headerClassName}
      className={clsx(styles.timelineContainer, { [className!]: !!className })}
      isOpen={isOpen}
      onClose={onClose}
      title={messages.title}
    >
      <SimpleBar className={styles.scrollable}>
        {events.map((event, i) => (
          <TimelineEvent
            className={styles.modalEvent}
            key={i}
            isDisabled
            event={event}
          />
        ))}
      </SimpleBar>
    </Modal>
  )
}

export default TimelineModal
