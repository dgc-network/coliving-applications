import { Story } from '@storybook/react'
import * as React from 'react'

import { IconContentLists } from 'components/icons'

import { IconButton, IconButtonProps } from '.'

export default {
  component: IconButton,
  title: 'Components/IconButton'
}

const Template: Story<IconButtonProps> = (args) => {
  return <IconButton {...args} />
}

export const Base = Template.bind({})
const baseProps: IconButtonProps = {
  icon: <IconContentLists />,
  'aria-label': 'Add contentList'
}

Base.args = baseProps
