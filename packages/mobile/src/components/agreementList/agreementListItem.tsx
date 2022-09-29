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
import IconRemoveAgreement from 'app/assets/images/iconRemoveAgreement.svg'
import { IconButton } from 'app/components/core'
import UserBadges from 'app/components/userBadges'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { font, makeStyles } from 'app/styles'
import { useThemeColors } from 'app/utils/theme'

import { TablePlayButton } from './tablePlayButton'
import { AgreementArtwork } from './AgreementArtwork'
import type { AgreementMetadata } from './types'

export type AgreementItemAction = 'save' | 'overflow' | 'remove'

const useStyles = makeStyles(({ palette, spacing }) => ({
  agreementContainer: {
    width: '100%',
    height: 72,
    backgroundColor: palette.white
  },
  agreementContainerActive: {
    backgroundColor: palette.neutralLight9
  },
  agreementContainerDisabled: {
    backgroundColor: palette.neutralLight9
  },
  agreementInnerContainer: {
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
  agreementTitle: {
    flexDirection: 'row'
  },
  agreementTitleText: {
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
  deleted: isDeleted ? ' [Deleted By Landlord]' : ''
})

export type AgreementListItemProps = {
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
  onSave?: (isSaved: boolean, agreementId: ID) => void
  togglePlay?: (uid: string, agreementId: ID) => void
  agreement: AgreementMetadata
  agreementItemAction?: AgreementItemAction
}

export const AgreementListItem = ({
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
  agreement,
  agreementItemAction
}: AgreementListItemProps) => {
  const {
    _cover_art_sizes,
    has_current_user_reposted,
    has_current_user_saved,
    is_delete,
    is_unlisted,
    title,
    agreement_id,
    uid,
    user: { name, is_deactivated, user_id }
  } = agreement
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

  const onPressAgreement = () => {
    if (uid && !isDeleted && togglePlay) {
      togglePlay(uid, agreement_id)
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
        id: agreement_id,
        overflowActions
      })
    )
  }, [
    currentUserId,
    user_id,
    has_current_user_reposted,
    has_current_user_saved,
    dispatchWeb,
    agreement_id
  ])

  const handlePressSave = (e: NativeSyntheticEvent<NativeTouchEvent>) => {
    e.stopPropagation()
    const isNotAvailable = isDeleted && !has_current_user_saved
    if (!isNotAvailable && onSave) {
      onSave(has_current_user_saved, agreement_id)
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
        styles.agreementContainer,
        isActive && styles.agreementContainerActive,
        isDeleted && styles.agreementContainerDisabled
      ]}
    >
      <TouchableOpacity
        style={styles.agreementInnerContainer}
        onPress={onPressAgreement}
        onLongPress={drag}
        disabled={isDeleted}
      >
        {!hideArt ? (
          <AgreementArtwork
            agreementId={agreement_id}
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
              onPress={onPressAgreement}
            />
          </View>
        ) : null}
        {isReorderable && <IconDrag style={styles.dragIcon} />}
        <View style={styles.nameLandlordContainer}>
          <View
            style={styles.agreementTitle}
            onLayout={(e) => setTitleWidth(e.nativeEvent.layout.width)}
          >
            <Text
              numberOfLines={1}
              style={[
                styles.agreementTitleText,
                {
                  maxWidth: titleWidth ? titleWidth - deletedTextWidth : '100%'
                }
              ]}
            >
              {title}
            </Text>
            <Text
              numberOfLines={1}
              style={[styles.agreementTitleText, { flexBasis: deletedTextWidth }]}
            >
              {messages.deleted}
            </Text>
          </View>
          <Text numberOfLines={1} style={styles.landlordName}>
            {name}
            <UserBadges user={agreement.user} badgeSize={12} hideName />
          </Text>
        </View>
        {agreementItemAction === 'save' ? (
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
        {agreementItemAction === 'overflow' ? (
          <IconButton
            icon={IconKebabHorizontal}
            styles={{
              root: styles.iconContainer,
              icon: styles.icon
            }}
            onPress={handlePressOverflow}
          />
        ) : null}
        {agreementItemAction === 'remove' ? (
          <IconButton
            icon={IconRemoveAgreement}
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
