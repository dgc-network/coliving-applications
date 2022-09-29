import { useState, useEffect, useRef, useCallback } from 'react'

import { getUserId } from '@coliving/web/src/common/store/account/selectors'
import { Animated, Easing } from 'react-native'
import { useSelector } from 'react-redux'

import type { LineupTileProps } from 'app/components/lineupTile/types'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { getPlaying } from 'app/store/live/selectors'

import { LineupTileActionButtons } from './lineupTileActionButtons'
import {
  LineupTileBannerIcon,
  LineupTileBannerIconType
} from './lineupTileBannerIcon'
import { LineupTileCoSign } from './lineupTileCoSign'
import { LineupTileMetadata } from './lineupTileMetadata'
import { LineupTileRoot } from './lineupTileRoot'
import { LineupTileStats } from './lineupTileStats'
import { LineupTileTopRight } from './lineupTileTopRight'

export const LineupTile = ({
  children,
  coSign,
  duration,
  favoriteType,
  hidePlays,
  hideShare,
  id,
  imageUrl,
  index,
  isPlayingUid,
  isTrending,
  isUnlisted,
  onLoad,
  onPress,
  onPressOverflow,
  onPressRepost,
  onPressSave,
  onPressShare,
  onPressTitle,
  playCount,
  repostType,
  showLandlordPick,
  showRankIcon,
  title,
  item,
  uid,
  user
}: LineupTileProps) => {
  const {
    has_current_user_reposted,
    has_current_user_saved,
    repost_count,
    save_count
  } = item
  const { _landlord_pick, name, user_id } = user
  const isPlaying = useSelector(getPlaying)
  const currentUserId = useSelectorWeb(getUserId)

  const [artworkLoaded, setArtworkLoaded] = useState(false)

  const opacity = useRef(new Animated.Value(0.5)).current

  const isOwner = user_id === currentUserId
  const isLoaded = artworkLoaded
  const fadeIn = { opacity }

  useEffect(() => {
    if (isLoaded) {
      onLoad?.(index)
      Animated.timing(opacity, {
        toValue: 1,
        easing: Easing.ease,
        useNativeDriver: true
      }).start()
    }
  }, [onLoad, isLoaded, index, opacity])

  const handlePress = useCallback(() => {
    onPress?.({ isPlaying })
  }, [isPlaying, onPress])

  return (
    <LineupTileRoot onPress={handlePress}>
      {showLandlordPick && _landlord_pick === id ? (
        <LineupTileBannerIcon type={LineupTileBannerIconType.STAR} />
      ) : null}
      {isUnlisted ? (
        <LineupTileBannerIcon type={LineupTileBannerIconType.HIDDEN} />
      ) : null}
      <Animated.View style={fadeIn}>
        <LineupTileTopRight
          duration={duration}
          isLandlordPick={_landlord_pick === id}
          isUnlisted={isUnlisted}
          showLandlordPick={showLandlordPick}
        />
        <LineupTileMetadata
          landlordName={name}
          coSign={coSign}
          imageUrl={imageUrl}
          onPressTitle={onPressTitle}
          isPlaying={isPlayingUid && isPlaying}
          setArtworkLoaded={setArtworkLoaded}
          title={title}
          user={user}
        />
        {coSign ? <LineupTileCoSign coSign={coSign} /> : null}
        <LineupTileStats
          favoriteType={favoriteType}
          repostType={repostType}
          hidePlays={hidePlays}
          id={id}
          index={index}
          isTrending={isTrending}
          isUnlisted={isUnlisted}
          playCount={playCount}
          repostCount={repost_count}
          saveCount={save_count}
          showRankIcon={showRankIcon}
        />
      </Animated.View>
      {children}
      <LineupTileActionButtons
        hasReposted={has_current_user_reposted}
        hasSaved={has_current_user_saved}
        isOwner={isOwner}
        isShareHidden={hideShare}
        isUnlisted={isUnlisted}
        onPressOverflow={onPressOverflow}
        onPressRepost={onPressRepost}
        onPressSave={onPressSave}
        onPressShare={onPressShare}
      />
    </LineupTileRoot>
  )
}
