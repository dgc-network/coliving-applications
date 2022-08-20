import { FormTextInput } from 'app/components/core'

const messages = {
  label: 'Name',
  placeholder: 'My ContentList'
}

export const ContentListNameInput = () => {
  return (
    <FormTextInput
      required
      isFirstInput
      name='content list_name'
      label={messages.label}
      placeholder={messages.placeholder}
    />
  )
}
