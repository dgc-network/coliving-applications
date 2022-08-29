import { useCallback, useState } from 'react'

import { ID, SmartCollectionVariant } from '@coliving/common'
import { IconKebabHorizontal, IconButton } from '@coliving/stems'
import cn from 'classnames'
import { NavLink, NavLinkProps } from 'react-router-dom'

import { AccountCollection } from 'common/store/account/reducer'
import Draggable from 'components/dragndrop/Draggable'
import Droppable from 'components/dragndrop/Droppable'
import Tooltip from 'components/tooltip/Tooltip'
import UpdateDot from 'components/update-dot/UpdateDot'
import { getPathname } from 'utils/route'

import navColumnStyles from './NavColumn.module.css'
import styles from './ContentListLibrary.module.css'

const messages = { recentlyUpdatedTooltip: 'Recently Updated' }

type ContentListNavLinkProps = NavLinkProps & {
  droppableKey: ID | SmartCollectionVariant
  contentListId: ID | SmartCollectionVariant
  name: string
  onReorder: (
    draggingId: ID | SmartCollectionVariant | string,
    droppingId: ID | SmartCollectionVariant | string,
    draggingKind: 'library-content-list' | 'contentList' | 'content-list-folder'
  ) => void
  link?: string
  isInsideFolder?: boolean
}

export const ContentListNavLink = ({
  droppableKey,
  contentListId,
  name,
  link,
  onReorder,
  children,
  className,
  isInsideFolder,
  ...navLinkProps
}: ContentListNavLinkProps) => {
  const [isDragging, setIsDragging] = useState(false)
  const onDrag = useCallback(() => {
    setIsDragging(true)
  }, [setIsDragging])
  const onDrop = useCallback(() => {
    setIsDragging(false)
  }, [setIsDragging])
  return (
    <Droppable
      key={droppableKey}
      className={styles.droppable}
      hoverClassName={styles.droppableHover}
      onDrop={(id: ID | SmartCollectionVariant | string, draggingKind) => {
        onReorder(id, contentListId, draggingKind)
      }}
      stopPropogationOnDrop={true}
      acceptedKinds={
        isInsideFolder
          ? ['library-content-list']
          : ['library-content-list', 'content-list-folder']
      }
    >
      <Draggable
        id={contentListId}
        text={name}
        link={link}
        kind='library-content-list'
        onDrag={onDrag}
        onDrop={onDrop}
      >
        <NavLink
          {...navLinkProps}
          draggable={false}
          className={cn(className, styles.navLink, {
            [styles.dragging]: isDragging
          })}
        >
          {children}
        </NavLink>
      </Draggable>
    </Droppable>
  )
}

type ContentListNavItemProps = {
  contentList: AccountCollection
  url: string
  addAgreement: (agreementId: ID) => void
  isOwner: boolean
  onReorder: (
    draggingId: ID | SmartCollectionVariant | string,
    droppingId: ID | SmartCollectionVariant | string,
    draggingKind: 'library-content-list' | 'contentList' | 'content-list-folder'
  ) => void
  hasUpdate?: boolean
  dragging: boolean
  draggingKind: string
  onClickContentList: (id: ID, hasUpdate: boolean) => void
  onClickEdit?: (id: ID) => void
  isInsideFolder?: boolean
}
export const ContentListNavItem = ({
  contentList,
  hasUpdate = false,
  url,
  addAgreement,
  isOwner,
  onReorder,
  dragging,
  draggingKind,
  onClickContentList,
  onClickEdit,
  isInsideFolder
}: ContentListNavItemProps) => {
  const { id, name } = contentList
  const [isHovering, setIsHovering] = useState(false)

  return (
    <Droppable
      key={id}
      className={navColumnStyles.droppable}
      hoverClassName={navColumnStyles.droppableHover}
      onDrop={addAgreement}
      acceptedKinds={['agreement']}
      disabled={!isOwner}
    >
      <ContentListNavLink
        isInsideFolder={isInsideFolder}
        droppableKey={id}
        contentListId={id}
        name={name}
        link={url}
        to={url}
        onReorder={onReorder}
        isActive={() => url === getPathname()}
        activeClassName='active'
        className={cn(navColumnStyles.link, {
          [navColumnStyles.droppableLink]:
            isOwner &&
            dragging &&
            (draggingKind === 'agreement' || draggingKind === 'contentList'),
          [navColumnStyles.editable]: isOwner && onClickEdit != null,
          [navColumnStyles.disabledLink]:
            dragging &&
            ((draggingKind !== 'agreement' &&
              draggingKind !== 'contentList' &&
              draggingKind !== 'library-content-list') ||
              !isOwner)
        })}
        onClick={() => onClickContentList(id, hasUpdate)}
        onMouseEnter={() => {
          setIsHovering(true)
        }}
        onMouseLeave={() => setIsHovering(false)}
      >
        <div className={styles.libraryLinkContentContainer}>
          {!hasUpdate ? null : (
            <div className={navColumnStyles.updateDotContainer}>
              <Tooltip
                className={navColumnStyles.updateDotTooltip}
                shouldWrapContent={true}
                shouldDismissOnClick={false}
                mouseEnterDelay={0.1}
                text={messages.recentlyUpdatedTooltip}
              >
                <div>
                  <UpdateDot />
                </div>
              </Tooltip>
            </div>
          )}
          <div className={styles.libraryLinkTextContainer}>
            <span>{name}</span>
          </div>
          {!isOwner || !onClickEdit ? null : (
            <IconButton
              aria-label='Edit contentList'
              className={cn(styles.iconKebabHorizontal, {
                [styles.hidden]: !isHovering || dragging
              })}
              icon={<IconKebabHorizontal height={11} width={11} />}
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                onClickEdit(id)
              }}
            />
          )}
        </div>
      </ContentListNavLink>
    </Droppable>
  )
}
