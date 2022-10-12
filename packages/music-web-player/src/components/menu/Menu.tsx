import { forwardRef, useContext } from 'react'

import {
  PopupMenu,
  PopupMenuItem,
  PopupMenuProps,
  PopupPosition
} from '@coliving/stems'

import { MainContentContext } from 'pages/mainContentContext'

import CollectionMenu, {
  OwnProps as CollectionMenuProps
} from './collectionMenu'
import DigitalContentMenu, { OwnProps as DigitalContentMenuProps } from './digitalContentMenu'
import UserMenu, { OwnProps as UserMenuProps } from './userMenu'

export type MenuOptionType =
  | UserMenuProps
  | CollectionMenuProps
  | DigitalContentMenuProps

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
  } else if (menu.type === 'album' || menu.type === 'contentList') {
    return (
      <CollectionMenu
        onClose={props.onClose}
        {...(menu as CollectionMenuProps)}
      >
        {renderMenu}
      </CollectionMenu>
    )
  } else if (menu.type === 'digital_content') {
    return <DigitalContentMenu {...(menu as DigitalContentMenuProps)}>{renderMenu}</DigitalContentMenu>
  } else if (menu.type === 'notification') {
  }
  return null
})

Menu.defaultProps = {
  menu: {
    type: 'digital_content',
    handle: ''
  }
}

export default Menu
