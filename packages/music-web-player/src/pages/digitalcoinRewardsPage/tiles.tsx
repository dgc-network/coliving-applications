import { useCallback, ReactNode } from 'react'

import { BNWei, Nullable } from '@coliving/common'
import { Button, ButtonType, IconInfo } from '@coliving/stems'
import BN from 'bn.js'
import cn from 'classnames'
import { useDispatch } from 'react-redux'

import { ReactComponent as IconReceive } from 'assets/img/iconReceive.svg'
import { ReactComponent as IconSend } from 'assets/img/iconSend.svg'
import { useModalState } from 'common/hooks/useModalState'
import { getHasAssociatedWallets } from 'common/store/pages/tokenDashboard/selectors'
import {
  pressConnectWallets,
  pressReceive,
  pressSend
} from 'common/store/pages/tokenDashboard/slice'
import {
  getAccountBalance,
  getAccountTotalBalance
} from 'common/store/wallet/selectors'
import { formatWei } from 'common/utils/wallet'
import MobileConnectWalletsDrawer from 'components/mobileConnectWalletsDrawer/mobileConnectWalletsDrawer'
import { useWithMobileStyle } from 'hooks/useWithMobileStyle'
import { isMobile } from 'utils/clientUtil'
import { useSelector } from 'utils/reducer'

import styles from './tiles.module.css'
import TokenHoverTooltip from './components/tokenHoverTooltip'

const messages = {
  noClaim1: 'You earn $DGC by using Coliving.',
  noClaim2: 'The more you use Coliving, the more $DGC you earn.',
  balance: '$DGC BALANCE',
  receiveLabel: 'RECEIVE $DGC',
  sendLabel: 'SEND $DGC',
  digitalcoin: '$DGC',
  manageWallets: 'Manage Wallets',
  connectWallets: 'Connect Other Wallets',
  totalAudio: 'Total $DGC'
}

export const LEARN_MORE_URL = 'http://blog.coliving.lol/posts/community-meet-digitalcoin'

type TileProps = {
  className?: string
  children: ReactNode
}

const IS_NATIVE_MOBILE = process.env.REACT_APP_NATIVE_MOBILE

export const Tile = ({ className, children }: TileProps) => {
  return (
    <div className={cn([styles.tileContainer, className])}> {children}</div>
  )
}

export const BalanceTile = ({ className }: { className?: string }) => {
  const totalBalance: Nullable<BNWei> =
    useSelector(getAccountTotalBalance) ?? null
  const hasMultipleWallets = useSelector(getHasAssociatedWallets)

  const [, setOpen] = useModalState('DigitalcoinBreakdown')
  const onClickOpen = useCallback(() => {
    setOpen(true)
  }, [setOpen])

  const wm = useWithMobileStyle(styles.mobile)

  return (
    <Tile className={wm(styles.balanceTile, className)}>
      <>
        <TokenHoverTooltip balance={totalBalance || (new BN(0) as BNWei)}>
          <div
            className={cn(styles.balanceAmount, {
              [styles.hidden]: !totalBalance
            })}
          >
            {formatWei(totalBalance || (new BN(0) as BNWei), true, 0)}
          </div>
        </TokenHoverTooltip>
        <div
          className={cn(styles.balance, {
            [styles.hidden]: !totalBalance
          })}
        >
          {hasMultipleWallets ? (
            <div onClick={onClickOpen}>
              {messages.totalAudio}
              <IconInfo className={styles.iconInfo} />
            </div>
          ) : (
            messages.digitalcoin
          )}
        </div>
      </>
    </Tile>
  )
}

export const WalletTile = ({ className }: { className?: string }) => {
  const balance = useSelector(getAccountBalance) ?? (new BN(0) as BNWei)
  const hasBalance = balance && !balance.isZero()
  const dispatch = useDispatch()
  const [, openTransferDrawer] = useModalState('TransferAudioMobileWarning')

  const mobile = isMobile()
  const onClickReceive = useCallback(() => {
    if (mobile) {
      openTransferDrawer(true)
    } else {
      dispatch(pressReceive())
    }
  }, [dispatch, mobile, openTransferDrawer])

  const onClickSend = useCallback(() => {
    if (mobile) {
      openTransferDrawer(true)
    } else {
      dispatch(pressSend())
    }
  }, [mobile, dispatch, openTransferDrawer])
  const [, setOpen] = useModalState('MobileConnectWalletsDrawer')

  const onClickConnectWallets = useCallback(() => {
    if (mobile) {
      setOpen(true)
    } else {
      dispatch(pressConnectWallets())
    }
  }, [mobile, setOpen, dispatch])

  const onCloseConnectWalletsDrawer = useCallback(() => {
    setOpen(false)
  }, [setOpen])

  const hasMultipleWallets = useSelector(getHasAssociatedWallets)

  return (
    <Tile className={cn([styles.walletTile, className])}>
      <>
        <div className={styles.buttons}>
          <Button
            className={cn(styles.balanceBtn, {
              [styles.balanceDisabled]: !hasBalance
            })}
            text={messages.sendLabel}
            isDisabled={!hasBalance}
            includeHoverAnimations={hasBalance}
            textClassName={styles.textClassName}
            onClick={onClickSend}
            leftIcon={<IconSend className={styles.iconStyle} />}
            type={ButtonType.GLASS} css={undefined}          />
          <Button
            className={cn(styles.balanceBtn, styles.receiveBtn)}
            text={messages.receiveLabel}
            textClassName={styles.textClassName}
            onClick={onClickReceive}
            leftIcon={<IconReceive className={styles.iconStyle} />}
            type={ButtonType.GLASS} css={undefined}          />
          <Button
            className={cn(styles.balanceBtn, styles.connectWalletsBtn)}
            text={hasMultipleWallets
              ? messages.manageWallets
              : messages.connectWallets}
            includeHoverAnimations
            textClassName={styles.textClassName}
            onClick={onClickConnectWallets}
            type={ButtonType.GLASS} css={undefined}          />
          {mobile && !IS_NATIVE_MOBILE && (
            <MobileConnectWalletsDrawer onClose={onCloseConnectWalletsDrawer} />
          )}
        </div>
      </>
    </Tile>
  )
}
