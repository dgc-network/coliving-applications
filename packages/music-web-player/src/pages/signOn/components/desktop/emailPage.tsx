import { useEffect, useState } from 'react'

import { Button, ButtonSize, ButtonType, IconArrow } from '@coliving/stems'
import cn from 'classnames'
import { Spring } from 'react-spring/renderprops'

import colivingLogoColored from 'assets/img/colivingLogoColored.png'
import Input from 'components/dataEntry/input'
import LoadingSpinner from 'components/loadingSpinner/loadingSpinner'
import PreloadImage from 'components/preloadImage/preloadImage'
import StatusMessage from 'components/statusMessage/statusMessage'
import { useDelayedEffect } from 'hooks/useDelayedEffect'

import styles from './emailPage.module.css'
import { ForgotPasswordHelper } from './forgotPasswordHelper'
import { MetaMaskOption } from './metaMaskOption'

const messages = {
  title: 'Sign Up For Coliving',
  header1: 'Stream the music you love.',
  header2: 'Support the landlords you care about.',
  forgotPasswordText: 'Forgot your password?'
}

export const statusState = Object.freeze({
  ERROR: 'ERROR',
  DEFAULT: 'DEFAULT',
  VALID: 'VALID'
})

const errorMessages = {
  characters: 'Please enter a valid email',
  inUse: 'Email is already in use, please sign-in'
}

type EmailPageProps = {
  isMobile?: boolean
  hasMetaMask: boolean
  email: {
    value: string
    status: string
    error: 'inUse' | 'characters'
  }
  onSubmit: (email: string) => void
  onEmailChange: (email: string) => void
  onToggleMetaMaskModal: () => void
  onSignIn: () => void
}

export const EmailPage = ({
  isMobile,
  hasMetaMask,
  email,
  onSubmit,
  onEmailChange,
  onToggleMetaMaskModal,
  onSignIn
}: EmailPageProps) => {
  const [showValidation, setShowValidation] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)

  const onBlur = () => {
    setShowValidation(true)
  }

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      onClickSubmit()
    }
  }

  const onClickSubmit = () => {
    setShowValidation(true)
    setIsSubmitting(true)
    if (!email.value) onEmailChange(email.value)
    onSubmit(email.value)
  }

  const onClickToggleMetaMaskModal = () => {
    onEmailChange(email.value)
    setShowValidation(true)
    if (email.status === 'success') {
      onToggleMetaMaskModal()
    }
  }

  useEffect(() => {
    if (isSubmitting && email.status !== 'loading') {
      setIsSubmitting(false)
    }
  }, [isSubmitting, email, setIsSubmitting])

  const [shouldShowLoadingSpinner, setShouldShowLoadingSpinner] =
    useState(false)
  useDelayedEffect({
    callback: () => setShouldShowLoadingSpinner(true),
    reset: () => setShouldShowLoadingSpinner(false),
    condition: isSubmitting,
    delay: 1000
  })

  const inputError = email.status === 'failure'
  const validInput = email.status === 'success'
  const shouldDisableInputs = isSubmitting && email.status === 'loading'
  const showError = inputError && showValidation && email.error !== 'inUse'

  return (
    <div
      className={cn(styles.container, {
        [styles.metaMask]: hasMetaMask,
        [styles.isMobile]: isMobile
      })}
    >
      <PreloadImage
        src={colivingLogoColored}
        alt='Coliving Colored Logo'
        className={styles.logo}
      />
      <div className={cn(styles.title)}>{messages.title}</div>
      <div className={cn(styles.header)}>
        <div className={styles.text}>{messages.header1}</div>
        <div className={styles.text}>{messages.header2}</div>
      </div>
      <Input
        placeholder='Email'
        type='email'
        name='email'
        id='email-input'
        variant={isMobile ? 'normal' : 'elevatedPlaceholder'}
        size='medium'
        value={email.value}
        onChange={onEmailChange}
        onKeyDown={onKeyDown}
        className={cn(styles.signInInput, {
          [styles.placeholder]: email.value === '',
          [styles.inputError]: showError,
          [styles.validInput]: validInput
        })}
        error={showError}
        onBlur={onBlur}
        disabled={shouldDisableInputs}
      />
      {showError ? (
        <Spring
          from={{ opacity: 0 }}
          to={{ opacity: 1 }}
          config={{ duration: 200 }}
        >
          {(animProps) => (
            <StatusMessage
              status='error'
              label={errorMessages[email.error]}
              containerStyle={animProps}
              containerClassName={cn(styles.errorMessage, {
                [styles.errMetaMask]: hasMetaMask
              })}
            />
          )}
        </Spring>
      ) : null}
      <div className={styles.buttonsContainer}>
        <Button
          size={ButtonSize.MEDIUM}
          text='Continue'
          name='continue'
          rightIcon={shouldDisableInputs && shouldShowLoadingSpinner ? (
            <LoadingSpinner className={styles.spinner} />
          ) : (
            <IconArrow />
          )}
          type={shouldDisableInputs ? ButtonType.DISABLED : ButtonType.PRIMARY_ALT}
          onClick={onClickSubmit}
          textClassName={styles.signInButtonText}
          className={styles.signInButton}
          isDisabled={shouldDisableInputs} css={undefined}        />
        {hasMetaMask ? (
          <MetaMaskOption
            text='Sign Up With'
            subText='not recommended'
            onClick={onClickToggleMetaMaskModal}
          />
        ) : null}
        <div className={styles.hasAccount}>
          <Button
            className={cn(styles.hasAccountButton, {
              [styles.hasAccountErrMetaMask]: hasMetaMask && showError,
              [styles.hasAccountErr]: !hasMetaMask && showError
            })}
            type={ButtonType.COMMON_ALT}
            text={'Have an Account? Sign In'}
            onClick={onSignIn} css={undefined}          />
        </div>
        <div className={styles.forgotPasswordTextContainer}>
          <span
            onClick={() => {
              setShowForgotPassword(true)
            }}
            className={styles.forgotPasswordText}
          >
            {messages.forgotPasswordText}
          </span>
        </div>
        <ForgotPasswordHelper
          isOpen={showForgotPassword}
          onClose={() => setShowForgotPassword(false)}
        />
      </div>
    </div>
  )
}
