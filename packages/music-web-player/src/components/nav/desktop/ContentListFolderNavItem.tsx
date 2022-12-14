import {
  ComponentPropsWithoutRef,
  ReactNode,
  useCallback,
  useState
} from 'react'

import {
  ID,
  Name,
  ContentListLibraryFolder,
  SmartCollectionVariant
} from '@coliving/common'
import {
  IconCaretRight,
  IconFolder,
  IconFolderOutline,
  IconKebabHorizontal,
  IconButton
} from '@coliving/stems'
import { ResizeObserver } from '@juggle/resize-observer'
import cn from 'classnames'
import { useSpring, animated } from 'react-spring'
import useMeasure from 'react-use-measure'

import Draggable from 'components/dragndrop/draggable'
import Droppable from 'components/dragndrop/droppable'
import { useRecord, make } from 'store/analytics/actions'

import navColumnStyles from './NavColumn.module.css'
import styles from './ContentListLibrary.module.css'

type ContentListFolderNavButtonProps = ComponentPropsWithoutRef<'button'>

const FolderNavLink = ({
  id,
  name,
  children,
  className,
  ...buttonProps
}: ContentListFolderNavButtonProps) => {
  const [isDragging, setIsDragging] = useState(false)
  const onDrag = useCallback(() => {
    setIsDragging(true)
  }, [setIsDragging])
  const onDrop = useCallback(() => {
    setIsDragging(false)
  }, [setIsDragging])

  return (
    <Draggable
      id={id}
      text={name}
      kind='content-list-folder'
      onDrag={onDrag}
      onDrop={onDrop}
    >
      <button
        {...buttonProps}
        draggable={false}
        className={cn(className, styles.navLink, {
          [styles.dragging]: isDragging
        })}
      >
        {children}
      </button>
    </Draggable>
  )
}

type ContentListFolderNavItemProps = {
  folder: ContentListLibraryFolder
  hasUpdate: boolean
  dragging: boolean
  draggingKind: string
  onClickEdit: (folderId: string) => void
  onDropInFolder: (
    folder: ContentListLibraryFolder,
    draggingKind: 'library-content-list' | 'contentList',
    draggingId: ID | string | SmartCollectionVariant
  ) => void
  onDropBelowFolder: (
    folderId: string,
    draggingKind: 'content-list-folder' | 'library-content-list',
    draggingId: ID | string | SmartCollectionVariant
  ) => void
  children?: ReactNode
}

export const ContentListFolderNavItem = ({
  folder,
  hasUpdate = false,
  dragging,
  draggingKind,
  onClickEdit,
  onDropBelowFolder,
  onDropInFolder,
  children
}: ContentListFolderNavItemProps) => {
  const { id, name } = folder
  const isDroppableKind =
    draggingKind === 'library-content-list' || draggingKind === 'contentList'
  const [isHovering, setIsHovering] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const record = useRecord()
  const [ref, bounds] = useMeasure({
    polyfill: ResizeObserver
  })
  const contentsStyle = useSpring({
    height: isExpanded ? bounds.height : 0,
    opacity: isExpanded ? 100 : 0,
    overflow: 'hidden'
  })
  const handleClickFolder = () => {
    const prevIsExpanded = isExpanded
    setIsExpanded(!isExpanded)
    if (prevIsExpanded) {
      record(make(Name.CONTENT_LIST_LIBRARY_COLLAPSE_FOLDER, {}))
    } else {
      record(make(Name.CONTENT_LIST_LIBRARY_EXPAND_FOLDER, {}))
    }
  }

  return (
    <>
      {/* This is the droppable area for adding a contentList into a folder */}
      <Droppable
        className={navColumnStyles.droppable}
        hoverClassName={navColumnStyles.droppableHover}
        onDrop={(contentListId, kind) => {
          onDropInFolder(folder, kind, contentListId)
        }}
        acceptedKinds={['library-content-list', 'contentList']}
      >
        <FolderNavLink
          onMouseEnter={() => {
            setIsHovering(true)
          }}
          onMouseLeave={() => setIsHovering(false)}
          id={id}
          name={name}
          className={cn(navColumnStyles.link, navColumnStyles.editable, {
            [navColumnStyles.droppableLink]: dragging && isDroppableKind,
            [navColumnStyles.disabledLink]: dragging && !isDroppableKind
          })}
          onClick={handleClickFolder}
        >
          <div className={styles.libraryLinkContentContainer}>
            {children == null ? (
              <IconFolderOutline
                width={12}
                height={12}
                className={styles.iconFolder}
              />
            ) : (
              <IconFolder
                width={12}
                height={12}
                className={cn(styles.iconFolder, {
                  [styles.iconFolderUpdated]: hasUpdate
                })}
              />
            )}
            <div className={styles.libraryLinkTextContainer}>
              <span>{name}</span>
            </div>
            <IconCaretRight
              height={11}
              width={11}
              className={cn(styles.iconCaret, {
                [styles.iconCaretDown]: isExpanded
              })}
            />
            <IconButton
              aria-label='More contentList actions'
              className={cn(styles.iconKebabHorizontal, {
                [styles.hidden]: !isHovering || dragging
              })}
              icon={<IconKebabHorizontal height={11} width={11} />}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onClickEdit(id)
              }}
            />
          </div>
        </FolderNavLink>
        {children == null ? null : (
          <animated.div style={contentsStyle}>
            <div ref={ref}>{children}</div>
          </animated.div>
        )}
      </Droppable>
      {/* This is the droppable area for reordering something below this contentList
      folder item. */}
      <Droppable
        className={styles.droppable}
        hoverClassName={styles.droppableHover}
        onDrop={(draggingId, kind) => {
          onDropBelowFolder(id, kind, draggingId)
        }}
        acceptedKinds={['content-list-folder', 'library-content-list']}
      />
    </>
  )
}
