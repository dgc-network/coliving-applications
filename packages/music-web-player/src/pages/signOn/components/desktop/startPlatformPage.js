import { Component } from 'react'

import { Button, ButtonType, IconUpload, IconNote } from '@coliving/stems'
import cn from 'classnames'
import PropTypes from 'prop-types'

import backgroundPlaceholder from 'assets/img/1-Concert-3-1.jpg'

import styles from './startPlatformPage.module.css'

const messages = {
  title: "It's Time To Start Your Coliving Journey!",
  subTitle: 'Coliving is a platform for both landlords and listeners.',
  uploadMusic: {
    button: 'Upload DigitalContent',
    title: 'Why Upload My Music?',
    description:
      'Once you’ve uploaded your music, others can discover your digitalContents immediately!'
  },
  startListening: {
    button: 'Start Listening',
    title: 'Nothing To Upload Yet?',
    description:
      'Support landlords you like by listening and sharing their digitalContents with your friends.'
  }
}

export class StartPlatformPage extends Component {
  render() {
    const { onUploadDigitalContent, onStartListening } = this.props
    return (
      <div className={styles.container}>
        <div className={styles.contentContainer}>
          <div className={cn(styles.header)}>
            <h2 className={styles.title}>
              {messages.title} <i className='emoji large party-popper' />
            </h2>
            <div className={styles.subTitle}>{messages.subTitle}</div>
          </div>
          <div className={styles.optionSection}>
            <div className={styles.optionContainer}>
              <Button
                text={messages.uploadMusic.button}
                className={styles.optionButton}
                textClassName={styles.optionButtonText}
                type={ButtonType.PRIMARY_ALT}
                leftIcon={<IconUpload />}
                name='uploadMedia'
                onClick={onUploadDigitalContent}
              />
              <div className={styles.optionTextContainer}>
                <div className={styles.optionTitle}>
                  {messages.uploadMusic.title}
                </div>
                <div>{messages.uploadMusic.description}</div>
              </div>
            </div>
            <div className={styles.border} />
            <div className={styles.optionContainer}>
              <Button
                text={messages.startListening.button}
                className={styles.optionButton}
                type={ButtonType.SECONDARY}
                textClassName={styles.optionButtonText}
                leftIcon={<IconNote />}
                name='startListening'
                onClick={onStartListening}
              />
              <div className={styles.optionTextContainer}>
                <div className={styles.optionTitle}>
                  {messages.startListening.title}
                </div>
                <div>{messages.startListening.description}</div>
              </div>
            </div>
          </div>
        </div>
        <div
          className={styles.bgImage}
          style={{ backgroundImage: `url(${backgroundPlaceholder})` }}
        />
      </div>
    )
  }
}

StartPlatformPage.propTypes = {
  onPrevPage: PropTypes.func,
  onUploadDigitalContent: PropTypes.func,
  onStartListening: PropTypes.func
}

StartPlatformPage.defaultProps = {}

export default StartPlatformPage
