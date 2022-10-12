import { useCallback } from 'react'

import type { ID, UID } from '@coliving/common'
import { Status, Name, PlaybackSource } from '@coliving/common'
import { makeGetTableMetadatas } from '@coliving/web/src/common/store/lineup/selectors'
import { digitalContentsActions } from '@coliving/web/src/common/store/pages/history-page/lineups/digital_contents/actions'
import { getHistoryDigitalContentsLineup } from '@coliving/web/src/common/store/pages/history-page/selectors'
import { useSelector } from 'react-redux'

import { Screen, Tile, VirtualizedScrollView } from 'app/components/core'
import { DigitalContentList } from 'app/components/digitalContentList'
import { WithLoader } from 'app/components/withLoader/withLoader'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { getPlaying, getPlayingUid } from 'app/store/digitalcoin/selectors'
import { makeStyles } from 'app/styles'
import { make, digital_content } from 'app/utils/analytics'

const messages = {
  title: 'Listening History'
}
const getDigitalContents = makeGetTableMetadatas(getHistoryDigitalContentsLineup)

const useStyles = makeStyles(({ palette, spacing }) => ({
  container: {
    marginVertical: spacing(4),
    marginHorizontal: spacing(3),
    borderRadius: 6
  },
  digitalContentListContainer: {
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
  const historyDigitalContents = useSelectorWeb(getDigitalContents)

  const status = historyDigitalContents.status

  const togglePlay = useCallback(
    (uid: UID, id: ID) => {
      const isDigitalContentPlaying = uid === playingUid && isPlaying
      if (!isDigitalContentPlaying) {
        dispatchWeb(digitalContentsActions.play(uid))
        digital_content(
          make({
            eventName: Name.PLAYBACK_PLAY,
            id: `${id}`,
            source: PlaybackSource.HISTORY_PAGE
          })
        )
      } else {
        dispatchWeb(digitalContentsActions.pause())
        digital_content(
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
              tile: styles.digitalContentListContainer
            }}
          >
            <DigitalContentList
              digitalContents={historyDigitalContents.entries}
              showDivider
              togglePlay={togglePlay}
              digitalContentItemAction='overflow'
            />
          </Tile>
        </VirtualizedScrollView>
      </WithLoader>
    </Screen>
  )
}
