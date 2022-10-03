import { useContext, useMemo, useState } from 'react'

import { CreateContentListSource, Collection, SquareSizes } from '@coliving/common'
import { Modal, Scrollbar } from '@coliving/stems'
import cn from 'classnames'
import { useDispatch, useSelector } from 'react-redux'

import { ReactComponent as IconMultiselectAdd } from 'assets/img/iconMultiselectAdd.svg'
import { useModalState } from 'common/hooks/useModalState'
import { getAccountWithOwnContentLists } from 'common/store/account/selectors'
import {
  addAgreementToContentList,
  createContentList
} from 'common/store/cache/collections/actions'
import { getCollectionId } from 'common/store/pages/collection/selectors'
import {
  getAgreementId,
  getAgreementTitle
} from 'common/store/ui/addToContentList/selectors'
import DynamicImage from 'components/dynamicImage/dynamicImage'
import SearchBar from 'components/searchBar/searchBar'
import { ToastContext } from 'components/toast/toastContext'
import ToastLinkContent from 'components/toast/mobile/toastLinkContent'
import { useCollectionCoverArt } from 'hooks/useCollectionCoverArt'
import { newCollectionMetadata } from 'schemas'
import { AppState } from 'store/types'
import { contentListPage } from 'utils/route'

import styles from './AddToContentListModal.module.css'

const messages = {
  title: 'Add to ContentList',
  newContentList: 'New ContentList',
  searchPlaceholder: 'Find one of your contentLists',
  addedToast: 'Added To ContentList!',
  createdToast: 'ContentList Created!',
  view: 'View'
}

const AddToContentListModal = () => {
  const dispatch = useDispatch()
  const { toast } = useContext(ToastContext)

  const [isOpen, setIsOpen] = useModalState('AddToContentList')
  const agreementId = useSelector(getAgreementId)
  const agreementTitle = useSelector(getAgreementTitle)
  const currentCollectionId = useSelector(getCollectionId)
  const account = useSelector((state: AppState) =>
    getAccountWithOwnContentLists(state)
  )

  const [searchValue, setSearchValue] = useState('')

  const filteredContentLists = useMemo(() => {
    return (account?.contentLists ?? []).filter(
      (contentList: Collection) =>
        // Don't allow adding to this contentList if already on this contentList's page.
        contentList.content_list_id !== currentCollectionId &&
        (searchValue
          ? contentList.content_list_name
              .toLowerCase()
              .includes(searchValue.toLowerCase())
          : true)
    )
  }, [searchValue, account, currentCollectionId])

  const handleContentListClick = (contentList: Collection) => {
    dispatch(addAgreementToContentList(agreementId, contentList.content_list_id))
    if (account && agreementTitle) {
      toast(
        <ToastLinkContent
          text={messages.addedToast}
          linkText={messages.view}
          link={contentListPage(account.handle, agreementTitle, contentList.content_list_id)}
        />
      )
    }
    setIsOpen(false)
  }

  const handleCreateContentList = () => {
    const metadata = newCollectionMetadata({
      content_list_name: agreementTitle,
      is_private: false
    })
    const tempId = `${Date.now()}`
    dispatch(
      createContentList(tempId, metadata, CreateContentListSource.FROM_AGREEMENT, agreementId)
    )
    dispatch(addAgreementToContentList(agreementId, tempId))
    if (account && agreementTitle) {
      toast(
        <ToastLinkContent
          text={messages.createdToast}
          linkText={messages.view}
          link={contentListPage(account.handle, agreementTitle, tempId)}
        />
      )
    }
    setIsOpen(false)
  }

  return (
    <Modal
      isOpen={isOpen === true}
      showTitleHeader
      showDismissButton
      title={messages.title}
      onClose={() => setIsOpen(false)}
      allowScroll={false}
      bodyClassName={styles.modalBody}
      headerContainerClassName={styles.modalHeader}
    >
      <SearchBar
        className={styles.searchBar}
        iconClassname={styles.searchIcon}
        open
        value={searchValue}
        onSearch={setSearchValue}
        onOpen={() => {}}
        onClose={() => {}}
        placeholder={messages.searchPlaceholder}
        shouldAutoFocus={false}
      />
      <Scrollbar>
        <div className={styles.listContent}>
          <div className={cn(styles.listItem)} onClick={handleCreateContentList}>
            <IconMultiselectAdd className={styles.add} />
            <span>{messages.newContentList}</span>
          </div>
          <div className={styles.list}>
            {filteredContentLists.map((contentList) => (
              <div key={`${contentList.content_list_id}`}>
                <ContentListItem
                  contentList={contentList}
                  handleClick={handleContentListClick}
                />
              </div>
            ))}
          </div>
        </div>
      </Scrollbar>
    </Modal>
  )
}

type ContentListItemProps = {
  handleClick: (contentList: Collection) => void
  contentList: Collection
}

const ContentListItem = ({ handleClick, contentList }: ContentListItemProps) => {
  const image = useCollectionCoverArt(
    contentList.content_list_id,
    contentList._cover_art_sizes,
    SquareSizes.SIZE_150_BY_150
  )

  return (
    <div className={cn(styles.listItem)} onClick={() => handleClick(contentList)}>
      <DynamicImage
        className={styles.image}
        wrapperClassName={styles.imageWrapper}
        image={image}
      />
      <span className={styles.contentListName}>{contentList.content_list_name}</span>
    </div>
  )
}

export default AddToContentListModal
