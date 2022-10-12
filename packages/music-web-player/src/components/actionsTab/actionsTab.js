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
  repostDigitalContent,
  undoRepostDigitalContent
} from 'common/store/social/digital_contents/actions'
import { requestOpen as requestOpenShareModal } from 'common/store/ui/shareModal/slice'
import Menu from 'components/menu/menu'
import Toast from 'components/toast/toast'
import Tooltip from 'components/tooltip/tooltip'
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
      repostDigitalContent,
      undoRepostDigitalContent,
      repostCollection,
      undoRepostCollection,
      currentUserReposted,
      variant,
      digitalContentId,
      contentListId
    } = this.props
    if (variant === 'digital_content') {
      currentUserReposted ? undoRepostDigitalContent(digitalContentId) : repostDigitalContent(digitalContentId)
    } else if (variant === 'contentList' || variant === 'album') {
      currentUserReposted
        ? undoRepostCollection(contentListId)
        : repostCollection(contentListId)
    }
  }

  onShare = () => {
    const { digitalContentId, variant, contentListId, shareDigitalContent, shareCollection } =
      this.props
    if (variant === 'digital_content') {
      shareDigitalContent(digitalContentId)
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
      digitalContentId,
      digitalContentTitle,
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
    if (variant === 'digital_content') {
      overflowMenu.menu.type = 'digital_content'
      overflowMenu.menu.digitalContentId = digitalContentId
      overflowMenu.menu.digitalContentTitle = digitalContentTitle
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
  variant: PropTypes.oneOf(['digital_content', 'contentList', 'album']),
  containerStyles: PropTypes.string,
  handle: PropTypes.string,
  digitalContentTitle: PropTypes.string,
  digitalContentId: PropTypes.number,
  contentListName: PropTypes.string,
  contentListId: PropTypes.number
}

ActionsTab.defaultProps = {
  isHidden: false,
  minimized: false,
  standalone: false,
  isDisabled: false,
  direction: 'vertical',
  variant: 'digital_content',
  handle: 'handle'
}

const mapStateToProps = (state) => ({
  userHandle: getUserHandle(state)
})

const mapDispatchToProps = (dispatch) => ({
  shareDigitalContent: (digitalContentId) =>
    dispatch(
      requestOpenShareModal({
        type: 'digital_content',
        digitalContentId,
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
  repostDigitalContent: (digitalContentId) => dispatch(repostDigitalContent(digitalContentId, RepostSource.TILE)),
  undoRepostDigitalContent: (digitalContentId) =>
    dispatch(undoRepostDigitalContent(digitalContentId, RepostSource.TILE)),
  repostCollection: (contentListId) =>
    dispatch(repostCollection(contentListId, RepostSource.TILE)),
  undoRepostCollection: (contentListId) =>
    dispatch(undoRepostCollection(contentListId, RepostSource.TILE))
})

export default connect(mapStateToProps, mapDispatchToProps)(ActionsTab)
