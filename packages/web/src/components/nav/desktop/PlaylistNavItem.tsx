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
import styles from './PlaylistLibrary.module.css'

const messages = { recentlyUpdatedTooltip: 'Recently Updated' }

type PlaylistNavLinkProps = NavLinkProps & {
  droppableKey: ID | SmartCollectionVariant
  content listId: ID | SmartCollectionVariant
  name: string
  onReorder: (
    draggingId: ID | SmartCollectionVariant | string,
    droppingId: ID | SmartCollectionVariant | string,
    draggingKind: 'library-content list' | 'content list' | 'content list-folder'
  ) => void
  link?: string
  isInsideFolder?: boolean
}

export const PlaylistNavLink = ({
  droppableKey,
  content listId,
  name,
  link,
  onReorder,
  children,
  className,
  isInsideFolder,
  ...navLinkProps
}: PlaylistNavLinkProps) => {
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
        onReorder(id, content listId, draggingKind)
      }}
      stopPropogationOnDrop={true}
      acceptedKinds={
        isInsideFolder
          ? ['library-content list']
          : ['library-content list', 'content list-folder']
      }
    >
      <Draggable
        id={content listId}
        text={name}
        link={link}
        kind='library-content list'
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

type PlaylistNavItemProps = {
  content list: AccountCollection
  url: string
  addAgreement: (agreementId: ID) => void
  isOwner: boolean
  onReorder: (
    draggingId: ID | SmartCollectionVariant | string,
    droppingId: ID | SmartCollectionVariant | string,
    draggingKind: 'library-content list' | 'content list' | 'content list-folder'
  ) => void
  hasUpdate?: boolean
  dragging: boolean
  draggingKind: string
  onClickPlaylist: (id: ID, hasUpdate: boolean) => void
  onClickEdit?: (id: ID) => void
  isInsideFolder?: boolean
}
export const PlaylistNavItem = ({
  content list,
  hasUpdate = false,
  url,
  addAgreement,
  isOwner,
  onReorder,
  dragging,
  draggingKind,
  onClickPlaylist,
  onClickEdit,
  isInsideFolder
}: PlaylistNavItemProps) => {
  const { id, name } = content list
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
      <PlaylistNavLink
        isInsideFolder={isInsideFolder}
        droppableKey={id}
        content listId={id}
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
            (draggingKind === 'agreement' || draggingKind === 'content list'),
          [navColumnStyles.editable]: isOwner && onClickEdit != null,
          [navColumnStyles.disabledLink]:
            dragging &&
            ((draggingKind !== 'agreement' &&
              draggingKind !== 'content list' &&
              draggingKind !== 'library-content list') ||
              !isOwner)
        })}
        onClick={() => onClickPlaylist(id, hasUpdate)}
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
              aria-label='Edit content list'
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
      </PlaylistNavLink>
    </Droppable>
  )
}
