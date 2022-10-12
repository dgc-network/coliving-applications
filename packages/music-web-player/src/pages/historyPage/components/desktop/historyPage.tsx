import { ChangeEvent, memo } from 'react'

import { ID } from '@coliving/common'
import { Button, ButtonType, IconPause, IconPlay } from '@coliving/stems'

import FilterInput from 'components/filterInput/filterInput'
import Header from 'components/header/desktop/header'
import LoadingSpinner from 'components/loadingSpinner/loadingSpinner'
import Page from 'components/page/page'
import EmptyTable from 'components/digitalContentsTable/emptyTable'
import DigitalContentsTable from 'components/digitalContentsTable/digitalContentsTable'

import styles from './historyPage.module.css'

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
  onClickDigitalContentName: (record: any) => void
  onClickLandlordName: (record: any) => void
  onClickRepost: (record: any) => void
  onSortDigitalContents: (sorters: any) => void
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
  onClickDigitalContentName,
  onClickLandlordName,
  onClickRepost,
  onSortDigitalContents,
  goToRoute,
  onPlay,
  onFilterChange,
  filterText
}: HistoryPageProps) => {
  const tableLoading = !dataSource.every((digital_content: any) => digital_content.play_count > -1)

  const playAllButton = !loading ? (
    <Button
      className={styles.playAllButton}
      textClassName={styles.playAllButtonText}
      iconClassName={styles.playAllButtonIcon}
      type={ButtonType.PRIMARY_ALT}
      text={queuedAndPlaying ? 'PAUSE' : 'PLAY'}
      leftIcon={queuedAndPlaying ? <IconPause /> : <IconPlay />}
      onClick={onPlay} css={undefined}    />
  ) : null

  const digitalContentTableActions = loading
    ? {}
    : {
        onClickFavorite: onClickSave,
        onClickRow,
        onClickDigitalContentName,
        onClickLandlordName,
        onClickRepost,
        onSortDigitalContents
      }

  const filter = (
    <FilterInput
      placeholder='Filter DigitalContents'
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
            primaryText='You haven’t listened to any digitalContents yet.'
            secondaryText='Once you have, this is where you’ll find them!'
            buttonLabel='Start Listening'
            onClick={() => goToRoute('/trending')}
          />
        ) : (
          <div className={styles.tableWrapper}>
            <DigitalContentsTable
              userId={userId}
              loading={tableLoading}
              loadingRowsCount={entries.length}
              playing={queuedAndPlaying}
              playingIndex={playingIndex}
              dataSource={dataSource}
              {...digitalContentTableActions}
            />
          </div>
        )}
      </div>
    </Page>
  )
}

export default memo(HistoryPage)
