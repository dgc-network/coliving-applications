import { useCallback, useContext } from 'react'

import { ID, CreateContentListSource, Collection } from '@coliving/common'
import { push as pushRoute } from 'connected-react-router'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'

import { getAccountWithOwnContentLists } from 'common/store/account/selectors'
import {
  addDigitalContentToContentList,
  createContentList
} from 'common/store/cache/collections/actions'
import { close } from 'common/store/ui/addToContentList/actions'
import {
  getDigitalContentId,
  getDigitalContentTitle
} from 'common/store/ui/addToContentList/selectors'
import Card from 'components/card/mobile/card'
import CardLineup from 'components/lineup/cardLineup'
import MobilePageContainer from 'components/mobilePageContainer/mobilePageContainer'
import TextElement, { Type } from 'components/nav/mobile/textElement'
import { useTemporaryNavContext } from 'components/nav/store/context'
import { ToastContext } from 'components/toast/toastContext'
import useHasChangedRoute from 'hooks/useHasChangedRoute'
import NewContentListButton from 'pages/saved-page/components/mobile/NewContentListButton'
import { newCollectionMetadata } from 'schemas'
import { AppState } from 'store/types'
import { contentListPage } from 'utils/route'
import { withNullGuard } from 'utils/withNullGuard'

import styles from './AddToContentList.module.css'

const messages = {
  title: 'Add To ContentList',
  addedToast: 'Added To ContentList!',
  createdToast: 'ContentList Created!'
}

export type AddToContentListProps = ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps>

const g = withNullGuard((props: AddToContentListProps) => {
  const { account, digitalContentTitle } = props
  if (account && digitalContentTitle) {
    return {
      ...props,
      account,
      digitalContentTitle
    }
  }
})

const AddToContentList = g(
  ({
    account,
    digitalContentId,
    digitalContentTitle,
    goToRoute,
    close,
    addDigitalContentToContentList,
    createContentList
  }) => {
    // Close the page if the route was changed
    useHasChangedRoute(close)
    const setters = useCallback(
      () => ({
        left: (
          <TextElement text='Cancel' type={Type.SECONDARY} onClick={close} />
        ),
        center: messages.title,
        right: null
      }),
      [close]
    )
    useTemporaryNavContext(setters)

    const { toast } = useContext(ToastContext)

    const cards = account.contentLists.map((contentList: any) => {
      return (
        <Card
          key={contentList.content_list_id}
          id={contentList.content_list_id}
          userId={contentList.owner_id}
          imageSize={contentList._cover_art_sizes}
          primaryText={contentList.content_list_name}
          secondaryText={contentList.ownerName}
          onClick={() => {
            toast(messages.addedToast)
            addDigitalContentToContentList(digitalContentId!, contentList.content_list_id)
            close()
          }}
        />
      )
    })

    const addToNewContentList = useCallback(() => {
      const metadata = newCollectionMetadata({
        content_list_name: digitalContentTitle,
        is_private: false
      })
      const tempId = `${Date.now()}`
      createContentList(tempId, metadata, digitalContentId!)
      addDigitalContentToContentList(digitalContentId!, tempId)
      toast(messages.createdToast)
      goToRoute(contentListPage(account.handle, digitalContentTitle, tempId))
      close()
    }, [
      account,
      digitalContentId,
      digitalContentTitle,
      createContentList,
      addDigitalContentToContentList,
      goToRoute,
      close,
      toast
    ])

    return (
      <MobilePageContainer>
        <div className={styles.bodyContainer}>
          <NewContentListButton onClick={addToNewContentList} />
          <div className={styles.cardsContainer}>
            <CardLineup cardsClassName={styles.cardLineup} cards={cards} />
          </div>
        </div>
      </MobilePageContainer>
    )
  }
)

function mapStateToProps(state: AppState) {
  return {
    account: getAccountWithOwnContentLists(state),
    digitalContentId: getDigitalContentId(state),
    digitalContentTitle: getDigitalContentTitle(state)
  }
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    goToRoute: (route: string) => dispatch(pushRoute(route)),
    addDigitalContentToContentList: (digitalContentId: ID, contentListId: ID | string) =>
      dispatch(addDigitalContentToContentList(digitalContentId, contentListId)),
    createContentList: (tempId: string, metadata: Collection, digitalContentId: ID) =>
      dispatch(
        createContentList(
          tempId,
          metadata,
          CreateContentListSource.FROM_DIGITAL_CONTENT,
          digitalContentId
        )
      ),
    close: () => dispatch(close())
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(AddToContentList)
