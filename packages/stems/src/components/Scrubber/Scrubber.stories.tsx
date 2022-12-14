import { Story } from '@storybook/react'
import * as React from 'react'

import { Scrubber } from './scrubber'
import { ScrubberProps } from './types'

export default {
  component: Scrubber,
  title: 'Components/Scrubber'
}

const Template: Story<ScrubberProps> = (args) => <Scrubber {...args} />
const baseProps: ScrubberProps = {
  isPlaying: false,
  mediaKey: '1',
  elapsedSeconds: 0,
  totalSeconds: 100
}

// Primary
export const Primary = Template.bind({})
Primary.args = { ...baseProps }

// Disabled
export const Disabled = Template.bind({})
Disabled.args = { ...baseProps, isDisabled: true }

// No Timestamps
export const NoTimestamps = Template.bind({})
NoTimestamps.args = { ...baseProps, includeTimestamps: false }

// Mobile
export const Mobile = Template.bind({})
Mobile.args = { ...baseProps, isMobile: true }
