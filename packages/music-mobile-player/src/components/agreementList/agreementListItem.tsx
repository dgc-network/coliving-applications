import { useCallback, useMemo, useState } from 'react'

import type { ID } from '@coliving/common'
import { getUserId } from '@coliving/web/src/common/store/account/selectors'
import {
  OverflowAction,
  OverflowSource
} from '@coliving/web/src/common/store/ui/mobile-overflow-menu/types'
import { open as openOverflowMenu } from 'common/store/ui/mobile-overflow-menu/slice'
import type { NativeSyntheticEvent, NativeTouchEvent } from 'react-native'
import { Text, TouchableOpacity, View } from 'react-native'

import IconDrag from 'app/assets/images/iconDrag.svg'
import IconHeart from 'app/assets/images/iconHeart.svg'
import IconKebabHorizontal from 'app/assets/images/iconKebabHorizontal.svg'
import IconRemoveDigitalContent from 'app/assets/images/iconRemoveDigitalContent.svg'
import { IconButton } from 'app/components/core'
import UserBadges from 'app/components/userBadges'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { font, makeStyles } from 'app/styles'
import { useThemeColors } from 'app/utils/theme'

import { TablePlayButton } from './tablePlayButton'
import { DigitalContentArtwork } from './DigitalContentArtwork'
import type { DigitalContentMetadata } from './types'

export type DigitalContentItemAction = 'save' | 'overflow' | 'remove'

const useStyles = makeStyles(({ palette, spacing }) => ({
  digitalContentContainer: {
    width: '100%',
    height: 72,
    backgroundColor: palette.white
  },
  digitalContentContainerActive: {
    backgroundColor: palette.neutralLight9
  },
  digitalContentContainerDisabled: {
    backgroundColor: palette.neutralLight9
  },
  digitalContentInnerContainer: {
    height: '100%',
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingVertical: spacing(3),
    paddingHorizontal: spacing(6)
  },
  nameLandlordContainer: {
    flex: 1,
    justifyContent: 'center',
    overflow: 'hidden',
    height: '100%'
  },
  digitalContentTitle: {
    flexDirection: 'row'
  },
  digitalContentTitleText: {
    ...font('demiBold'),
    color: palette.neutral
  },
  landlordName: {
    ...font('medium'),
    color: palette.neutralLight2,
    alignItems: 'center'
  },
  iconContainer: {
    marginLeft: spacing(2)
  },
  icon: { height: 16, width: 16 },
  removeIcon: { height: 20, width: 20 },

  playButtonContainer: {
    marginRight: spacing(4)
  },
  dragIcon: {
    marginRight: spacing(6)
  }
}))

const getMessages = ({ isDeleted = false }: { isDeleted?: boolean } = {}) => ({
  deleted: isDeleted ? ' [Deleted By Author]' : ''
})

export type DigitalContentListItemProps = {
  drag: () => void
  hideArt?: boolean
  index: number
  isActive?: boolean
  isDragging?: boolean
  isLoading?: boolean
  isPlaying?: boolean
  isRemoveActive?: boolean
  isReorderable?: boolean
  onRemove?: (index: number) => void
  onSave?: (isSaved: boolean, digitalContentId: ID) => void
  togglePlay?: (uid: string, digitalContentId: ID) => void
  digital_content: DigitalContentMetadata
  digitalContentItemAction?: DigitalContentItemAction
}

