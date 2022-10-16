import { memo } from 'react'

import { ID, FavoriteSource, RepostSource } from '@coliving/common'
import { push as pushRoute } from 'connected-react-router'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'

import { getUserId } from 'common/store/account/selectors'
import { getUserFromDigitalContent } from 'common/store/cache/users/selectors'
import {
  saveDigitalContent,
  unsaveDigitalContent,
  repostDigitalContent,
  undoRepostDigitalContent
} from 'common/store/social/digital_contents/actions'
import { open } from 'common/store/ui/mobileOverflowMenu/slice'
import {
  OverflowAction,
  OverflowSource
} from 'common/store/ui/mobileOverflowMenu/types'
import { AppState } from 'store/types'

import DigitalContentListItem, { DigitalContentListItemProps } from './digitalContentListItem'

type OwnProps = Omit<DigitalContentListItemProps, 'userId'>
type StateProps = ReturnType<typeof mapStateToProps>
type DispatchProps = ReturnType<typeof mapDispatchToProps>

type ConnectedDigitalContentListItemProps = OwnProps & StateProps & DispatchProps

const ConnectedDigitalContentListItem = (props: ConnectedDigitalContentListItemProps) => {
  const onClickOverflow = () => {
    const overflowActions = [
      props.isReposted ? OverflowAction.UNREPOST : OverflowAction.REPOST,
      props.isSaved ? OverflowAction.UNFAVORITE : OverflowAction.FAVORITE,
      OverflowAction.ADD_TO_CONTENT_LIST,
      OverflowAction.VIEW_DIGITAL_CONTENT_PAGE,
      OverflowAction.VIEW_LANDLORD_PAGE
    ].filter(Boolean) as OverflowAction[]
    props.clickOverflow(props.digitalContentId, overflowActions)
  }

  return (
    <DigitalContentListItem
      {...props}
      userId={props.user?.user_id ?? 0}
      onClickOverflow={onClickOverflow}
    />
  )
}

function mapStateToProps(state: AppState, ownProps: OwnProps) {
  return {
    user: getUserFromDigitalContent(state, { id: ownProps.digitalContentId }),
    currentUserId: getUserId(state)
  }
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    goToRoute: (route: string) => dispatch(pushRoute(route)),
    saveDigitalContent: (digitalContentId: ID) =>
      dispatch(saveDigitalContent(digitalContentId, FavoriteSource.DIGITAL_CONTENT_LIST)),
    unsaveDigitalContent: (digitalContentId: ID) =>
      dispatch(unsaveDigitalContent(digitalContentId, FavoriteSource.DIGITAL_CONTENT_LIST)),
    repostDigitalContent: (digitalContentId: ID) =>
      dispatch(repostDigitalContent(digitalContentId, RepostSource.DIGITAL_CONTENT_LIST)),
    unrepostDigitalContent: (digitalContentId: ID) =>
      dispatch(undoRepostDigitalContent(digitalContentId, RepostSource.DIGITAL_CONTENT_LIST)),
    clickOverflow: (digitalContentId: ID, overflowActions: OverflowAction[]) =>
      dispatch(
        open({ source: OverflowSource.DIGITAL_CONTENTS, id: digitalContentId, overflowActions })
      )
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(memo(ConnectedDigitalContentListItem))
