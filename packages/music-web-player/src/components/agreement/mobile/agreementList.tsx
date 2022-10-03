import { memo, useCallback } from 'react'

import { ID, CoverArtSizes } from '@coliving/common'
import cn from 'classnames'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'

import { HapticFeedbackMessage } from 'services/nativeMobileInterface/haptics'

import AgreementListItem from './connectedAgreementListItem'
import styles from './AgreementList.module.css'
import { AgreementItemAction } from './agreementListItem'

type AgreementListProps = {
  containerClassName?: string
  itemClassName?: string
  agreements: Array<{
    isLoading: boolean
    isSaved?: boolean
    isReposted?: boolean
    isActive?: boolean
    isPlaying?: boolean
    isRemoveActive?: boolean
    landlordHandle: string
    landlordName: string
    agreementTitle: string
    agreementId: ID
    uid?: string
    time?: number
    coverArtSizes?: CoverArtSizes
    isDeleted: boolean
  }>
  showTopDivider?: boolean
  showDivider?: boolean
  noDividerMargin?: boolean
  showBorder?: boolean
  onSave?: (isSaved: boolean, agreementId: ID) => void
  onRemove?: (index: number) => void
  togglePlay?: (uid: string, agreementId: ID) => void
  agreementItemAction?: AgreementItemAction
  isReorderable?: boolean
  onReorder?: (index1: number, index2: number) => void
}

const AgreementList = ({
  containerClassName = '',
  itemClassName,
  agreements,
  onSave,
  onRemove,
  showTopDivider,
  showDivider,
  noDividerMargin,
  showBorder,
  togglePlay,
  agreementItemAction,
  isReorderable = false,
  onReorder = () => {}
}: AgreementListProps) => {
  const onDragEnd = useCallback(
    (result: any) => {
      const { source, destination } = result

      if (!source || !destination) return
      if (
        destination.droppableId === source.droppableId &&
        destination.index === source.index
      )
        return
      onReorder(source.index, destination.index)
    },
    [onReorder]
  )
  const onDragStart = () => {
    const message = new HapticFeedbackMessage()
    message.send()
  }
  const onDragUpdate = () => {
    const message = new HapticFeedbackMessage()
    message.send()
  }

  // The dividers above and belove the active agreement should be hidden
  const activeIndex = agreements.findIndex((agreement) => agreement.isActive)
  const hideDivider = (idx: number) =>
    activeIndex >= 0 && (activeIndex === idx || activeIndex === idx - 1)

  const renderedAgreements = agreements.map((agreement, idx) => {
    const listItem = (isDragging?: boolean) => (
      <div key={agreement.uid}>
        {showDivider && (showTopDivider || idx > 0) ? (
          <div
            className={cn(styles.divider, {
              [styles.hideDivider]: hideDivider(idx),
              [styles.noMargin]: noDividerMargin
            })}
          ></div>
        ) : null}
        <AgreementListItem
          index={idx}
          agreementId={agreement.agreementId}
          className={itemClassName}
          isLoading={agreement.isLoading}
          isSaved={agreement.isSaved}
          isReposted={agreement.isReposted}
          isActive={agreement.isActive}
          isPlaying={agreement.isPlaying}
          landlordHandle={agreement.landlordHandle}
          landlordName={agreement.landlordName}
          agreementTitle={agreement.agreementTitle}
          coverArtSizes={agreement.coverArtSizes}
          uid={agreement.uid}
          isDeleted={agreement.isDeleted}
          onSave={onSave}
          isRemoveActive={agreement.isRemoveActive}
          onRemove={onRemove}
          togglePlay={togglePlay}
          agreementItemAction={agreementItemAction}
          isReorderable={isReorderable}
          isDragging={isDragging}
        />
      </div>
    )
    const key = agreement?.time
      ? `${agreement.agreementId}:${agreement.time}`
      : agreement.agreementId.toString()
    return isReorderable ? (
      <Draggable key={key} draggableId={key} index={idx}>
        {(provided: any, snapshot: any) => {
          const updatedStyles = provided.draggableProps.style.transform
            ? {
                transform: `translate3d(0, ${provided.draggableProps.style.transform.substring(
                  provided.draggableProps.style.transform.indexOf(',') + 1,
                  provided.draggableProps.style.transform.indexOf(')')
                )}, 0)`
              }
            : {}
          return (
            <div
              ref={provided.innerRef}
              {...provided.draggableProps}
              {...provided.dragHandleProps}
              style={{
                ...provided.draggableProps.style,
                ...provided.dragHandleProps.style,
                ...updatedStyles
              }}
            >
              {listItem(snapshot.isDragging)}
            </div>
          )
        }}
      </Draggable>
    ) : (
      listItem()
    )
  })

  return (
    <div
      className={cn(styles.agreementListContainer, containerClassName, {
        [styles.border]: showBorder
      })}
    >
      {isReorderable ? (
        <DragDropContext
          onDragEnd={onDragEnd}
          onDragStart={onDragStart}
          onDragUpdate={onDragUpdate}
        >
          <Droppable droppableId='agreement-list-droppable' type='AGREEMENT'>
            {(provided: any, snapshot: any) => (
              <div ref={provided.innerRef} {...provided.droppableProps}>
                {renderedAgreements}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      ) : (
        renderedAgreements
      )}
    </div>
  )
}

AgreementList.defaultProps = {
  hasTopDivider: false,
  showDivider: true,
  showBorder: false
}

export default memo(AgreementList)
