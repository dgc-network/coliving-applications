import { useCallback, useMemo } from 'react'

import type { ID, UID } from '@coliving/common'
import { Status, Name, PlaybackSource } from '@coliving/common'
import { makeGetTableMetadatas } from '@coliving/web/src/common/store/lineup/selectors'
import { agreementsActions } from '@coliving/web/src/common/store/pages/collection/lineup/actions'
import { getCollectionAgreementsLineup } from '@coliving/web/src/common/store/pages/collection/selectors'
import { formatSecondsAsText } from '@coliving/web/src/common/utils/timeUtil'
import { Text, View } from 'react-native'
import { useSelector } from 'react-redux'

import { DetailsTile } from 'app/components/details-tile'
import type {
  DetailsTileDetail,
  DetailsTileProps
} from 'app/components/details-tile/types'
import { AgreementList } from 'app/components/agreement-list'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { getPlaying, getPlayingUid, getAgreement } from 'app/store/live/selectors'
import { makeStyles } from 'app/styles'
import { make, agreement } from 'app/utils/analytics'
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
  agreementListDivider: {
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

const getAgreementsLineup = makeGetTableMetadatas(getCollectionAgreementsLineup)

const recordPlay = (id, play = true) => {
  agreement(
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
  const agreementsLineup = useSelectorWeb(getAgreementsLineup)
  const agreementsLoading = agreementsLineup.status === Status.LOADING
  const numAgreements = agreementsLineup.entries.length

  const duration = agreementsLineup.entries?.reduce(
    (duration, entry) => duration + entry.duration,
    0
  )

  const details = useMemo(() => {
    if (!agreementsLoading && numAgreements === 0) return []
    return [
      {
        label: 'Agreements',
        value: agreementsLoading
          ? messages.detailsPlaceholder
          : formatCount(numAgreements)
      },
      {
        label: 'Duration',
        value: agreementsLoading
          ? messages.detailsPlaceholder
          : formatSecondsAsText(duration)
      },
      ...extraDetails
    ].filter(({ isHidden, value }) => !isHidden && !!value)
  }, [agreementsLoading, numAgreements, duration, extraDetails])

  const isPlaying = useSelector(getPlaying)
  const playingUid = useSelector(getPlayingUid)
  const playingAgreement = useSelector(getAgreement)
  const agreementId = playingAgreement?.agreementId

  const isQueued = agreementsLineup.entries.some(
    (entry) => playingUid === entry.uid
  )

  const handlePressPlay = useCallback(() => {
    if (isPlaying && isQueued) {
      dispatchWeb(agreementsActions.pause())
      recordPlay(agreementId, false)
    } else if (!isPlaying && isQueued) {
      dispatchWeb(agreementsActions.play())
      recordPlay(agreementId)
    } else if (agreementsLineup.entries.length > 0) {
      dispatchWeb(agreementsActions.play(agreementsLineup.entries[0].uid))
      recordPlay(agreementsLineup.entries[0].agreement_id)
    }
  }, [dispatchWeb, isPlaying, agreementId, agreementsLineup, isQueued])

  const handlePressAgreementListItemPlay = useCallback(
    (uid: UID, id: ID) => {
      if (isPlaying && playingUid === uid) {
        dispatchWeb(agreementsActions.pause())
        recordPlay(id, false)
      } else if (playingUid !== uid) {
        dispatchWeb(agreementsActions.play(uid))
        recordPlay(id)
      } else {
        dispatchWeb(agreementsActions.play())
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

  const renderAgreementList = () => {
    if (agreementsLoading)
      return (
        <>
          <View style={styles.agreementListDivider} />
          <AgreementList hideArt showDivider showSkeleton agreements={Array(20)} />
        </>
      )

    return agreementsLineup.entries.length === 0 ? (
      <Text style={styles.empty}>{messages.empty}</Text>
    ) : (
      <>
        <View style={styles.agreementListDivider} />
        <AgreementList
          hideArt
          showDivider
          togglePlay={handlePressAgreementListItemPlay}
          agreements={agreementsLineup.entries}
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
      renderBottomContent={renderAgreementList}
      onPressPlay={handlePressPlay}
    />
  )
}
