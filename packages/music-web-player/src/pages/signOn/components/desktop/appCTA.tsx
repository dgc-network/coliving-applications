import { ReactNode } from 'react'

import { Button, IconArrow, ButtonType } from '@coliving/stems'
import cn from 'classnames'

import QRCode from 'assets/img/imageQR.png'

import styles from './appCTA.module.css'

const messages = {
  appCTA: 'Get The App',
  description: `
    Take Coliving with you! Download the Coliving
    mobile app and listen to remixes, digitalContents, and
    contentLists in incredible quality from anywhere.
  `,
  qrInstruction: `
    Scan This Code with Your
    Phone Camera
  `,
  continue: 'Continue'
}

type AppCTAProps = {
  onNextPage: () => void
}

const Title = ({
  children,
  className
}: {
  children: ReactNode
  className?: string
}) => <h2 className={cn(styles.title, className)}>{children}</h2>

const Subtitle = ({
  children,
  className
}: {
  children: ReactNode
  className?: string
}) => <div className={cn(styles.subtitle, className)}>{children}</div>

const AppCTA = ({ onNextPage }: AppCTAProps) => {
  return (
    <div className={styles.container}>
      <Title className={styles.topText}>{messages.appCTA}</Title>
      <Subtitle className={styles.descriptionText}>
        {messages.description}
      </Subtitle>
      <img src={QRCode} className={styles.qrCode} alt='QR Code' />
      <Subtitle className={styles.bottomText}>
        {messages.qrInstruction}
      </Subtitle>
      <Button
        text='Continue'
        name='continue'
        rightIcon={<IconArrow />}
        type={ButtonType.PRIMARY_ALT}
        onClick={onNextPage}
        textClassName={styles.continueButtonText}
        className={styles.continueButton} css={undefined}      />
    </div>
  )
}

export default AppCTA
