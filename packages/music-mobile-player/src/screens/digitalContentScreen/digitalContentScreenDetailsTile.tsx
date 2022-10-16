import { useCallback } from 'react'

import type { UID, DigitalContent, User } from '@coliving/common'
import {
  FavoriteSource,
  RepostSource,
  ShareSource,
  Name,
  PlaybackSource,
  FavoriteType,
  SquareSizes
} from '@coliving/common'
import { getUserId } from '@coliving/web/src/common/store/account/selectors'
import { digitalContentsActions } from '@coliving/web/src/common/store/pages/digital_content/lineup/actions'
import {
  repostDigitalContent,
  saveDigitalContent,
  undoRepostDigitalContent,
  unsaveDigitalContent
} from '@coliving/web/src/common/store/social/digital_contents/actions'
import {
  OverflowAction,
  OverflowSource
} from '@coliving/web/src/common/store/ui/mobile-overflow-menu/types'
import { requestOpen as requestOpenShareModal } from '@coliving/web/src/common/store/ui/share-modal/slice'
import { setFavorite } from '@coliving/web/src/common/store/user-list/favorites/actions'
import { setRepost } from '@coliving/web/src/common/store/user-list/reposts/actions'
import { RepostType } from '@coliving/web/src/common/store/user-list/reposts/types'
import { getCanonicalName } from '@coliving/web/src/common/utils/genres'
import {
  formatSeconds,
  formatDate
} from '@coliving/web/src/common/utils/timeUtil'
import {
  FAVORITING_USERS_ROUTE,
  REPOSTING_USERS_ROUTE
} from '@coliving/web/src/utils/route'
import { open as openOverflowMenu } from 'common/store/ui/mobile-overflow-menu/slice'
import { Image, Pressable, View } from 'react-native'
import { useSelector } from 'react-redux'

import IconHidden from 'app/assets/images/iconHidden.svg'
import { Text } from 'app/components/core'
import { DetailsTile } from 'app/components/detailsTile'
import type { DetailsTileDetail } from 'app/components/detailsTile/types'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useNavigation } from 'app/hooks/useNavigation'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { useDigitalContentCoverArt } from 'app/hooks/useDigitalContentCoverArt'
import { getPlaying, getPlayingUid } from 'app/store/digitalcoin/selectors'
import type { SearchDigitalContent, SearchUser } from 'app/store/search/types'
import { flexRowCentered, makeStyles } from 'app/styles'
import { make, digital_content as record } from 'app/utils/analytics'
import { moodMap } from 'app/utils/moods'
import { getTagSearchRoute } from 'app/utils/routes'
import { useThemeColors } from 'app/utils/theme'

import { DigitalContentScreenDownloadButtons } from './digitalContentScreenDownloadButtons'

const messages = {
  digital_content: 'digital_content',
  remix: 'remix',
  hiddenDigitalContent: 'hidden digital_content'
}

type DigitalContentScreenDetailsTileProps = {
  digital_content: DigitalContent | SearchDigitalContent
  user: User | SearchUser
  uid: UID
  isLineupLoading: boolean
}

const recordPlay = (id, play = true) => {
  record(
    make({
      eventName: play ? Name.PLAYBACK_PLAY : Name.PLAYBACK_PAUSE,
      id: String(id),
      source: PlaybackSource.DIGITAL_CONTENT_PAGE
    })
  )
}

const useStyles = makeStyles(({ palette, spacing, typography }) => ({
  tags: {
    borderTopWidth: 1,
    borderTopColor: palette.neutralLight7,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    paddingVertical: spacing(4)
  },

  tag: {
    margin: spacing(1),
    borderRadius: 2,
    backgroundColor: palette.neutralLight4,
    paddingVertical: spacing(1),
    paddingHorizontal: spacing(2),
    color: palette.white,
    textTransform: 'uppercase',
    overflow: 'hidden'
  },

  moodEmoji: {
    marginLeft: spacing(1),
    width: 20,
    height: 20
  },

  hiddenDetailsTileWrapper: {
    ...flexRowCentered(),
    marginBottom: spacing(4)
  },

  hiddenDigitalContentLabel: {
    marginTop: spacing(1),
    marginLeft: spacing(2),
    color: palette.accentOrange,
    fontFamily: typography.fontByWeight.demiBold,
    fontSize: 14,
    letterSpacing: 2,
    textTransform: 'uppercase'
  },

  bottomContent: {
    marginHorizontal: spacing(3)
  }
}))

