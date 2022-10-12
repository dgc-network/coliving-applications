import { useCallback, useMemo } from 'react'

import type { ID, UID } from '@coliving/common'
import { Status, Name, PlaybackSource } from '@coliving/common'
import { makeGetTableMetadatas } from '@coliving/web/src/common/store/lineup/selectors'
import { digitalContentsActions } from '@coliving/web/src/common/store/pages/collection/lineup/actions'
import { getCollectionDigitalContentsLineup } from '@coliving/web/src/common/store/pages/collection/selectors'
import { formatSecondsAsText } from '@coliving/web/src/common/utils/timeUtil'
import { Text, View } from 'react-native'
import { useSelector } from 'react-redux'

import { DetailsTile } from 'app/components/detailsTile'
import type {
  DetailsTileDetail,
  DetailsTileProps
} from 'app/components/detailsTile/types'
import { DigitalContentList } from 'app/components/digitalContentList'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { getPlaying, getPlayingUid, getDigitalContent } from 'app/store/digitalcoin/selectors'
import { makeStyles } from 'app/styles'
import { make, digital_content } from 'app/utils/analytics'
import { formatCount } from 'app/utils/format'

const messages = {
  album: 'Album',
  contentList: 'ContentList',
  empty: 'This contentList is empty.',
  privateContentList: 'Private ContentList',
  publishing: 'Publishing...',
  detailsPlaceholder: '---'
}

const useStyles = makeStyles(({ palette, spacing, typography }) => ({
  digitalContentListDivider: {
    marginHorizontal: spacing(6),
    borderTopWidth: 1,
    borderTopColor: palette.neutralLight7
  },
  empty: {
    ...typography.body,
    color: palette.neutral,
    marginBottom: spacing(8),
    alignSelf: 'center'
  }
}))

type CollectionScreenDetailsTileProps = {
  isAlbum?: boolean
  isPrivate?: boolean
  isPublishing?: boolean
  extraDetails?: DetailsTileDetail[]
} & Omit<
  DetailsTileProps,
  'descriptionLinkPressSource' | 'details' | 'headerText' | 'onPressPlay'
>

const getDigitalContentsLineup = makeGetTableMetadatas(getCollectionDigitalContentsLineup)

const recordPlay = (id, play = true) => {
  digital_content(
    make({
      eventName: play ? Name.PLAYBACK_PLAY : Name.PLAYBACK_PAUSE,
      id: String(id),
      source: PlaybackSource.CONTENT_LIST_PAGE
    })
  )
}

export const CollectionScreenDetailsTile = ({
  description,
  extraDetails = [],
  isAlbum,
  isPrivate,
  isPublishing,
  ...detailsTileProps
}: CollectionScreenDetailsTileProps) => {
  const styles = useStyles()
  const dispatchWeb = useDispatchWeb()
  const digitalContentsLineup = useSelectorWeb(getDigitalContentsLineup)
  const digitalContentsLoading = digitalContentsLineup.status === Status.LOADING
  const numDigitalContents = digitalContentsLineup.entries.length

  const duration = digitalContentsLineup.entries?.reduce(
    (duration, entry) => duration + entry.duration,
    0
  )

  const details = useMemo(() => {
    if (!digitalContentsLoading && numDigitalContents === 0) return []
    return [
      {
        label: 'DigitalContents',
        value: digitalContentsLoading
          ? messages.detailsPlaceholder
          : formatCount(numDigitalContents)
      },
      {
        label: 'Duration',
        value: digitalContentsLoading
          ? messages.detailsPlaceholder
          : formatSecondsAsText(duration)
      },
      ...extraDetails
    ].filter(({ isHidden, value }) => !isHidden && !!value)
  }, [digitalContentsLoading, numDigitalContents, duration, extraDetails])

  const isPlaying = useSelector(getPlaying)
  const playingUid = useSelector(getPlayingUid)
  const playingDigitalContent = useSelector(getDigitalContent)
  const digitalContentId = playingDigitalContent?.digitalContentId

  const isQueued = digitalContentsLineup.entries.some(
    (entry) => playingUid === entry.uid
  )

  const handlePressPlay = useCallback(() => {
    if (isPlaying && isQueued) {
      dispatchWeb(digitalContentsActions.pause())
      recordPlay(digitalContentId, false)
    } else if (!isPlaying && isQueued) {
      dispatchWeb(digitalContentsActions.play())
      recordPlay(digitalContentId)
    } else if (digitalContentsLineup.entries.length > 0) {
      dispatchWeb(digitalContentsActions.play(digitalContentsLineup.entries[0].uid))
      recordPlay(digitalContentsLineup.entries[0].digital_content_id)
    }
  }, [dispatchWeb, isPlaying, digitalContentId, digitalContentsLineup, isQueued])

  const handlePressDigitalContentListItemPlay = useCallback(
    (uid: UID, id: ID) => {
      if (isPlaying && playingUid === uid) {
        dispatchWeb(digitalContentsActions.pause())
        recordPlay(id, false)
      } else if (playingUid !== uid) {
        dispatchWeb(digitalContentsActions.play(uid))
        recordPlay(id)
      } else {
        dispatchWeb(digitalContentsActions.play())
        recordPlay(id)
      }
    },
    [dispatchWeb, isPlaying, playingUid]
  )

  const headerText = useMemo(() => {
    if (isPublishing) {
      return messages.publishing
    }

    if (isAlbum) {
      return messages.album
    }

    if (isPrivate) {
      return messages.privateContentList
    }

    return messages.contentList
  }, [isAlbum, isPrivate, isPublishing])

  const renderDigitalContentList = () => {
    if (digitalContentsLoading)
      return (
        <>
          <View style={styles.digitalContentListDivider} />
          <DigitalContentList hideArt showDivider showSkeleton digitalContents={Array(20)} />
        </>
      )

    return digitalContentsLineup.entries.length === 0 ? (
      <Text style={styles.empty}>{messages.empty}</Text>
    ) : (
      <>
        <View style={styles.digitalContentListDivider} />
        <DigitalContentList
          hideArt
          showDivider
          togglePlay={handlePressDigitalContentListItemPlay}
          digitalContents={digitalContentsLineup.entries}
        />
      </>
    )
  }

  return (
    <DetailsTile
      {...detailsTileProps}
      description={description}
      descriptionLinkPressSource='collection page'
      details={details}
      headerText={headerText}
      hideListenCount={true}
      isPlaying={isPlaying && isQueued}
      renderBottomContent={renderDigitalContentList}
      onPressPlay={handlePressPlay}
    />
  )
}
