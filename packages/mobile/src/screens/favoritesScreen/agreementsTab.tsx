import { useCallback, useState } from 'react'

import type { ID, UID } from '@coliving/common'
import { Status, FavoriteSource, Name, PlaybackSource } from '@coliving/common'
import { makeGetTableMetadatas } from '@coliving/web/src/common/store/lineup/selectors'
import { agreementsActions } from '@coliving/web/src/common/store/pages/saved-page/lineups/agreements/actions'
import {
  getSavedAgreementsLineup,
  getSavedAgreementsStatus
} from '@coliving/web/src/common/store/pages/saved-page/selectors'
import {
  saveAgreement,
  unsaveAgreement
} from '@coliving/web/src/common/store/social/agreements/actions'
import { shallowEqual, useSelector } from 'react-redux'

import { Tile, VirtualizedScrollView } from 'app/components/core'
import { AgreementList } from 'app/components/agreementList'
import type { AgreementMetadata } from 'app/components/agreementList/types'
import { WithLoader } from 'app/components/withLoader/withLoader'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { getPlaying, getPlayingUid } from 'app/store/live/selectors'
import { makeStyles } from 'app/styles'
import { make, agreement } from 'app/utils/analytics'

import { EmptyTab } from './emptyTab'
import { FilterInput } from './filterInput'

const messages = {
  emptyTabText: "You haven't favorited any agreements yet.",
  inputPlaceholder: 'Filter Agreements'
}

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
  },
  spinnerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 48
  }
}))

const getAgreements = makeGetTableMetadatas(getSavedAgreementsLineup)

export const AgreementsTab = () => {
  const dispatchWeb = useDispatchWeb()
  const styles = useStyles()
  const [filterValue, setFilterValue] = useState('')
  const isPlaying = useSelector(getPlaying)
  const playingUid = useSelector(getPlayingUid)
  const savedAgreementsStatus = useSelectorWeb(getSavedAgreementsStatus)
  const savedAgreements = useSelectorWeb(getAgreements, shallowEqual)

  const filterAgreement = (agreement: AgreementMetadata) => {
    const matchValue = filterValue.toLowerCase()
    return (
      agreement.title.toLowerCase().indexOf(matchValue) > -1 ||
      agreement.user.name.toLowerCase().indexOf(matchValue) > -1
    )
  }

  const onToggleSave = useCallback(
    (isSaved: boolean, agreementId: ID) => {
      if (agreementId === undefined) return
      const action = isSaved ? unsaveAgreement : saveAgreement
      dispatchWeb(action(agreementId, FavoriteSource.FAVORITES_PAGE))
    },
    [dispatchWeb]
  )

  const togglePlay = useCallback(
    (uid: UID, id: ID) => {
      if (uid !== playingUid || (uid === playingUid && !isPlaying)) {
        dispatchWeb(agreementsActions.play(uid))
        agreement(
          make({
            eventName: Name.PLAYBACK_PLAY,
            id: `${id}`,
            source: PlaybackSource.FAVORITES_PAGE
          })
        )
      } else if (uid === playingUid && isPlaying) {
        dispatchWeb(agreementsActions.pause())
        agreement(
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
        savedAgreementsStatus === Status.LOADING && savedAgreements.entries.length === 0
      }
    >
      <VirtualizedScrollView listKey='favorites-screen'>
        {!savedAgreements.entries.length && !filterValue ? (
          <EmptyTab message={messages.emptyTabText} />
        ) : (
          <>
            <FilterInput
              value={filterValue}
              placeholder={messages.inputPlaceholder}
              onChangeText={setFilterValue}
            />
            {savedAgreements.entries.length ? (
              <Tile
                styles={{
                  root: styles.container,
                  tile: styles.agreementListContainer
                }}
              >
                <AgreementList
                  onSave={onToggleSave}
                  showDivider
                  togglePlay={togglePlay}
                  agreementItemAction='save'
                  agreements={savedAgreements.entries.filter(filterAgreement)}
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
