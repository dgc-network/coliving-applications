import { memo } from 'react'

import { ID, FavoriteSource, RepostSource } from '@coliving/common'
import { push as pushRoute } from 'connected-react-router'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'

import { getUserId } from 'common/store/account/selectors'
import { getUserFromAgreement } from 'common/store/cache/users/selectors'
import {
  saveAgreement,
  unsaveAgreement,
  repostAgreement,
  undoRepostAgreement
} from 'common/store/social/agreements/actions'
import { open } from 'common/store/ui/mobile-overflow-menu/slice'
import {
  OverflowAction,
  OverflowSource
} from 'common/store/ui/mobile-overflow-menu/types'
import { AppState } from 'store/types'

import AgreementListItem, { AgreementListItemProps } from './AgreementListItem'

type OwnProps = Omit<AgreementListItemProps, 'userId'>
type StateProps = ReturnType<typeof mapStateToProps>
type DispatchProps = ReturnType<typeof mapDispatchToProps>

type ConnectedAgreementListItemProps = OwnProps & StateProps & DispatchProps

const ConnectedAgreementListItem = (props: ConnectedAgreementListItemProps) => {
  const onClickOverflow = () => {
    const overflowActions = [
      props.isReposted ? OverflowAction.UNREPOST : OverflowAction.REPOST,
      props.isSaved ? OverflowAction.UNFAVORITE : OverflowAction.FAVORITE,
      OverflowAction.ADD_TO_CONTENT_LIST,
      OverflowAction.VIEW_AGREEMENT_PAGE,
      OverflowAction.VIEW_ARTIST_PAGE
    ].filter(Boolean) as OverflowAction[]
    props.clickOverflow(props.agreementId, overflowActions)
  }

  return (
    <AgreementListItem
      {...props}
      userId={props.user?.user_id ?? 0}
      onClickOverflow={onClickOverflow}
    />
  )
}

function mapStateToProps(state: AppState, ownProps: OwnProps) {
  return {
    user: getUserFromAgreement(state, { id: ownProps.agreementId }),
    currentUserId: getUserId(state)
  }
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    goToRoute: (route: string) => dispatch(pushRoute(route)),
    saveAgreement: (agreementId: ID) =>
      dispatch(saveAgreement(agreementId, FavoriteSource.AGREEMENT_LIST)),
    unsaveAgreement: (agreementId: ID) =>
      dispatch(unsaveAgreement(agreementId, FavoriteSource.AGREEMENT_LIST)),
    repostAgreement: (agreementId: ID) =>
      dispatch(repostAgreement(agreementId, RepostSource.AGREEMENT_LIST)),
    unrepostAgreement: (agreementId: ID) =>
      dispatch(undoRepostAgreement(agreementId, RepostSource.AGREEMENT_LIST)),
    clickOverflow: (agreementId: ID, overflowActions: OverflowAction[]) =>
      dispatch(
        open({ source: OverflowSource.AGREEMENTS, id: agreementId, overflowActions })
      )
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(memo(ConnectedAgreementListItem))
