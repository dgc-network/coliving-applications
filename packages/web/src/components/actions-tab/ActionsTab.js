import { PureComponent } from 'react'

import { ShareSource, RepostSource } from '@coliving/common'
import cn from 'classnames'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import { ReactComponent as IconKebabHorizontal } from 'assets/img/iconKebabHorizontal.svg'
import { ReactComponent as IconRepost } from 'assets/img/iconRepost.svg'
import { ReactComponent as IconShare } from 'assets/img/iconShare.svg'
import { getUserHandle } from 'common/store/account/selectors'
import {
  repostCollection,
  undoRepostCollection
} from 'common/store/social/collections/actions'
import {
  repostAgreement,
  undoRepostAgreement
} from 'common/store/social/agreements/actions'
import { requestOpen as requestOpenShareModal } from 'common/store/ui/share-modal/slice'
import Menu from 'components/menu/Menu'
import Toast from 'components/toast/Toast'
import Tooltip from 'components/tooltip/Tooltip'
import { REPOST_TOAST_TIMEOUT_MILLIS } from 'utils/constants'

import styles from './ActionsTab.module.css'

const MinimizedActionsTab = (props) => {
  const { isHidden, isDisabled, overflowMenu } = props

  overflowMenu.menu.includeShare = true
  overflowMenu.menu.includeRepost = true

  return (
    <div className={cn({ [styles.hide]: isHidden })}>
      {isDisabled || isHidden ? (
        <div className={styles.iconContainer}>
          <IconKebabHorizontal className={cn(styles.iconKebabHorizontal)} />
        </div>
      ) : (
        <Menu {...overflowMenu}>
          {(ref, triggerPopup) => (
            <div className={styles.iconContainer}>
              <IconKebabHorizontal
                className={cn(styles.iconKebabHorizontal)}
                ref={ref}
                onClick={triggerPopup}
              />
            </div>
          )}
        </Menu>
      )}
    </div>
  )
}

const ExpandedActionsTab = (props) => {
  const {
    isHidden,
    isDisabled,
    direction,
    currentUserReposted,
    isOwner,
    onToggleRepost,
    onShare,
    overflowMenu
  } = props

  overflowMenu.menu.includeShare = false
  overflowMenu.menu.includeRepost = false

  return (
    <>
      <Tooltip
        text={currentUserReposted ? 'Unrepost' : 'Repost'}
        disabled={isHidden || isDisabled || isOwner}
        placement={direction === 'horizontal' ? 'bottom' : 'right'}
      >
        <div
          className={cn(styles.actionButton, {
            [styles.disabled]: isOwner
          })}
          onClick={isDisabled || isOwner ? () => {} : onToggleRepost}
        >
          <Toast
            text={'Reposted!'}
            disabled={currentUserReposted || isHidden || isDisabled || isOwner}
            delay={REPOST_TOAST_TIMEOUT_MILLIS}
            containerClassName={styles.actionIconContainer}
            placement={direction === 'horizontal' ? 'bottom' : 'right'}
          >
            <IconRepost
              className={cn(styles.iconRepost, {
                [styles.reposted]: currentUserReposted
              })}
            />
          </Toast>
        </div>
      </Tooltip>
      <Tooltip
        text='Share'
        disabled={isHidden || isDisabled}
        placement={direction === 'horizontal' ? 'bottom' : 'right'}
      >
        <div
          className={styles.actionButton}
          onClick={isDisabled ? () => {} : onShare}
        >
          <div className={styles.actionIconContainer}>
            <IconShare className={styles.iconShare} />
          </div>
        </div>
      </Tooltip>
      <div className={cn(styles.actionButton, styles.menuKebabContainer)}>
        {isDisabled || isHidden ? (
          <div className={styles.iconKebabHorizontalWrapper}>
            <IconKebabHorizontal className={styles.iconKebabHorizontal} />
          </div>
        ) : (
          <Menu {...overflowMenu}>
            {(ref, triggerPopup) => (
              <div
                className={styles.iconKebabHorizontalWrapper}
                onClick={triggerPopup}
              >
                <IconKebabHorizontal
                  className={styles.iconKebabHorizontal}
                  ref={ref}
                />
              </div>
            )}
          </Menu>
        )}
      </div>
    </>
  )
}

export class ActionsTab extends PureComponent {
  onToggleRepost = () => {
    const {
      repostAgreement,
      undoRepostAgreement,
      repostCollection,
      undoRepostCollection,
      currentUserReposted,
      variant,
      agreementId,
      contentListId
    } = this.props
    if (variant === 'agreement') {
      currentUserReposted ? undoRepostAgreement(agreementId) : repostAgreement(agreementId)
    } else if (variant === 'contentList' || variant === 'album') {
      currentUserReposted
        ? undoRepostCollection(contentListId)
        : repostCollection(contentListId)
    }
  }

