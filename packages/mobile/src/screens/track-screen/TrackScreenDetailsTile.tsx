import { useCallback } from 'react'

import type { UID, Agreement, User } from '@/common'
import {
  FavoriteSource,
  RepostSource,
  ShareSource,
  Name,
  PlaybackSource,
  FavoriteType,
  SquareSizes
} from '@/common'
import { getUserId } from '-client/src/common/store/account/selectors'
import { agreementsActions } from '-client/src/common/store/pages/agreement/lineup/actions'
import {
  repostAgreement,
  saveAgreement,
  undoRepostAgreement,
  unsaveAgreement
} from '-client/src/common/store/social/agreements/actions'
import {
  OverflowAction,
  OverflowSource
} from '-client/src/common/store/ui/mobile-overflow-menu/types'
import { requestOpen as requestOpenShareModal } from '-client/src/common/store/ui/share-modal/slice'
import { setFavorite } from '-client/src/common/store/user-list/favorites/actions'
import { setRepost } from '-client/src/common/store/user-list/reposts/actions'
import { RepostType } from '-client/src/common/store/user-list/reposts/types'
import { getCanonicalName } from '-client/src/common/utils/genres'
import {
  formatSeconds,
  formatDate
} from '-client/src/common/utils/timeUtil'
import {
  FAVORITING_USERS_ROUTE,
  REPOSTING_USERS_ROUTE
} from '-client/src/utils/route'
import { open as openOverflowMenu } from 'common/store/ui/mobile-overflow-menu/slice'
import { Image, Pressable, View } from 'react-native'
import { useSelector } from 'react-redux'

import IconHidden from 'app/assets/images/iconHidden.svg'
import { Text } from 'app/components/core'
import { DetailsTile } from 'app/components/details-tile'
import type { DetailsTileDetail } from 'app/components/details-tile/types'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useNavigation } from 'app/hooks/useNavigation'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { useAgreementCoverArt } from 'app/hooks/useAgreementCoverArt'
import { getPlaying, getPlayingUid } from 'app/store/live/selectors'
import type { SearchAgreement, SearchUser } from 'app/store/search/types'
import { flexRowCentered, makeStyles } from 'app/styles'
import { make, agreement as record } from 'app/utils/analytics'
import { moodMap } from 'app/utils/moods'
import { getTagSearchRoute } from 'app/utils/routes'
import { useThemeColors } from 'app/utils/theme'

import { AgreementScreenDownloadButtons } from './AgreementScreenDownloadButtons'

const messages = {
  agreement: 'agreement',
  remix: 'remix',
  hiddenAgreement: 'hidden agreement'
}

type AgreementScreenDetailsTileProps = {
  agreement: Agreement | SearchAgreement
  user: User | SearchUser
  uid: UID
  isLineupLoading: boolean
}

const recordPlay = (id, play = true) => {
  record(
    make({
      eventName: play ? Name.PLAYBACK_PLAY : Name.PLAYBACK_PAUSE,
      id: String(id),
      source: PlaybackSource.AGREEMENT_PAGE
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

  hiddenAgreementLabel: {
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

export const AgreementScreenDetailsTile = ({
  agreement,
  user,
  uid,
  isLineupLoading
}: AgreementScreenDetailsTileProps) => {
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
    agreement_id
  } = agreement

  const imageUrl = useAgreementCoverArt({
    id: agreement_id,
    sizes: _cover_art_sizes,
    size: SquareSizes.SIZE_480_BY_480
  })

  const isOwner = owner_id === currentUserId

  const remixParentAgreementId = remix_of?.agreements?.[0]?.parent_agreement_id
  const isRemix = !!remixParentAgreementId

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
      dispatchWeb(agreementsActions.pause())
      recordPlay(agreement_id, false)
    } else if (!isPlayingUid) {
      dispatchWeb(agreementsActions.play(uid))
      recordPlay(agreement_id)
    } else {
      dispatchWeb(agreementsActions.play())
      recordPlay(agreement_id)
    }
  }, [agreement_id, uid, isPlayingUid, dispatchWeb, isPlaying, isLineupLoading])

  const handlePressFavorites = useCallback(() => {
    dispatchWeb(setFavorite(agreement_id, FavoriteType.AGREEMENT))
    navigation.push({
      native: {
        screen: 'Favorited',
        params: { id: agreement_id, favoriteType: FavoriteType.AGREEMENT }
      },
      web: { route: FAVORITING_USERS_ROUTE }
    })
  }, [dispatchWeb, agreement_id, navigation])

  const handlePressReposts = useCallback(() => {
    dispatchWeb(setRepost(agreement_id, RepostType.AGREEMENT))
    navigation.push({
      native: {
        screen: 'Reposts',
        params: { id: agreement_id, repostType: RepostType.AGREEMENT }
      },
      web: { route: REPOSTING_USERS_ROUTE }
    })
  }, [dispatchWeb, agreement_id, navigation])

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
        dispatchWeb(unsaveAgreement(agreement_id, FavoriteSource.AGREEMENT_PAGE))
      } else {
        dispatchWeb(saveAgreement(agreement_id, FavoriteSource.AGREEMENT_PAGE))
      }
    }
  }

  const handlePressRepost = () => {
    if (!isOwner) {
      if (has_current_user_reposted) {
        dispatchWeb(undoRepostAgreement(agreement_id, RepostSource.AGREEMENT_PAGE))
      } else {
        dispatchWeb(repostAgreement(agreement_id, RepostSource.AGREEMENT_PAGE))
      }
    }
  }

  const handlePressShare = () => {
    dispatchWeb(
      requestOpenShareModal({
        type: 'agreement',
        agreementId: agreement_id,
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
        source: OverflowSource.AGREEMENTS,
        id: agreement_id,
        overflowActions
      })
    )
  }

  const renderHiddenHeader = () => {
    return (
      <View style={styles.hiddenDetailsTileWrapper}>
        <IconHidden fill={accentOrange} />
        <Text style={styles.hiddenAgreementLabel}>{messages.hiddenAgreement}</Text>
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
      <AgreementScreenDownloadButtons
        following={user.does_current_user_follow}
        isOwner={isOwner}
        agreementId={agreement_id}
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
      descriptionLinkPressSource='agreement page'
      coSign={_co_sign}
      description={description ?? undefined}
      details={details}
      hasReposted={has_current_user_reposted}
      hasSaved={has_current_user_saved}
      imageUrl={imageUrl}
      user={user}
      renderBottomContent={renderBottomContent}
      renderHeader={is_unlisted ? renderHiddenHeader : undefined}
      headerText={isRemix ? messages.remix : messages.agreement}
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