export const DigitalContentListItem = ({
  drag,
  hideArt,
  index,
  isActive,
  isDragging = false,
  isRemoveActive = false,
  isReorderable = false,
  isLoading = false,
  isPlaying = false,
  onRemove,
  onSave,
  togglePlay,
  digital_content,
  digitalContentItemAction
}: DigitalContentListItemProps) => {
  const {
    _cover_art_sizes,
    has_current_user_reposted,
    has_current_user_saved,
    is_delete,
    is_unlisted,
    title,
    digital_content_id,
    uid,
    user: { name, is_deactivated, user_id }
  } = digital_content
  const isDeleted = is_delete || !!is_deactivated || is_unlisted

  const messages = getMessages({ isDeleted })
  const styles = useStyles()
  const dispatchWeb = useDispatchWeb()
  const themeColors = useThemeColors()
  const currentUserId = useSelectorWeb(getUserId)
  const [titleWidth, setTitleWidth] = useState(0)

  const deletedTextWidth = useMemo(
    () => (messages.deleted.length ? 124 : 0),
    [messages]
  )

  const onPressDigitalContent = () => {
    if (uid && !isDeleted && togglePlay) {
      togglePlay(uid, digital_content_id)
    }
  }

  const handleOpenOverflowMenu = useCallback(() => {
    const isOwner = currentUserId === user_id

    const overflowActions = [
      !isOwner
        ? has_current_user_reposted
          ? OverflowAction.UNREPOST
          : OverflowAction.REPOST
        : null,
      !isOwner
        ? has_current_user_saved
          ? OverflowAction.UNFAVORITE
          : OverflowAction.FAVORITE
        : null,
      OverflowAction.ADD_TO_CONTENT_LIST,
      OverflowAction.VIEW_AGREEMENT_PAGE,
      OverflowAction.VIEW_LANDLORD_PAGE
    ].filter(Boolean) as OverflowAction[]

    dispatchWeb(
      openOverflowMenu({
        source: OverflowSource.AGREEMENTS,
        id: digital_content_id,
        overflowActions
      })
    )
  }, [
    currentUserId,
    user_id,
    has_current_user_reposted,
    has_current_user_saved,
    dispatchWeb,
    digital_content_id
  ])

  const handlePressSave = (e: NativeSyntheticEvent<NativeTouchEvent>) => {
    e.stopPropagation()
    const isNotAvailable = isDeleted && !has_current_user_saved
    if (!isNotAvailable && onSave) {
      onSave(has_current_user_saved, digital_content_id)
    }
  }

  const handlePressOverflow = (e: NativeSyntheticEvent<NativeTouchEvent>) => {
    e.stopPropagation()
    handleOpenOverflowMenu()
  }

  const handlePressRemove = () => {
    onRemove?.(index)
  }

  return (
    <View
      style={[
        styles.digitalContentContainer,
        isActive && styles.digitalContentContainerActive,
        isDeleted && styles.digitalContentContainerDisabled
      ]}
    >
      <TouchableOpacity
        style={styles.digitalContentInnerContainer}
        onPress={onPressDigitalContent}
        onLongPress={drag}
        disabled={isDeleted}
      >
        {!hideArt ? (
          <DigitalContentArtwork
            digitalContentId={digital_content_id}
            coverArtSizes={_cover_art_sizes}
            isActive={isActive}
            isLoading={isLoading}
            isPlaying={isPlaying}
          />
        ) : isActive && !isDeleted ? (
          <View style={styles.playButtonContainer}>
            <TablePlayButton
              playing
              paused={!isPlaying}
              hideDefault={false}
              onPress={onPressDigitalContent}
            />
          </View>
        ) : null}
        {isReorderable && <IconDrag style={styles.dragIcon} />}
        <View style={styles.nameLandlordContainer}>
          <View
            style={styles.digitalContentTitle}
            onLayout={(e) => setTitleWidth(e.nativeEvent.layout.width)}
          >
            <Text
              numberOfLines={1}
              style={[
                styles.digitalContentTitleText,
                {
                  maxWidth: titleWidth ? titleWidth - deletedTextWidth : '100%'
                }
              ]}
            >
              {title}
            </Text>
            <Text
              numberOfLines={1}
              style={[styles.digitalContentTitleText, { flexBasis: deletedTextWidth }]}
            >
              {messages.deleted}
            </Text>
          </View>
          <Text numberOfLines={1} style={styles.landlordName}>
            {name}
            <UserBadges user={digital_content.user} badgeSize={12} hideName />
          </Text>
        </View>
        {digitalContentItemAction === 'save' ? (
          <IconButton
            icon={IconHeart}
            styles={{
              root: styles.iconContainer,
              icon: styles.icon
            }}
            fill={
              has_current_user_saved
                ? themeColors.primary
                : themeColors.neutralLight4
            }
            onPress={handlePressSave}
          />
        ) : null}
        {digitalContentItemAction === 'overflow' ? (
          <IconButton
            icon={IconKebabHorizontal}
            styles={{
              root: styles.iconContainer,
              icon: styles.icon
            }}
            onPress={handlePressOverflow}
          />
        ) : null}
        {digitalContentItemAction === 'remove' ? (
          <IconButton
            icon={IconRemoveDigitalContent}
            styles={{
              root: styles.iconContainer,
              icon: styles.removeIcon
            }}
            onPress={handlePressRemove}
          />
        ) : null}
      </TouchableOpacity>
    </View>
  )
}
