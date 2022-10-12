import { useCallback } from 'react'

import { updateEmailFrequency } from '@coliving/web/src/common/store/pages/settings/actions'
import { getEmailFrequency } from '@coliving/web/src/common/store/pages/settings/selectors'
import { EmailFrequency } from '@coliving/web/src/common/store/pages/settings/types'

import { SegmentedControl } from 'app/components/core'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'

import { SettingsRowLabel } from './settingRowLabel'
import { SettingsRow } from './settingsRow'
import { SettingsRowContent } from './settingsRowContent'

const messages = {
  emailFrequency: "'What You Missed' Email Frequency",
  digitalcoin: 'Digitalcoin',
  daily: 'Daily',
  weekly: 'Weekly',
  off: 'Off'
}

const emailFrequencyOptions = [
  { key: EmailFrequency.Digitalcoin, text: messages.digitalcoin },
  { key: EmailFrequency.Daily, text: messages.daily },
  { key: EmailFrequency.Weekly, text: messages.weekly },
  { key: EmailFrequency.Off, text: messages.off }
]

export const EmailFrequencyControlRow = () => {
  const dispatchWeb = useDispatchWeb()
  const emailFrequency = useSelectorWeb(getEmailFrequency)

  const handleSelectOption = useCallback(
    (option: EmailFrequency) => {
      dispatchWeb(updateEmailFrequency(option))
    },
    [dispatchWeb]
  )

  return (
    <SettingsRow>
      <SettingsRowLabel label={messages.emailFrequency} />
      <SettingsRowContent>
        <SegmentedControl
          fullWidth
          options={emailFrequencyOptions}
          selected={emailFrequency}
          onSelectOption={handleSelectOption}
        />
      </SettingsRowContent>
    </SettingsRow>
  )
}