export const DigitalContentScreenDetailsTile = ({
  digital_content,
  user,
  uid,
  isLineupLoading
}: DigitalContentScreenDetailsTileProps) => {
  const styles = useStyles()
  const navigation = useNavigation()
  const { accentOrange } = useThemeColors()

  const currentUserId = useSelectorWeb(getUserId)
  const dispatchWeb = useDispatchWeb()
  const playingUid = useSelector(getPlayingUid)
  const isPlaying = useSelector(getPlaying)
  const isPlayingUid = playingUid === uid

  const {
    _co_sign,
    _cover_art_sizes,
    created_at,
    credits_splits,
    description,
    duration,
    field_visibility,
    genre,
    has_current_user_reposted,
    has_current_user_saved,
    is_unlisted,
    mood,
    owner_id,
    play_count,
    release_date,
    remix_of,
    repost_count,
    save_count,
    tags,
    title,
    digital_content_id
  } = digital_content

  const imageUrl = useDigitalContentCoverArt({
    id: digital_content_id,
    sizes: _cover_art_sizes,
    size: SquareSizes.SIZE_480_BY_480
  })

  const isOwner = owner_id === currentUserId

  const remixParentDigitalContentId = remix_of?.digitalContents?.[0]?.parent_digital_content_id
  const isRemix = !!remixParentDigitalContentId

  const filteredTags = (tags || '').split(',').filter(Boolean)

  const details: DetailsTileDetail[] = [
    { label: 'Duration', value: formatSeconds(duration) },
    {
      isHidden: is_unlisted && !field_visibility?.genre,
      label: 'Genre',
      value: getCanonicalName(genre)
    },
    {
      isHidden: is_unlisted,
      label: 'Released',
      value: formatDate(release_date || created_at)
    },
    {
      icon:
        mood && mood in moodMap ? (
          <Image source={moodMap[mood]} style={styles.moodEmoji} />
        ) : null,
      isHidden: is_unlisted && !field_visibility?.mood,
      label: 'Mood',
      value: mood,
      valueStyle: { flexShrink: 0, marginTop: -2 }
    },
    { label: 'Credit', value: credits_splits }
  ].filter(({ isHidden, value }) => !isHidden && !!value)

  const handlePressPlay = useCallback(() => {
    if (isLineupLoading) return

    if (isPlaying && isPlayingUid) {
      dispatchWeb(digitalContentsActions.pause())
      recordPlay(digital_content_id, false)
    } else if (!isPlayingUid) {
      dispatchWeb(digitalContentsActions.play(uid))
      recordPlay(digital_content_id)
    } else {
      dispatchWeb(digitalContentsActions.play())
      recordPlay(digital_content_id)
    }
  }, [digital_content_id, uid, isPlayingUid, dispatchWeb, isPlaying, isLineupLoading])

  const handlePressFavorites = useCallback(() => {
    dispatchWeb(setFavorite(digital_content_id, FavoriteType.DIGITAL_CONTENT))
    navigation.push({
      native: {
        screen: 'Favorited',
        params: { id: digital_content_id, favoriteType: FavoriteType.DIGITAL_CONTENT }
      },
      web: { route: FAVORITING_USERS_ROUTE }
    })
  }, [dispatchWeb, digital_content_id, navigation])

  const handlePressReposts = useCallback(() => {
    dispatchWeb(setRepost(digital_content_id, RepostType.DIGITAL_CONTENT))
    navigation.push({
      native: {
        screen: 'Reposts',
        params: { id: digital_content_id, repostType: RepostType.DIGITAL_CONTENT }
      },
      web: { route: REPOSTING_USERS_ROUTE }
    })
  }, [dispatchWeb, digital_content_id, navigation])

  const handlePressTag = useCallback(
    (tag: string) => {
      const route = getTagSearchRoute(tag)
      navigation.push({
        native: {
          screen: 'TagSearch',
          params: { query: tag }
        },
        web: { route, fromPage: 'search' }
      })
    },
    [navigation]
  )

  const handlePressSave = () => {
    if (!isOwner) {
      if (has_current_user_saved) {
        dispatchWeb(unsaveDigitalContent(digital_content_id, FavoriteSource.DIGITAL_CONTENT_PAGE))
      } else {
        dispatchWeb(saveDigitalContent(digital_content_id, FavoriteSource.DIGITAL_CONTENT_PAGE))
      }
    }
  }

  const handlePressRepost = () => {
    if (!isOwner) {
      if (has_current_user_reposted) {
        dispatchWeb(undoRepostDigitalContent(digital_content_id, RepostSource.DIGITAL_CONTENT_PAGE))
      } else {
        dispatchWeb(repostDigitalContent(digital_content_id, RepostSource.DIGITAL_CONTENT_PAGE))
      }
    }
  }

  const handlePressShare = () => {
    dispatchWeb(
      requestOpenShareModal({
        type: 'digital_content',
        digitalContentId: digital_content_id,
        source: ShareSource.PAGE
      })
    )
  }
  const handlePressOverflow = () => {
    const overflowActions = [
      isOwner || is_unlisted
        ? null
        : has_current_user_reposted
        ? OverflowAction.UNREPOST
        : OverflowAction.REPOST,
      isOwner || is_unlisted
        ? null
        : has_current_user_saved
        ? OverflowAction.UNFAVORITE
        : OverflowAction.FAVORITE,
      OverflowAction.ADD_TO_CONTENT_LIST,
      user.does_current_user_follow
        ? OverflowAction.UNFOLLOW_LANDLORD
        : OverflowAction.FOLLOW_LANDLORD,
      OverflowAction.VIEW_LANDLORD_PAGE
    ].filter(Boolean) as OverflowAction[]

    dispatchWeb(
      openOverflowMenu({
        source: OverflowSource.DIGITAL_CONTENTS,
        id: digital_content_id,
        overflowActions
      })
    )
  }

  const renderHiddenHeader = () => {
    return (
      <View style={styles.hiddenDetailsTileWrapper}>
        <IconHidden fill={accentOrange} />
        <Text style={styles.hiddenDigitalContentLabel}>{messages.hiddenDigitalContent}</Text>
      </View>
    )
  }

  const renderTags = () => {
    if (is_unlisted && !field_visibility?.tags) {
      return null
    }

    return filteredTags.length > 0 ? (
      <View style={styles.tags}>
        {filteredTags.map((tag) => (
          <Pressable key={tag} onPress={() => handlePressTag(tag)}>
            <Text style={styles.tag} variant='label'>
              {tag}
            </Text>
          </Pressable>
        ))}
      </View>
    ) : null
  }

  const renderDownloadButtons = () => {
    return (
      <DigitalContentScreenDownloadButtons
        following={user.does_current_user_follow}
        isOwner={isOwner}
        digitalContentId={digital_content_id}
        user={user}
      />
    )
  }

  const renderBottomContent = () => {
    return (
      <View style={styles.bottomContent}>
        {renderDownloadButtons()}
        {renderTags()}
      </View>
    )
  }

  return (
    <DetailsTile
      descriptionLinkPressSource='digital_content page'
      coSign={_co_sign}
      description={description ?? undefined}
      details={details}
      hasReposted={has_current_user_reposted}
      hasSaved={has_current_user_saved}
      imageUrl={imageUrl}
      user={user}
      renderBottomContent={renderBottomContent}
      renderHeader={is_unlisted ? renderHiddenHeader : undefined}
      headerText={isRemix ? messages.remix : messages.digital_content}
      hideFavorite={is_unlisted}
      hideRepost={is_unlisted}
      hideShare={is_unlisted && !field_visibility?.share}
      hideFavoriteCount={is_unlisted}
      hideListenCount={is_unlisted && !field_visibility?.play_count}
      hideRepostCount={is_unlisted}
      isPlaying={isPlaying && isPlayingUid}
      onPressFavorites={handlePressFavorites}
      onPressOverflow={handlePressOverflow}
      onPressPlay={handlePressPlay}
      onPressRepost={handlePressRepost}
      onPressReposts={handlePressReposts}
      onPressSave={handlePressSave}
      onPressShare={handlePressShare}
      playCount={play_count}
      repostCount={repost_count}
      saveCount={save_count}
      title={title}
    />
  )
}
