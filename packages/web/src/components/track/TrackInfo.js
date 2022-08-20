import { PureComponent } from 'react'

import cn from 'classnames'
import PropTypes from 'prop-types'

import { ReactComponent as IconVolume } from 'assets/img/iconVolume.svg'
import { ArtistPopover } from 'components/artist/ArtistPopover'
import Skeleton from 'components/skeleton/Skeleton'
import UserBadges from 'components/user-badges/UserBadges'

import styles from './AgreementInfo.module.css'

class AgreementInfo extends PureComponent {
  onClickAgreementName = (e) => {
    e.stopPropagation()
    if (!this.props.disabled && this.props.onClickAgreementName)
      this.props.onClickAgreementName()
  }

  onClickArtistName = (e) => {
    e.stopPropagation()
    if (!this.props.disabled && this.props.onClickArtistName)
      this.props.onClickArtistName()
  }

  render() {
    const {
      contentTitle,
      isLoading,
      agreementTitle,
      active,
      artistName,
      disabled,
      artistHandle,
      size,
      onClickAgreementName,
      onClickArtistName,
      popover,
      condense,
      userId
    } = this.props

    const style = {
      [styles.extraLarge]: size === 'extraLarge',
      [styles.large]: size === 'large',
      [styles.medium]: size === 'medium',
      [styles.small]: size === 'small',
      [styles.tiny]: size === 'tiny',
      [styles.miniscule]: size === 'miniscule'
    }

    const agreementTitleStyle = cn(styles.agreementTitle, style, {
      [styles.active]: active,
      [styles.condense]: condense
    })
    const artistNameStyle = cn(styles.artistName, style, {
      [styles.active]: active,
      [styles.content listCreator]: contentTitle === 'content list'
    })

    const hideShow = cn({
      [styles.hide]: isLoading,
      [styles.show]: !isLoading
    })

    return (
      <div
        className={cn(styles.agreementInfoWrapper, {
          [styles.disabled]: disabled
        })}
      >
        <div className={agreementTitleStyle}>
          <div className={hideShow}>
            <div
              className={cn(styles.agreementName, {
                [styles.agreementNameLink]: onClickAgreementName
              })}
              onClick={this.onClickAgreementName}
            >
              {agreementTitle}
            </div>
            {active ? (
              <span className={styles.volumeIcon}>
                <IconVolume />
              </span>
            ) : null}
          </div>
          {isLoading && <Skeleton width='80%' className={styles.skeleton} />}
        </div>
        <div className={artistNameStyle}>
          <div className={hideShow}>
            {contentTitle === 'content list' ? (
              <span className={styles.createdBy}>{'Created by'}</span>
            ) : null}
            {popover ? (
              <ArtistPopover handle={artistHandle}>
                <span
                  className={cn({ [styles.artistNameLink]: onClickArtistName })}
                  onClick={this.onClickArtistName}
                >
                  {artistName}
                </span>
              </ArtistPopover>
            ) : (
              <span
                className={cn(styles.artistName, {
                  [styles.artistNameLink]: onClickArtistName
                })}
                onClick={this.onClickArtistName}
              >
                {artistName}
              </span>
            )}
            {
              <UserBadges
                userId={userId}
                className={styles.iconVerified}
                badgeSize={10}
              />
            }
          </div>
          {isLoading && <Skeleton width='60%' className={styles.skeleton} />}
        </div>
      </div>
    )
  }
}

AgreementInfo.propTypes = {
  agreementTitle: PropTypes.string,
  artistName: PropTypes.string,
  artistHandle: PropTypes.string,
  isLoading: PropTypes.bool,
  condense: PropTypes.bool,
  size: PropTypes.oneOf([
    'extraLarge',
    'large',
    'medium',
    'small',
    'tiny',
    'miniscule'
  ]),
  popover: PropTypes.bool,
  disabled: PropTypes.bool,
  onClickAgreementName: PropTypes.func,
  onClickArtistName: PropTypes.func,
  userId: PropTypes.number
}

AgreementInfo.defaultProps = {
  agreementTitle: '\u200B',
  artistName: '\u200B',
  artistHandle: '',
  size: 'medium',
  active: false,
  disabled: false,
  condense: false,
  isLoading: false,
  routeArtistPage: false,
  routeAgreementPage: false,
  popover: true
}

export default AgreementInfo
