import { memo, useEffect, useCallback, useContext } from 'react'

import { ID, UID, LineupAgreement } from '@coliving/common'
import { Button, ButtonType } from '@coliving/stems'

import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import MobilePageContainer from 'components/mobile-page-container/MobilePageContainer'
import NavContext, { LeftPreset } from 'components/nav/store/context'
import AgreementList from 'components/agreement/mobile/AgreementList'
import { AgreementItemAction } from 'components/agreement/mobile/AgreementListItem'
import { TRENDING_PAGE } from 'utils/route'

import styles from './HistoryPage.module.css'

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

  const agreements = entries.map((agreement: LineupAgreement, index: number) => {
    const isActive = agreement.uid === currentQueueItem.uid
    return {
      isLoading: loading,
      isReposted: agreement.has_current_user_reposted,
      isSaved: agreement.has_current_user_saved,
      isActive,
      isPlaying: isActive && playing,
      landlordName: agreement.user.name,
      landlordHandle: agreement.user.handle,
      agreementTitle: agreement.title,
      agreementId: agreement.agreement_id,
      uid: agreement.uid,
      coverArtSizes: agreement._cover_art_sizes,
      isDeleted: agreement.is_delete || !!agreement.user.is_deactivated
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
            text={messages.empty.cta}
          />
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
