import { useCallback, useContext } from 'react'

import { ID, CreatePlaylistSource, Collection } from '@coliving/common'
import { push as pushRoute } from 'connected-react-router'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'

import { getAccountWithOwnPlaylists } from 'common/store/account/selectors'
import {
  addAgreementToPlaylist,
  createPlaylist
} from 'common/store/cache/collections/actions'
import { close } from 'common/store/ui/add-to-content list/actions'
import {
  getAgreementId,
  getAgreementTitle
} from 'common/store/ui/add-to-content list/selectors'
import Card from 'components/card/mobile/Card'
import CardLineup from 'components/lineup/CardLineup'
import MobilePageContainer from 'components/mobile-page-container/MobilePageContainer'
import TextElement, { Type } from 'components/nav/mobile/TextElement'
import { useTemporaryNavContext } from 'components/nav/store/context'
import { ToastContext } from 'components/toast/ToastContext'
import useHasChangedRoute from 'hooks/useHasChangedRoute'
import NewPlaylistButton from 'pages/saved-page/components/mobile/NewPlaylistButton'
import { newCollectionMetadata } from 'schemas'
import { AppState } from 'store/types'
import { content listPage } from 'utils/route'
import { withNullGuard } from 'utils/withNullGuard'

import styles from './AddToPlaylist.module.css'

const messages = {
  title: 'Add To Playlist',
  addedToast: 'Added To Playlist!',
  createdToast: 'Playlist Created!'
}

export type AddToPlaylistProps = ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps>

const g = withNullGuard((props: AddToPlaylistProps) => {
  const { account, agreementTitle } = props
  if (account && agreementTitle) {
    return {
      ...props,
      account,
      agreementTitle
    }
  }
})

const AddToPlaylist = g(
  ({
    account,
    agreementId,
    agreementTitle,
    goToRoute,
    close,
    addAgreementToPlaylist,
    createPlaylist
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

    const cards = account.content lists.map((content list: any) => {
      return (
        <Card
          key={content list.content list_id}
          id={content list.content list_id}
          userId={content list.owner_id}
          imageSize={content list._cover_art_sizes}
          primaryText={content list.content list_name}
          secondaryText={content list.ownerName}
          onClick={() => {
            toast(messages.addedToast)
            addAgreementToPlaylist(agreementId!, content list.content list_id)
            close()
          }}
        />
      )
    })

    const addToNewPlaylist = useCallback(() => {
      const metadata = newCollectionMetadata({
        content list_name: agreementTitle,
        is_private: false
      })
      const tempId = `${Date.now()}`
      createPlaylist(tempId, metadata, agreementId!)
      addAgreementToPlaylist(agreementId!, tempId)
      toast(messages.createdToast)
      goToRoute(content listPage(account.handle, agreementTitle, tempId))
      close()
    }, [
      account,
      agreementId,
      agreementTitle,
      createPlaylist,
      addAgreementToPlaylist,
      goToRoute,
      close,
      toast
    ])

    return (
      <MobilePageContainer>
        <div className={styles.bodyContainer}>
          <NewPlaylistButton onClick={addToNewPlaylist} />
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
    account: getAccountWithOwnPlaylists(state),
    agreementId: getAgreementId(state),
    agreementTitle: getAgreementTitle(state)
  }
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    goToRoute: (route: string) => dispatch(pushRoute(route)),
    addAgreementToPlaylist: (agreementId: ID, content listId: ID | string) =>
      dispatch(addAgreementToPlaylist(agreementId, content listId)),
    createPlaylist: (tempId: string, metadata: Collection, agreementId: ID) =>
      dispatch(
        createPlaylist(
          tempId,
          metadata,
          CreatePlaylistSource.FROM_AGREEMENT,
          agreementId
        )
      ),
    close: () => dispatch(close())
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(AddToPlaylist)
