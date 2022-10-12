import { memo, useEffect, useCallback, useContext } from 'react'

import { ID, UID, LineupAgreement } from '@coliving/common'
import { Button, ButtonType } from '@coliving/stems'

import LoadingSpinner from 'components/loadingSpinner/loadingSpinner'
import MobilePageContainer from 'components/mobilePageContainer/mobilePageContainer'
import NavContext, { LeftPreset } from 'components/nav/store/context'
import AgreementList from 'components/digital_content/mobile/agreementList'
import { AgreementItemAction } from 'components/digital_content/mobile/agreementListItem'
import { TRENDING_PAGE } from 'utils/route'

import styles from './historyPage.module.css'

const messages = {
  header: 'LISTENING HISTORY',
  empty: {
    primary: 'You haven’t listened to any agreements yet.',
    secondary: 'Once you have, this is where you’ll find them!',
    cta: 'Start Listening'
  }
}

export type HistoryPageProps = {
  title: string
  description: string
  userId: ID
  entries: LineupAgreement[]
  playing: boolean
  isEmpty: boolean
  loading: boolean
  onToggleSave: (isSaved: boolean, agreementId: ID) => void
  onTogglePlay: (uid: UID, agreementId: ID) => void
  currentQueueItem: any
  goToRoute: (route: string) => void
}

const HistoryPage = ({
  title,
  description,
  entries,
  playing,
  isEmpty,
  loading,
  goToRoute,
  onTogglePlay,
  onToggleSave,
  currentQueueItem
}: HistoryPageProps) => {
  // Set Header Nav
  const { setLeft, setCenter, setRight } = useContext(NavContext)!
  useEffect(() => {
    setLeft(LeftPreset.BACK)
    setCenter(messages.header)
    setRight(null)
  }, [setLeft, setCenter, setRight])

  const agreements = entries.map((digital_content: LineupAgreement, index: number) => {
    const isActive = digital_content.uid === currentQueueItem.uid
    return {
      isLoading: loading,
      isReposted: digital_content.has_current_user_reposted,
      isSaved: digital_content.has_current_user_saved,
      isActive,
      isPlaying: isActive && playing,
      landlordName: digital_content.user.name,
      landlordHandle: digital_content.user.handle,
      agreementTitle: digital_content.title,
      agreementId: digital_content.digital_content_id,
      uid: digital_content.uid,
      coverArtSizes: digital_content._cover_art_sizes,
      isDeleted: digital_content.is_delete || !!digital_content.user.is_deactivated
    }
  })

  const onClickEmpty = useCallback(() => {
    goToRoute(TRENDING_PAGE)
  }, [goToRoute])

  return (
    <MobilePageContainer title={title} description={description}>
      {isEmpty && !loading ? (
        <div className={styles.emptyContainer}>
          <div className={styles.primary}>
            {messages.empty.primary}
            <i className='emoji face-with-monocle' />
          </div>
          <div className={styles.secondary}>{messages.empty.secondary}</div>
          <Button
            type={ButtonType.SECONDARY}
            className={styles.btn}
            textClassName={styles.btnText}
            onClick={onClickEmpty}
            text={messages.empty.cta} css={undefined}          />
        </div>
      ) : (
        <div className={styles.agreementListContainer}>
          {loading ? (
            <LoadingSpinner className={styles.spinner} />
          ) : (
            <AgreementList
              containerClassName={styles.containerClassName}
              agreements={agreements}
              itemClassName={styles.itemClassName}
              showDivider
              showBorder
              onSave={onToggleSave}
              togglePlay={onTogglePlay}
              agreementItemAction={AgreementItemAction.Overflow}
            />
          )}
        </div>
      )}
    </MobilePageContainer>
  )
}

export default memo(HistoryPage)
