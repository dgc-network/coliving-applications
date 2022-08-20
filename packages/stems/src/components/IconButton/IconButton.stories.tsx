import { Story } from '@storybook/react'

import { IconContentLists } from 'components/Icons'

import { IconButton, IconButtonProps } from './'

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
  'aria-label': 'Add content list'
}

Base.args = baseProps
