import { FormTextInput } from 'app/components/core'

const messages = {
  label: 'Name',
  placeholder: 'My Playlist'
}

export const PlaylistNameInput = () => {
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
