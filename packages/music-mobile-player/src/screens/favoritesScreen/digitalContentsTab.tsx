import { useCallback, useState } from 'react'

import type { ID, UID } from '@coliving/common'
import { Status, FavoriteSource, Name, PlaybackSource } from '@coliving/common'
import { makeGetTableMetadatas } from '@coliving/web/src/common/store/lineup/selectors'
import { digitalContentsActions } from '@coliving/web/src/common/store/pages/saved-page/lineups/digital_contents/actions'
import {
  getSavedDigitalContentsLineup,
  getSavedDigitalContentsStatus
} from '@coliving/web/src/common/store/pages/saved-page/selectors'
import {
  saveDigitalContent,
  unsaveDigitalContent
} from '@coliving/web/src/common/store/social/digital_contents/actions'
import { shallowEqual, useSelector } from 'react-redux'

import { Tile, VirtualizedScrollView } from 'app/components/core'
import { DigitalContentList } from 'app/components/digitalContentList'
import type { DigitalContentMetadata } from 'app/components/digitalContentList/types'
import { WithLoader } from 'app/components/withLoader/withLoader'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { getPlaying, getPlayingUid } from 'app/store/digitalcoin/selectors'
import { makeStyles } from 'app/styles'
import { make, digital_content } from 'app/utils/analytics'

import { EmptyTab } from './emptyTab'
import { FilterInput } from './filterInput'

const messages = {
  emptyTabText: "You haven't favorited any digitalContents yet.",
  inputPlaceholder: 'Filter DigitalContents'
}

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
  },
  spinnerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 48
  }
}))

const getDigitalContents = makeGetTableMetadatas(getSavedDigitalContentsLineup)

export const DigitalContentsTab = () => {
  const dispatchWeb = useDispatchWeb()
  const styles = useStyles()
  const [filterValue, setFilterValue] = useState('')
  const isPlaying = useSelector(getPlaying)
  const playingUid = useSelector(getPlayingUid)
  const savedDigitalContentsStatus = useSelectorWeb(getSavedDigitalContentsStatus)
  const savedDigitalContents = useSelectorWeb(getDigitalContents, shallowEqual)

  const filterDigitalContent = (digital_content: DigitalContentMetadata) => {
    const matchValue = filterValue.toLowerCase()
    return (
      digital_content.title.toLowerCase().indexOf(matchValue) > -1 ||
      digital_content.user.name.toLowerCase().indexOf(matchValue) > -1
    )
  }

  const onToggleSave = useCallback(
    (isSaved: boolean, digitalContentId: ID) => {
      if (digitalContentId === undefined) return
      const action = isSaved ? unsaveDigitalContent : saveDigitalContent
      dispatchWeb(action(digitalContentId, FavoriteSource.FAVORITES_PAGE))
    },
    [dispatchWeb]
  )

  const togglePlay = useCallback(
    (uid: UID, id: ID) => {
      if (uid !== playingUid || (uid === playingUid && !isPlaying)) {
        dispatchWeb(digitalContentsActions.play(uid))
        digital_content(
          make({
            eventName: Name.PLAYBACK_PLAY,
            id: `${id}`,
            source: PlaybackSource.FAVORITES_PAGE
          })
        )
      } else if (uid === playingUid && isPlaying) {
        dispatchWeb(digitalContentsActions.pause())
        digital_content(
          make({
            eventName: Name.PLAYBACK_PAUSE,
            id: `${id}`,
            source: PlaybackSource.FAVORITES_PAGE
          })
        )
      }
    },
    [dispatchWeb, isPlaying, playingUid]
  )

  return (
    <WithLoader
      loading={
        savedDigitalContentsStatus === Status.LOADING && savedDigitalContents.entries.length === 0
      }
    >
      <VirtualizedScrollView listKey='favorites-screen'>
        {!savedDigitalContents.entries.length && !filterValue ? (
          <EmptyTab message={messages.emptyTabText} />
        ) : (
          <>
            <FilterInput
              value={filterValue}
              placeholder={messages.inputPlaceholder}
              onChangeText={setFilterValue}
            />
            {savedDigitalContents.entries.length ? (
              <Tile
                styles={{
                  root: styles.container,
                  tile: styles.digitalContentListContainer
                }}
              >
                <DigitalContentList
                  onSave={onToggleSave}
                  showDivider
                  togglePlay={togglePlay}
                  digitalContentItemAction='save'
                  digitalContents={savedDigitalContents.entries.filter(filterDigitalContent)}
                  hideArt
                />
              </Tile>
            ) : null}
          </>
        )}
      </VirtualizedScrollView>
    </WithLoader>
  )
}
