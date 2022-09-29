import { useCallback } from 'react'

import type { ID, UID } from '@coliving/common'
import { Status, Name, PlaybackSource } from '@coliving/common'
import { makeGetTableMetadatas } from '@coliving/web/src/common/store/lineup/selectors'
import { agreementsActions } from '@coliving/web/src/common/store/pages/history-page/lineups/agreements/actions'
import { getHistoryAgreementsLineup } from '@coliving/web/src/common/store/pages/history-page/selectors'
import { useSelector } from 'react-redux'

import { Screen, Tile, VirtualizedScrollView } from 'app/components/core'
import { AgreementList } from 'app/components/agreementList'
import { WithLoader } from 'app/components/withLoader/withLoader'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { getPlaying, getPlayingUid } from 'app/store/live/selectors'
import { makeStyles } from 'app/styles'
import { make, agreement } from 'app/utils/analytics'

const messages = {
  title: 'Listening History'
}
const getAgreements = makeGetTableMetadatas(getHistoryAgreementsLineup)

const useStyles = makeStyles(({ palette, spacing }) => ({
  container: {
    marginVertical: spacing(4),
    marginHorizontal: spacing(3),
    borderRadius: 6
  },
  agreementListContainer: {
    backgroundColor: palette.white,
    borderRadius: 6,
    overflow: 'hidden'
  }
}))

export const ListeningHistoryScreen = () => {
  const styles = useStyles()
  const dispatchWeb = useDispatchWeb()
  const isPlaying = useSelector(getPlaying)
  const playingUid = useSelector(getPlayingUid)
  const historyAgreements = useSelectorWeb(getAgreements)

  const status = historyAgreements.status

  const togglePlay = useCallback(
    (uid: UID, id: ID) => {
      const isAgreementPlaying = uid === playingUid && isPlaying
      if (!isAgreementPlaying) {
        dispatchWeb(agreementsActions.play(uid))
        agreement(
          make({
            eventName: Name.PLAYBACK_PLAY,
            id: `${id}`,
            source: PlaybackSource.HISTORY_PAGE
          })
        )
      } else {
        dispatchWeb(agreementsActions.pause())
        agreement(
          make({
            eventName: Name.PLAYBACK_PAUSE,
            id: `${id}`,
            source: PlaybackSource.HISTORY_PAGE
          })
        )
      }
    },
    [dispatchWeb, isPlaying, playingUid]
  )

  return (
    <Screen title={messages.title} topbarRight={null} variant='secondary'>
      <WithLoader loading={status === Status.LOADING}>
        <VirtualizedScrollView listKey='listening-history-screen'>
          <Tile
            styles={{
              root: styles.container,
              tile: styles.agreementListContainer
            }}
          >
            <AgreementList
              agreements={historyAgreements.entries}
              showDivider
              togglePlay={togglePlay}
              agreementItemAction='overflow'
            />
          </Tile>
        </VirtualizedScrollView>
      </WithLoader>
    </Screen>
  )
}
