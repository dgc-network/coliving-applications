import { useCallback, useState } from 'react'

import {
  ID,
  Name,
  ProfilePictureSizes,
  SquareSizes,
  Status,
  BooleanKeys
} from '@coliving/common'
import { Modal, Button, ButtonType, IconNote, ButtonSize } from '@coliving/stems'
import cn from 'classnames'
import { useDispatch } from 'react-redux'

import { ReactComponent as IconValidationX } from 'assets/img/iconValidationX.svg'
import { ReactComponent as IconVerified } from 'assets/img/iconVerified.svg'
import { TwitterProfile, InstagramProfile } from 'common/store/account/reducer'
import DynamicImage from 'components/dynamicImage/dynamicImage'
import LoadingSpinner from 'components/loadingSpinner/loadingSpinner'
import { show as showMusicConfetti } from 'components/musicConfetti/store/slice'
import UserBadges from 'components/userBadges/userBadges'
import { useRemoteVar } from 'hooks/useRemoteConfig'
import { useUserProfilePicture } from 'hooks/useUserProfilePicture'
import { useRecord, make, DigitalContentEvent } from 'store/analytics/actions'
import { profilePage } from 'utils/route'

import InstagramAccountVerification from '../instagramAccountVerified'
import TwitterAccountVerification from '../twitterAccountVerified'

import styles from './VerificationModal.module.css'

const messages = {
  title: 'Verification',
  buttonText: 'Verify',
  description:
    'Getting verified on Coliving is easy! Just link your verified Twitter or Instagram account and you’ll be verified immediately.',
  warning: (
    <p>
      Your Coliving handle must <b>exactly</b> match the verified handle you’re
      connecting.
    </p>
  ),
  verifiedBtn: "You're Verified!",
  verified: "YOU'RE VERIFIED",
  backToMusic: 'Back To The Music',
  failure: 'Sorry, unable to retrieve information',
  errorHandle: 'Sorry, your handle does not match',
  errorVerifiedTwitter: 'Your Twitter account isn’t verified',
  errorVerifiedInstagram: 'Your Instagram account isn’t verified'
}

type VerifyBodyProps = {
  handle: string
  onClick: () => void
  onFailure: () => void
  onTwitterLogin: (uuid: string, profile: any) => void
  onInstagramLogin: (uuid: string, profile: any) => void
  error?: string
}

const VerifyBody = (props: VerifyBodyProps) => {
  const displayInstagram = useRemoteVar(
    BooleanKeys.DISPLAY_INSTAGRAM_VERIFICATION_WEB_AND_DESKTOP
  )
  const record = useRecord()
  const { handle, onClick } = props
  const onTwitterClick = useCallback(() => {
    onClick()
    const digitalContentEvent: DigitalContentEvent = make(Name.SETTINGS_START_TWITTER_OAUTH, {
      handle
    })
    record(digitalContentEvent)
  }, [record, onClick, handle])

  const onInstagramClick = useCallback(() => {
    onClick()
    const digitalContentEvent: DigitalContentEvent = make(Name.SETTINGS_START_INSTAGRAM_OAUTH, {
      handle
    })
    record(digitalContentEvent)
  }, [record, onClick, handle])

  return (
    <div className={styles.container}>
      <p>{messages.description}</p>
      <div className={styles.warning}>{messages.warning}</div>
      <div className={styles.btnContainer}>
        <TwitterAccountVerification
          onSuccess={props.onTwitterLogin}
          onFailure={props.onFailure}
          className={styles.twitterClassName}
          onClick={onTwitterClick}
        />
        {displayInstagram && (
          <InstagramAccountVerification
            onClick={onInstagramClick}
            onSuccess={props.onInstagramLogin}
            onFailure={props.onFailure}
          />
        )}
      </div>
      {props.error && (
        <div className={styles.error}>
          <IconValidationX className={styles.validationIcon} />
          {props.error}
        </div>
      )}
    </div>
  )
}

const LoadingBody = () => {
  return (
    <div className={styles.container}>
      <LoadingSpinner className={styles.loadingContainer} />
    </div>
  )
}

type SuccessBodyProps = {
  userId: ID
  handle: string
  name: string
  profilePictureSizes: ProfilePictureSizes | null
  goToRoute: (route: string) => void
}

const SuccessBody = ({
  handle,
  userId,
  name,
  profilePictureSizes,
  goToRoute
}: SuccessBodyProps) => {
  const profilePicture = useUserProfilePicture(
    userId,
    profilePictureSizes,
    SquareSizes.SIZE_150_BY_150
  )

  const onClick = useCallback(() => {
    goToRoute(profilePage(handle))
  }, [goToRoute, handle])

  return (
    <div className={styles.container}>
      <div className={styles.verified}>
        {messages.verified}
        <i
          className={cn(
            'emoji face-with-party-horn-and-party-hat',
            styles.verifiedIcon
          )}
        />
      </div>
      <DynamicImage
        image={profilePicture}
        wrapperClassName={styles.profilePicture}
      />
      <div className={styles.displayName}>
        {name}
        <UserBadges
          userId={userId}
          badgeSize={12}
          className={styles.iconVerified}
        />
      </div>
      <div className={styles.handle}>{`@${handle}`}</div>
      <Button
        type={ButtonType.COMMON_ALT}
        className={styles.successBtn}
        textClassName={styles.btnText}
        size={ButtonSize.MEDIUM}
        text={messages.backToMusic}
        onClick={onClick}
        rightIcon={<IconNote className={styles.noteIcon} />} css={undefined}      />
    </div>
  )
}

