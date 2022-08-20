import { forwardRef, useContext } from 'react'

import {
  PopupMenu,
  PopupMenuItem,
  PopupMenuProps,
  PopupPosition
} from '@coliving/stems'

import { MainContentContext } from 'pages/MainContentContext'

import CollectionMenu, {
  OwnProps as CollectionMenuProps
} from './CollectionMenu'
import AgreementMenu, { OwnProps as AgreementMenuProps } from './AgreementMenu'
import UserMenu, { OwnProps as UserMenuProps } from './UserMenu'

export type MenuOptionType =
  | UserMenuProps
  | CollectionMenuProps
  | AgreementMenuProps

export type MenuType = MenuOptionType['type']

export type MenuProps = {
  children: PopupMenuProps['renderTrigger']
  menu: Omit<MenuOptionType, 'children'>
  onClose?: () => void
  zIndex?: number
}

const Menu = forwardRef<HTMLDivElement, MenuProps>((props, ref) => {
  const { menu, onClose, zIndex } = props

  const { mainContentRef } = useContext(MainContentContext)

  const renderMenu = (items: PopupMenuItem[]) => (
    <PopupMenu
      items={items}
      onClose={onClose}
      position={PopupPosition.BOTTOM_RIGHT}
      ref={ref}
      renderTrigger={props.children}
      zIndex={zIndex}
      containerRef={mainContentRef}
    />
  )

  if (menu.type === 'user') {
    return <UserMenu {...(menu as UserMenuProps)}>{renderMenu}</UserMenu>
  } else if (menu.type === 'album' || menu.type === 'content list') {
    return (
      <CollectionMenu
        onClose={props.onClose}
        {...(menu as CollectionMenuProps)}
      >
        {renderMenu}
      </CollectionMenu>
    )
  } else if (menu.type === 'agreement') {
    return <AgreementMenu {...(menu as AgreementMenuProps)}>{renderMenu}</AgreementMenu>
  } else if (menu.type === 'notification') {
  }
  return null
})

Menu.defaultProps = {
  menu: {
    type: 'agreement',
    handle: ''
  }
}

export default Menu
