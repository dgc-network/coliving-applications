import { useCallback } from 'react'

import { CreatePlaylistSource } from '@/common'
import { getUserHandle } from '-client/src/common/store/account/selectors'
import { createPlaylist } from '-client/src/common/store/cache/collections/actions'
import { content listPage } from '-client/src/utils/route'
import type { FormikProps } from 'formik'
import { Formik } from 'formik'

import { FormScreen } from 'app/components/form-screen'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useNavigation } from 'app/hooks/useNavigation'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { useToast } from 'app/hooks/useToast'

import { PlaylistDescriptionInput } from './PlaylistDescriptionInput'
import { PlaylistImageInput } from './PlaylistImageInput'
import { PlaylistNameInput } from './PlaylistNameInput'

const messages = {
  title: 'Create Playlist',
  content listCreatedToast: 'Playlist Created!'
}

type PlaylistValues = {
  content list_name: string
  description: string
  artwork: { url: string }
}

const CreatePlaylistForm = (props: FormikProps<PlaylistValues>) => {
  const { handleSubmit, handleReset, errors } = props

  return (
    <FormScreen
      title={messages.title}
      onSubmit={handleSubmit}
      onReset={handleReset}
      errors={errors}
    >
      <PlaylistImageInput />
      <PlaylistNameInput />
      <PlaylistDescriptionInput />
    </FormScreen>
  )
}

const initialValues: PlaylistValues = {
  content list_name: '',
  description: '',
  artwork: { url: '' }
}

const initialErrors = {
  content list_name: 'Required'
}

export const CreatePlaylistScreen = () => {
  const handle = useSelectorWeb(getUserHandle) ?? ''
  const { toast } = useToast()

  const dispatchWeb = useDispatchWeb()
  const navigation = useNavigation()
  const handleSubmit = useCallback(
    (values: PlaylistValues) => {
      const tempId = Date.now().toString()
      dispatchWeb(
        createPlaylist(tempId, values, CreatePlaylistSource.FAVORITES_PAGE)
      )
      navigation.replace({
        native: { screen: 'Collection', params: { id: parseInt(tempId, 10) } },
        web: { route: content listPage(handle, values.content list_name, tempId) }
      })
      toast({ content: messages.content listCreatedToast })
    },
    [dispatchWeb, navigation, handle, toast]
  )

  return (
    <Formik
      initialValues={initialValues}
      initialErrors={initialErrors}
      onSubmit={handleSubmit}
      component={CreatePlaylistForm}
    />
  )
}
