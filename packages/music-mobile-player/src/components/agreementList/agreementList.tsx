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

import type { AgreementItemAction } from './agreementListItem'
import { AgreementListItem } from './agreementListItem'
import { AgreementListItemSkeleton } from './agreementListItemSkeleton'
import type { AgreementMetadata, AgreementsMetadata } from './types'

type AgreementListProps = {
  hideArt?: boolean
  isReorderable?: boolean
  noDividerMargin?: boolean
  onRemove?: (index: number) => void
  onReorder?: DraggableFlatListProps<AgreementMetadata>['onDragEnd']
  onSave?: (isSaved: boolean, agreementId: ID) => void
  playingUid?: UID
  showDivider?: boolean
  showSkeleton?: boolean
  showTopDivider?: boolean
  togglePlay?: (uid: string, agreementId: ID) => void
  agreementItemAction?: AgreementItemAction
  agreements: AgreementsMetadata
} & Partial<FlatListProps<AgreementMetadata>>

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
 * A FlatList of agreements
 *
 * If isReorderable === true, make sure the AgreementList is not nested in a ScrollView,
 * otherwise certain features like auto scroll while dragging will not work
 */
export const AgreementList = ({
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
  agreementItemAction,
  agreements,
  ...otherProps
}: AgreementListProps) => {
  const styles = useStyles()

  const isPlaying = useSelector(getPlaying)
  const playingUid = useSelector(getPlayingUid)

  const renderSkeletonAgreement = ({ index }) => (
    <View>
      {showDivider && (showTopDivider || index > 0) ? (
        <View
          style={[styles.divider, noDividerMargin && styles.noMarginDivider]}
        />
      ) : null}
      <AgreementListItemSkeleton />
    </View>
  )

  const renderDraggableAgreement: DraggableFlatListProps<AgreementMetadata>['renderItem'] =
    ({ item: digital_content, index = -1, drag, isActive: isDragActive }) => {
      const isActive = digital_content.uid !== undefined && digital_content.uid === playingUid

      // The dividers above and belove the active digital_content should be hidden
      const hideDivider = isActive || agreements[index - 1]?.uid === playingUid

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
          <AgreementListItem
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
            agreementItemAction={agreementItemAction}
            onRemove={onRemove}
          />
        </View>
      )
    }

  const renderAgreement: FlatListProps<AgreementMetadata>['renderItem'] = ({
    item,
    index
  }) =>
    renderDraggableAgreement({
      item,
      index,
      drag: () => {},
      isActive: false
    }) as ReactElement

  if (showSkeleton)
    return (
      <FlatList
        {...otherProps}
        data={agreements}
        renderItem={renderSkeletonAgreement}
      />
    )

  return isReorderable ? (
    <DraggableFlatList
      {...otherProps}
      autoscrollThreshold={200}
      data={agreements}
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
      renderItem={renderDraggableAgreement}
      renderPlaceholder={() => <View />}
    />
  ) : (
    <FlatList {...otherProps} data={agreements} renderItem={renderAgreement} />
  )
}
