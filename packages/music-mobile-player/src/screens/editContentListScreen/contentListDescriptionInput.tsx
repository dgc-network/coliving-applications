import { FormTextInput } from 'app/components/core'
import { makeStyles } from 'app/styles'

const messages = {
  label: 'Description',
  placeholder: 'Give your contentList a description'
}

const useStyles = makeStyles(() => ({
  root: { minHeight: 100 },
  label: { lineHeight: 28 }
}))

export const ContentListDescriptionInput = () => {
  const styles = useStyles()

  return (
    <FormTextInput
      placeholder={messages.placeholder}
      name='description'
      label={messages.label}
      multiline
      maxLength={256}
      styles={styles}
    />
  )
}
