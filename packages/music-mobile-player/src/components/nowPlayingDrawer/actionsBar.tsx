import { useCallback, useLayoutEffect } from 'react'

import type { DigitalContent } from '@coliving/common'
import { FavoriteSource, RepostSource, ShareSource } from '@coliving/common'
import { updateMethod } from '@coliving/web/src/common/store/cast/slice'
import {
  repostDigitalContent,
  saveDigitalContent,
  undoRepostDigitalContent,
  unsaveDigitalContent
} from '@coliving/web/src/common/store/social/digital_contents/actions'
import { getUserId } from 'common/store/account/selectors'
import {
  getMethod as getCastMethod,
  getIsCasting
} from 'common/store/cast/selectors'
import { open as openOverflowMenu } from 'common/store/ui/mobile-overflow-menu/slice'
import {
  OverflowAction,
  OverflowSource
} from 'common/store/ui/mobile-overflow-menu/types'
import { requestOpen as requestOpenShareModal } from 'common/store/ui/share-modal/slice'
import { View, Platform } from 'react-native'
import { CastButton } from 'react-native-google-cast'

import IconAirplay from 'app/assets/images/iconAirplay.svg'
import IconKebabHorizontal from 'app/assets/images/iconKebabHorizontal.svg'
import IconShare from 'app/assets/images/iconShare.svg'
import { useAirplay } from 'app/components/audio/airplay'
import { IconButton } from 'app/components/core'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { makeStyles } from 'app/styles'
import { useThemeColors } from 'app/utils/theme'

import { FavoriteButton } from './favoriteButton'
import { RepostButton } from './repostButton'

const useStyles = makeStyles(({ palette, spacing }) => ({
  container: {
    marginTop: spacing(10),
    height: spacing(12),
    borderRadius: 10,
    backgroundColor: palette.neutralLight8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly'
  },
  button: {
    flexGrow: 1,
    alignItems: 'center'
  },
  animatedIcon: {
    width: spacing(7),
    height: spacing(7)
  },
  icon: {
    width: spacing(6),
    height: spacing(6)
  }
}))

type ActionsBarProps = {
  digital_content: DigitalContent
}

export const ActionsBar = ({ digital_content }: ActionsBarProps) => {
  const styles = useStyles()
  const currentUserId = useSelectorWeb(getUserId)
  const castMethod = useSelectorWeb(getCastMethod)
  const isCasting = useSelectorWeb(getIsCasting)
  const { neutral, primary } = useThemeColors()
  const dispatchWeb = useDispatchWeb()

  useLayoutEffect(() => {
    if (Platform.OS === 'android' && castMethod === 'airplay') {
      dispatchWeb(updateMethod({ method: 'chromecast' }))
    }
  }, [castMethod, dispatchWeb])

  const onToggleFavorite = useCallback(() => {
    if (digital_content) {
      if (digital_content.has_current_user_saved) {
        dispatchWeb(unsaveDigitalContent(digital_content.digital_content_id, FavoriteSource.NOW_PLAYING))
      } else {
        dispatchWeb(saveDigitalContent(digital_content.digital_content_id, FavoriteSource.NOW_PLAYING))
      }
    }
  }, [dispatchWeb, digital_content])

  const onToggleRepost = useCallback(() => {
    if (digital_content) {
      if (digital_content.has_current_user_reposted) {
        dispatchWeb(undoRepostDigitalContent(digital_content.digital_content_id, RepostSource.NOW_PLAYING))
      } else {
        dispatchWeb(repostDigitalContent(digital_content.digital_content_id, RepostSource.NOW_PLAYING))
      }
    }
  }, [dispatchWeb, digital_content])

  const onPressShare = useCallback(() => {
    if (digital_content) {
      dispatchWeb(
        requestOpenShareModal({
          type: 'digital_content',
          digitalContentId: digital_content.digital_content_id,
          source: ShareSource.NOW_PLAYING
        })
      )
    }
  }, [dispatchWeb, digital_content])

  const onPressOverflow = useCallback(() => {
    if (digital_content) {
      const isOwner = currentUserId === digital_content.owner_id
      const overflowActions = [
        !isOwner
          ? digital_content.has_current_user_reposted
            ? OverflowAction.UNREPOST
            : OverflowAction.REPOST
          : null,
        !isOwner
          ? digital_content.has_current_user_saved
            ? OverflowAction.UNFAVORITE
            : OverflowAction.FAVORITE
          : null,
        OverflowAction.SHARE,
        OverflowAction.ADD_TO_CONTENT_LIST,
        OverflowAction.VIEW_DIGITAL_CONTENT_PAGE,
        OverflowAction.VIEW_LANDLORD_PAGE
      ].filter(Boolean) as OverflowAction[]

      dispatchWeb(
        openOverflowMenu({
          source: OverflowSource.DIGITAL_CONTENTS,
          id: digital_content.digital_content_id,
          overflowActions
        })
      )
    }
  }, [digital_content, currentUserId, dispatchWeb])

  const { openAirplayDialog } = useAirplay()

  const renderCastButton = () => {
    if (castMethod === 'airplay') {
      return (
        <IconButton
          onPress={openAirplayDialog}
          icon={IconAirplay}
          fill={isCasting ? primary : neutral}
          styles={{ icon: styles.icon, root: styles.button }}
        />
      )
    }
    return (
      <CastButton
        style={{
          ...styles.button,
          ...styles.icon,
          tintColor: isCasting ? primary : neutral
        }}
      />
    )
  }

  const renderRepostButton = () => {
    return (
      <RepostButton
        iconIndex={digital_content.has_current_user_reposted ? 1 : 0}
        onPress={onToggleRepost}
        style={styles.button}
        wrapperStyle={styles.animatedIcon}
      />
    )
  }

  const renderFavoriteButton = () => {
    return (
      <FavoriteButton
        iconIndex={digital_content.has_current_user_saved ? 1 : 0}
        onPress={onToggleFavorite}
        style={styles.button}
        wrapperStyle={styles.animatedIcon}
      />
    )
  }

  const renderShareButton = () => {
    return (
      <IconButton
        icon={IconShare}
        styles={{ icon: styles.icon, root: styles.button }}
        onPress={onPressShare}
      />
    )
  }

  const renderOptionsButton = () => {
    return (
      <IconButton
        icon={IconKebabHorizontal}
        styles={{ icon: styles.icon, root: styles.button }}
        onPress={onPressOverflow}
      />
    )
  }

  return (
    <View style={styles.container}>
      {renderCastButton()}
      {renderRepostButton()}
      {renderFavoriteButton()}
      {renderShareButton()}
      {renderOptionsButton()}
    </View>
  )
}
