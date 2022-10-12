import { useCallback } from 'react'

import type { Collection } from '@coliving/common'
import { SquareSizes } from '@coliving/common'
import {
  editContentList,
  orderContentList,
  removeDigitalContentFromContentList
} from 'common/store/cache/collections/actions'
import { digitalContentsActions } from 'common/store/pages/collection/lineup/actions'
import {
  getMetadata,
  getDigitalContents
} from 'common/store/ui/createContentListModal/selectors'
import type { FormikProps } from 'formik'
import { Formik } from 'formik'
import { isEqual } from 'lodash'
import { View } from 'react-native'

import { FormScreen } from 'app/components/formScreen'
import { DigitalContentList } from 'app/components/digitalContentList'
import { useCollectionCoverArt } from 'app/hooks/useCollectionCoverArt'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { makeStyles } from 'app/styles'

import { ContentListDescriptionInput } from './contentListDescriptionInput'
import { ContentListImageInput } from './contentListImageInput'
import { ContentListNameInput } from './contentListNameInput'
import type { ContentListValues } from './types'

const useStyles = makeStyles(({ spacing }) => ({
  footer: {
    paddingBottom: spacing(50)
  }
}))

const EditContentListForm = (props: FormikProps<ContentListValues>) => {
  const { values, handleSubmit, handleReset, setFieldValue } = props
  const styles = useStyles()

  const handleReorder = useCallback(
    ({ data, from, to }) => {
      const reorder = [...values.digital_content_ids]
      const tmp = reorder[from]
      reorder.splice(from, 1)
      reorder.splice(to, 0, tmp)

      setFieldValue('digital_content_ids', reorder)
      setFieldValue('digitalContents', data)
    },
    [setFieldValue, values.digital_content_ids]
  )

  const handleRemove = useCallback(
    (index: number) => {
      if ((values.digital_content_ids.length ?? 0) <= index) {
        return
      }
      const { digital_content: digitalContentId, time } = values.digital_content_ids[index]

      const digitalContentMetadata = values.digitalContents?.find(
        ({ digital_content_id }) => digital_content_id === digitalContentId
      )

      if (!digitalContentMetadata) return

      setFieldValue('removedDigitalContents', [
        ...values.removedDigitalContents,
        { digitalContentId, timestamp: time }
      ])

      const digitalContents = [...(values.digitalContents ?? [])]
      digitalContents.splice(index, 1)

      setFieldValue('digitalContents', digitalContents)
    },
    [values.digital_content_ids, values.digitalContents, values.removedDigitalContents, setFieldValue]
  )

  const header = (
    <>
      <ContentListImageInput />
      <ContentListNameInput />
      <ContentListDescriptionInput />
    </>
  )

  return (
    <FormScreen onSubmit={handleSubmit} onReset={handleReset} goBackOnSubmit>
      {values.digitalContents ? (
        <DigitalContentList
          hideArt
          isReorderable
          onReorder={handleReorder}
          onRemove={handleRemove}
          digitalContents={values.digitalContents}
          digitalContentItemAction='remove'
          ListHeaderComponent={header}
          ListFooterComponent={<View style={styles.footer} />}
        />
      ) : (
        header
      )}
    </FormScreen>
  )
}

export const EditContentListScreen = () => {
  const contentList = useSelectorWeb(getMetadata)
  const dispatchWeb = useDispatchWeb()
  const digitalContents = useSelectorWeb(getDigitalContents)

  const coverArt = useCollectionCoverArt({
    id: contentList?.content_list_id,
    sizes: contentList?._cover_art_sizes ?? null,
    size: SquareSizes.SIZE_1000_BY_1000
  })

  const handleSubmit = useCallback(
    (values: ContentListValues) => {
      if (contentList) {
        values.removedDigitalContents.forEach(({ digitalContentId, timestamp }) => {
          dispatchWeb(
            removeDigitalContentFromContentList(digitalContentId, contentList.content_list_id, timestamp)
          )
        })
        if (!isEqual(contentList?.content_list_contents.digital_content_ids, values.digital_content_ids)) {
          dispatchWeb(
            orderContentList(
              contentList?.content_list_id,
              values.digital_content_ids.map(({ digital_content, time }) => ({ id: digital_content, time }))
            )
          )
        }
        dispatchWeb(
          editContentList(contentList.content_list_id, values as unknown as Collection)
        )
        dispatchWeb(digitalContentsActions.fetchLineupMetadatas())
      }
    },
    [dispatchWeb, contentList]
  )

  if (!contentList) return null

  const { content_list_name, description } = contentList

  const initialValues = {
    content_list_name,
    description,
    artwork: { url: coverArt ?? '' },
    removedDigitalContents: [],
    digitalContents,
    digital_content_ids: contentList.content_list_contents.digital_content_ids
  }

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
      component={EditContentListForm}
    />
  )
}
