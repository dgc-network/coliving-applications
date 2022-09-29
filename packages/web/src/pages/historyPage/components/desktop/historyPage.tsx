import { ChangeEvent, memo } from 'react'

import { ID } from '@coliving/common'
import { Button, ButtonType, IconPause, IconPlay } from '@coliving/stems'

import FilterInput from 'components/filterInput/filterInput'
import Header from 'components/header/desktop/header'
import LoadingSpinner from 'components/loadingSpinner/loadingSpinner'
import Page from 'components/page/page'
import EmptyTable from 'components/agreementsTable/emptyTable'
import AgreementsTable from 'components/agreementsTable/agreementsTable'

import styles from './HistoryPage.module.css'

export type HistoryPageProps = {
  title: string
  description: string
  userId: ID
  entries: any
  dataSource: any
  playingIndex: number
  isEmpty: boolean
  loading: boolean
  queuedAndPlaying: boolean
  onClickRow: (record: any) => void
  onClickSave: (record: any) => void
  onClickAgreementName: (record: any) => void
  onClickLandlordName: (record: any) => void
  onClickRepost: (record: any) => void
  onSortAgreements: (sorters: any) => void
  goToRoute: (route: string) => void
  onPlay: () => void
  onFilterChange: (e: ChangeEvent<HTMLInputElement>) => void
  filterText: string
}

const HistoryPage = ({
  title,
  description,
  userId,
  entries,
  dataSource,
  playingIndex,
  isEmpty,
  loading,
  queuedAndPlaying,
  onClickRow,
  onClickSave,
  onClickAgreementName,
  onClickLandlordName,
  onClickRepost,
  onSortAgreements,
  goToRoute,
  onPlay,
  onFilterChange,
  filterText
}: HistoryPageProps) => {
  const tableLoading = !dataSource.every((agreement: any) => agreement.play_count > -1)

  const playAllButton = !loading ? (
    <Button
      className={styles.playAllButton}
      textClassName={styles.playAllButtonText}
      iconClassName={styles.playAllButtonIcon}
      type={ButtonType.PRIMARY_ALT}
      text={queuedAndPlaying ? 'PAUSE' : 'PLAY'}
      leftIcon={queuedAndPlaying ? <IconPause /> : <IconPlay />}
      onClick={onPlay}
    />
  ) : null

  const agreementTableActions = loading
    ? {}
    : {
        onClickFavorite: onClickSave,
        onClickRow,
        onClickAgreementName,
        onClickLandlordName,
        onClickRepost,
        onSortAgreements
      }

  const filter = (
    <FilterInput
      placeholder='Filter Agreements'
      onChange={onFilterChange}
      value={filterText}
    />
  )

  const header = (
    <Header
      primary='History'
      secondary={isEmpty ? null : playAllButton}
      containerStyles={styles.historyPageHeader}
      rightDecorator={!isEmpty && filter}
    />
  )

  return (
    <Page
      title={title}
      description={description}
      contentClassName={styles.historyPageWrapper}
      header={header}
    >
      <div className={styles.bodyWrapper}>
        {loading ? (
          <LoadingSpinner className={styles.spinner} />
        ) : isEmpty && !loading && !tableLoading ? (
          <EmptyTable
            primaryText='You haven’t listened to any agreements yet.'
            secondaryText='Once you have, this is where you’ll find them!'
            buttonLabel='Start Listening'
            onClick={() => goToRoute('/trending')}
          />
        ) : (
          <div className={styles.tableWrapper}>
            <AgreementsTable
              userId={userId}
              loading={tableLoading}
              loadingRowsCount={entries.length}
              playing={queuedAndPlaying}
              playingIndex={playingIndex}
              dataSource={dataSource}
              {...agreementTableActions}
            />
          </div>
        )}
      </div>
    </Page>
  )
}

export default memo(HistoryPage)