type VerificationModalProps = {
  userId: ID
  handle: string
  name: string
  profilePictureSizes: ProfilePictureSizes | null
  isVerified?: boolean
  goToRoute: (route: string) => void
  onInstagramLogin: (uuid: string, profile: any) => void
  onTwitterLogin: (uuid: string, profile: any) => void
}

// A modal that allows you to toggle a digital_content to unlisted, as
// well as toggle individual metadata field visibility.
const VerificationModal = (props: VerificationModalProps) => {
  const { handle, onInstagramLogin, onTwitterLogin } = props
  const dispatch = useDispatch()
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const onClick = useCallback(() => setStatus(Status.LOADING), [setStatus])
  const record = useRecord()
  const onFailure = useCallback(() => {
    setError(messages.failure)
    setStatus(Status.ERROR)
  }, [setError, setStatus])

  const instagramLogin = useCallback(
    (uuid: string, profile: InstagramProfile) => {
      if (!profile.is_verified) {
        setError(messages.errorVerifiedInstagram)
        setStatus(Status.ERROR)
      } else if (profile.username.toLowerCase() !== handle.toLowerCase()) {
        setError(messages.errorHandle)
        setStatus(Status.ERROR)
      } else {
        dispatch(showMusicConfetti())
        onInstagramLogin(uuid, profile)
        setStatus(Status.SUCCESS)
      }
      const digitalContentEvent: DigitalContentEvent = make(
        Name.SETTINGS_COMPLETE_INSTAGRAM_OAUTH,
        { is_verified: profile.is_verified, handle, username: profile.username }
      )
      record(digitalContentEvent)
    },
    [dispatch, handle, onInstagramLogin, setError, record]
  )

  const twitterLogin = useCallback(
    (uuid: string, profile: TwitterProfile) => {
      if (!profile.verified) {
        setError(messages.errorVerifiedTwitter)
        setStatus(Status.ERROR)
      } else if (profile.screen_name.toLowerCase() !== handle.toLowerCase()) {
        setError(messages.errorHandle)
        setStatus(Status.ERROR)
      } else {
        dispatch(showMusicConfetti())
        onTwitterLogin(uuid, profile)
        setStatus(Status.SUCCESS)
      }
      const digitalContentEvent: DigitalContentEvent = make(
        Name.SETTINGS_COMPLETE_TWITTER_OAUTH,
        {
          is_verified: profile.verified,
          handle,
          screen_name: profile.screen_name
        }
      )
      record(digitalContentEvent)
    },
    [dispatch, handle, onTwitterLogin, setError, record]
  )

  const onOpen = useCallback(() => setIsOpen(true), [setIsOpen])
  const onClose = useCallback(() => {
    setIsOpen(false)
    setError('')
  }, [setIsOpen, setError])

  let body
  if (status === Status.LOADING) {
    body = <LoadingBody />
  } else if (status === '' || status === Status.ERROR) {
    body = (
      <VerifyBody
        handle={props.handle}
        onClick={onClick}
        onFailure={onFailure}
        onInstagramLogin={instagramLogin}
        onTwitterLogin={twitterLogin}
        error={error}
      />
    )
  } else {
    body = (
      <SuccessBody
        userId={props.userId}
        handle={props.handle}
        name={props.name}
        profilePictureSizes={props.profilePictureSizes}
        goToRoute={props.goToRoute}
      />
    )
  }
  const canDismiss = status !== Status.LOADING
  return (
    <>
      {props.isVerified ? (
        <Button
          isDisabled={true}
          text={messages.verifiedBtn}
          className={styles.disabledBtn}
          textClassName={styles.disabledBtnText}
          type={ButtonType.COMMON_ALT}
          leftIcon={<IconVerified className={styles.btnIcon} />} css={undefined}        />
      ) : (
        <Button
            text={messages.buttonText}
            onClick={onOpen}
            className={styles.btn}
            textClassName={styles.btnText}
            size={ButtonSize.MEDIUM}
            type={ButtonType.COMMON_ALT}
            leftIcon={<IconVerified className={styles.btnIcon} />} css={undefined}        />
      )}
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        showDismissButton={canDismiss}
        dismissOnClickOutside={canDismiss}
        showTitleHeader
        title={messages.title}
        wrapperClassName={styles.wrapperClassName}
        bodyClassName={styles.modalBodyStyle}
        headerContainerClassName={styles.headerContainer}
      >
        {body}
      </Modal>
    </>
  )
}

export default VerificationModal
