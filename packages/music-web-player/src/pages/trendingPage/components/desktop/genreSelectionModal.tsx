import { Modal, Scrollbar } from '@coliving/stems'

import GenreSelectionList from 'pages/trendingPage/components/genreSelectionList'

import styles from './genreSelectionModal.module.css'

type GenreSelectionModalProps = {
  genres: string[]
  selectedGenre: string | null
  didSelectGenre: (genre: string | null) => void
  didClose: () => void
  isOpen: boolean
}

const messages = {
  title: 'Pick a Genre',
  all: 'All Genres',
  searchPlaceholder: 'Search Genres'
}

const GenreSelectionModal = ({
  genres,
  selectedGenre,
  didSelectGenre,
  didClose,
  isOpen
}: GenreSelectionModalProps) => {
  return (
    <Modal
      isOpen={isOpen}
      showTitleHeader
      showDismissButton
      title={messages.title}
      onClose={didClose}
      allowScroll={false}
      bodyClassName={styles.modalBody}
      headerContainerClassName={styles.modalHeader}
    >
      <Scrollbar className={styles.scrollbar}>
        <GenreSelectionList
          genres={genres}
          didSelectGenre={didSelectGenre}
          selectedGenre={selectedGenre}
        />
      </Scrollbar>
    </Modal>
  )
}

export default GenreSelectionModal
