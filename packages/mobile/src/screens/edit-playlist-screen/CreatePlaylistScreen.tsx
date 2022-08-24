import { useCallback } from 'react'

import { CreateContentListSource } from '@/common'
import { getUserHandle } from '-client/src/common/store/account/selectors'
import { createContentList } from '-client/src/common/store/cache/collections/actions'
import { contentListPage } from '-client/src/utils/route'
import type { FormikProps } from 'formik'
import { Formik } from 'formik'

import { FormScreen } from 'app/components/form-screen'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useNavigation } from 'app/hooks/useNavigation'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { useToast } from 'app/hooks/useToast'

import { ContentListDescriptionInput } from './ContentListDescriptionInput'
import { ContentListImageInput } from './ContentListImageInput'
import { ContentListNameInput } from './ContentListNameInput'

const messages = {
  title: 'Create ContentList',
  contentListCreatedToast: 'ContentList Created!'
}

type ContentListValues = {
  content_list_name: string
  description: string
  artwork: { url: string }
}

const CreateContentListForm = (props: FormikProps<ContentListValues>) => {
  const { handleSubmit, handleReset, errors } = props

  return (
    <FormScreen
      title={messages.title}
      onSubmit={handleSubmit}
      onReset={handleReset}
      errors={errors}
    >
      <ContentListImageInput />
      <ContentListNameInput />
      <ContentListDescriptionInput />
    </FormScreen>
  )
}

const initialValues: ContentListValues = {
  content_list_name: '',
  description: '',
  artwork: { url: '' }
}

const initialErrors = {
  content_list_name: 'Required'
}

export const CreateContentListScreen = () => {
  const handle = useSelectorWeb(getUserHandle) ?? ''
  const { toast } = useToast()

  const dispatchWeb = useDispatchWeb()
  const navigation = useNavigation()
  const handleSubmit = useCallback(
    (values: ContentListValues) => {
      const tempId = Date.now().toString()
      dispatchWeb(
        createContentList(tempId, values, CreateContentListSource.FAVORITES_PAGE)
      )
      navigation.replace({
        native: { screen: 'Collection', params: { id: parseInt(tempId, 10) } },
        web: { route: contentListPage(handle, values.content_list_name, tempId) }
      })
      toast({ content: messages.contentListCreatedToast })
    },
    [dispatchWeb, navigation, handle, toast]
  )

  return (
    <Formik
      initialValues={initialValues}
      initialErrors={initialErrors}
      onSubmit={handleSubmit}
      component={CreateContentListForm}
    />
  )
}