  onShare = () => {
    const { agreementId, variant, contentListId, shareAgreement, shareCollection } =
      this.props
    if (variant === 'agreement') {
      shareAgreement(agreementId)
    } else if (variant === 'contentList' || variant === 'album') {
      shareCollection(contentListId)
    }
  }

  render() {
    const {
      minimized,
      standalone,
      isHidden,
      isDisabled,
      direction,
      variant,
      containerStyles,
      handle,
      userHandle,
      contentListId,
      contentListName,
      agreementId,
      agreementTitle,
      currentUserSaved,
      currentUserReposted,
      isLandlordPick,
      isPublic,
      includeEdit
    } = this.props

    const overflowMenu = {
      menu: {
        handle,
        isFavorited: currentUserSaved,
        isReposted: currentUserReposted,
        mount: 'page',
        isOwner: handle === userHandle,
        isLandlordPick
      }
    }
    if (variant === 'agreement') {
      overflowMenu.menu.type = 'agreement'
      overflowMenu.menu.agreementId = agreementId
      overflowMenu.menu.agreementTitle = agreementTitle
      overflowMenu.menu.isLandlordPick = isLandlordPick
    } else if (variant === 'contentList' || variant === 'album') {
      overflowMenu.menu.type = variant === 'contentList' ? 'contentList' : 'album'
      overflowMenu.menu.contentListId = contentListId
      overflowMenu.menu.contentListName = contentListName
      overflowMenu.menu.includeAddToContentList = false
      overflowMenu.menu.isPublic = isPublic
      overflowMenu.menu.includeEdit = includeEdit
    }

    return (
      <div
        className={cn(styles.actionsSection, {
          [styles.show]: !isHidden,
          [styles.hide]: isHidden,
          [styles.horizontal]: direction === 'horizontal',
          [styles.vertical]: direction === 'vertical',
          [styles.disabled]: isDisabled,
          [styles.standalone]: standalone,
          [containerStyles]: !!containerStyles
        })}
      >
        {minimized ? (
          <MinimizedActionsTab {...this.props} overflowMenu={overflowMenu} />
        ) : (
          <ExpandedActionsTab
            {...this.props}
            isOwner={handle === userHandle}
            overflowMenu={overflowMenu}
            onToggleRepost={this.onToggleRepost}
            onShare={this.onShare}
          />
        )}
      </div>
    )
  }
}

ActionsTab.propTypes = {
  isHidden: PropTypes.bool,
  minimized: PropTypes.bool,
  standalone: PropTypes.bool,
  isDisabled: PropTypes.bool,
  includeEdit: PropTypes.bool,
  direction: PropTypes.oneOf(['vertical', 'horizontal']),
  variant: PropTypes.oneOf(['agreement', 'contentList', 'album']),
  containerStyles: PropTypes.string,
  handle: PropTypes.string,
  agreementTitle: PropTypes.string,
  agreementId: PropTypes.number,
  contentListName: PropTypes.string,
  contentListId: PropTypes.number
}

ActionsTab.defaultProps = {
  isHidden: false,
  minimized: false,
  standalone: false,
  isDisabled: false,
  direction: 'vertical',
  variant: 'agreement',
  handle: 'handle'
}

const mapStateToProps = (state) => ({
  userHandle: getUserHandle(state)
})

const mapDispatchToProps = (dispatch) => ({
  shareAgreement: (agreementId) =>
    dispatch(
      requestOpenShareModal({
        type: 'agreement',
        agreementId,
        source: ShareSource.TILE
      })
    ),
  shareCollection: (collectionId) =>
    dispatch(
      requestOpenShareModal({
        type: 'collection',
        collectionId,
        source: ShareSource.TILE
      })
    ),
  repostAgreement: (agreementId) => dispatch(repostAgreement(agreementId, RepostSource.TILE)),
  undoRepostAgreement: (agreementId) =>
    dispatch(undoRepostAgreement(agreementId, RepostSource.TILE)),
  repostCollection: (contentListId) =>
    dispatch(repostCollection(contentListId, RepostSource.TILE)),
  undoRepostCollection: (contentListId) =>
    dispatch(undoRepostCollection(contentListId, RepostSource.TILE))
})

export default connect(mapStateToProps, mapDispatchToProps)(ActionsTab)
