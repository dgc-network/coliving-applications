import {
  SolanaWalletAddress,
  WalletAddress,
  FeatureFlags
} from '@coliving/common'
import { Button, ButtonType, LogoSol } from '@coliving/stems'
import cn from 'classnames'

import { useLocalStorage } from 'hooks/useLocalStorage'
import { getFeatureEnabled } from 'services/remoteConfig/featureFlagHelpers'

import { ModalBodyWrapper } from '../walletModal'

import ClickableAddress from './clickableAddress'
import styles from './receiveBody.module.css'

type ReceiveBodyProps = {
  wallet: WalletAddress
  solWallet: SolanaWalletAddress
}

const messages = {
  warning: 'PROCEED WITH CAUTION',
  warning2: 'If $DGC is sent to the wrong address it will be lost.',
  warning3: "Don't attempt to send tokens other than $DGC to this address.",
  splWarning1: (
    <>
      {'You can only send Solana (SPL) '}
      <b className={styles.digitalcoin}>{'$DGC'}</b> {' tokens to this address.'}
    </>
  ),
  splWarning2: 'Be sure to send your $DGC to the correct address!',
  splWarning3: 'Be careful, tokens are easy to lose and impossible to recover.',
  understand: 'I UNDERSTAND',
  yourAddress: 'YOUR ADDRESS',
  clickableSPLAddressTitle: 'YOUR SPL $DGC ADDRESS'
}

const useLocalStorageClickedReceiveUnderstand = (): [boolean, () => void] => {
  const key = 'receiveSPLAudioUnderstand'
  const [hasClickedUnderstand, setHasClickedUnderstand] = useLocalStorage(
    key,
    false
  )
  const onClickUnderstand = () => {
    setHasClickedUnderstand(true)
  }
  return [hasClickedUnderstand, onClickUnderstand]
}

const ReceiveBody = ({ wallet, solWallet }: ReceiveBodyProps) => {
  const useSolSPLAudio = getFeatureEnabled(
    FeatureFlags.ENABLE_SPL_DGC
  ) as boolean
  const [hasClickedUnderstand, onClickUnderstand] =
    useLocalStorageClickedReceiveUnderstand()

  const renderReceiveEth = () => {
    return (
      <>
        <div className={styles.warning}>{messages.warning}</div>
        <div className={styles.description}>
          <div>{messages.warning2}</div>
          <div>{messages.warning3}</div>
        </div>
        <ClickableAddress address={wallet} />
      </>
    )
  }

  const renderSolAudioHeader = () => {
    return (
      <div className={styles.solClickableHeader}>
        <div className={styles.iconSolContainer}>
          <LogoSol className={styles.iconSolHeader} />
        </div>
        <span>{messages.clickableSPLAddressTitle}</span>
      </div>
    )
  }
  const renderReceiveSol = () => {
    return (
      <>
        <div className={styles.warning}>{messages.warning}</div>
        <div className={styles.description}>
          <LogoSol className={styles.chainIconSol} />
          <ul className={styles.splWarning}>
            <li>{messages.splWarning1}</li>
            <li>{messages.splWarning2}</li>
            <li>{messages.splWarning3}</li>
          </ul>
        </div>
        {hasClickedUnderstand ? (
          <ClickableAddress
            label={renderSolAudioHeader()}
            address={solWallet}
          />
        ) : (
          <Button
              text={messages.understand}
              onClick={onClickUnderstand}
              textClassName={styles.understandText}
              type={ButtonType.PRIMARY_ALT} css={undefined}          />
        )}
      </>
    )
  }

  return (
    <ModalBodyWrapper
      className={cn(styles.container, {
        [styles.solContainer]: useSolSPLAudio
      })}
    >
      {useSolSPLAudio ? renderReceiveSol() : renderReceiveEth()}
    </ModalBodyWrapper>
  )
}

export default ReceiveBody
