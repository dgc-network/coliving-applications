import type { ReactElement } from 'react'

import type { ID, UID } from '@coliving/common'
import type { FlatListProps } from 'react-native'
import { FlatList, View } from 'react-native'
import type { DraggableFlatListProps } from 'react-native-draggable-flatlist'
import DraggableFlatList from 'react-native-draggable-flatlist'
import { useSelector } from 'react-redux'

import * as haptics from 'app/haptics'
import { getPlaying, getPlayingUid } from 'app/store/digitalcoin/selectors'
import { makeStyles } from 'app/styles'

import type { DigitalContentItemAction } from './digitalContentListItem'
import { DigitalContentListItem } from './digitalContentListItem'
import { DigitalContentListItemSkeleton } from './digitalContentListItemSkeleton'
import type { DigitalContentMetadata, DigitalContentsMetadata } from './types'

type DigitalContentListProps = {
  hideArt?: boolean
  isReorderable?: boolean
  noDividerMargin?: boolean
  onRemove?: (index: number) => void
  onReorder?: DraggableFlatListProps<DigitalContentMetadata>['onDragEnd']
  onSave?: (isSaved: boolean, digitalContentId: ID) => void
  playingUid?: UID
  showDivider?: boolean
  showSkeleton?: boolean
  showTopDivider?: boolean
  togglePlay?: (uid: string, digitalContentId: ID) => void
  digitalContentItemAction?: DigitalContentItemAction
  digitalContents: DigitalContentsMetadata
} & Partial<FlatListProps<DigitalContentMetadata>>

const useStyles = makeStyles(({ palette, spacing }) => ({
  divider: {
    borderBottomColor: palette.neutralLight7,
    borderBottomWidth: 1,
    marginVertical: 0,
    marginHorizontal: spacing(6)
  },
  noMarginDivider: {
    borderBottomColor: palette.neutralLight8,
    marginHorizontal: 0
  },
  hideDivider: {
    opacity: 0
  }
}))

/**
 * A FlatList of digitalContents
 *
 * If isReorderable === true, make sure the DigitalContentList is not nested in a ScrollView,
 * otherwise certain features like auto scroll while dragging will not work
 */
export const DigitalContentList = ({
  hideArt,
  isReorderable,
  noDividerMargin,
  onRemove,
  onReorder,
  onSave,
  showDivider,
  showSkeleton,
  showTopDivider,
  togglePlay,
  digitalContentItemAction,
  digitalContents,
  ...otherProps
}: DigitalContentListProps) => {
  const styles = useStyles()

  const isPlaying = useSelector(getPlaying)
  const playingUid = useSelector(getPlayingUid)

  const renderSkeletonDigitalContent = ({ index }) => (
    <View>
      {showDivider && (showTopDivider || index > 0) ? (
        <View
          style={[styles.divider, noDividerMargin && styles.noMarginDivider]}
        />
      ) : null}
      <DigitalContentListItemSkeleton />
    </View>
  )

  const renderDraggableDigitalContent: DraggableFlatListProps<DigitalContentMetadata>['renderItem'] =
    ({ item: digital_content, index = -1, drag, isActive: isDragActive }) => {
      const isActive = digital_content.uid !== undefined && digital_content.uid === playingUid

      // The dividers above and belove the active digital_content should be hidden
      const hideDivider = isActive || digitalContents[index - 1]?.uid === playingUid

      return (
        <View>
          {showDivider && (showTopDivider || index > 0) ? (
            <View
              style={[
                styles.divider,
                hideDivider && styles.hideDivider,
                noDividerMargin && styles.noMarginDivider
              ]}
            />
          ) : null}
          <DigitalContentListItem
            index={index}
            drag={drag}
            hideArt={hideArt}
            isActive={isActive}
            isDragging={isDragActive}
            isPlaying={isPlaying}
            isReorderable={isReorderable}
            digital_content={digital_content}
            key={digital_content.digital_content_id}
            onSave={onSave}
            togglePlay={togglePlay}
            digitalContentItemAction={digitalContentItemAction}
            onRemove={onRemove}
          />
        </View>
      )
    }

  const renderDigitalContent: FlatListProps<DigitalContentMetadata>['renderItem'] = ({
    item,
    index
  }) =>
    renderDraggableDigitalContent({
      item,
      index,
      drag: () => {},
      isActive: false
    }) as ReactElement

  if (showSkeleton)
    return (
      <FlatList
        {...otherProps}
        data={digitalContents}
        renderItem={renderSkeletonDigitalContent}
      />
    )

  return isReorderable ? (
    <DraggableFlatList
      {...otherProps}
      autoscrollThreshold={200}
      data={digitalContents}
      keyExtractor={(digital_content, index) => `${digital_content.digital_content_id} ${index}`}
      onDragBegin={() => {
        haptics.light()
      }}
      onPlaceholderIndexChange={() => {
        haptics.light()
      }}
      onDragEnd={(p) => {
        onReorder?.(p)
      }}
      renderItem={renderDraggableDigitalContent}
      renderPlaceholder={() => <View />}
    />
  ) : (
    <FlatList {...otherProps} data={digitalContents} renderItem={renderDigitalContent} />
  )
}
