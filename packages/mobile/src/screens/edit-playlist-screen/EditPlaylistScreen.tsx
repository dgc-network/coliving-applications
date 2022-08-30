import { useCallback } from 'react'

import type { Collection } from '@coliving/common'
import { SquareSizes } from '@coliving/common'
import {
  editContentList,
  orderContentList,
  removeAgreementFromContentList
} from 'common/store/cache/collections/actions'
import { agreementsActions } from 'common/store/pages/collection/lineup/actions'
import {
  getMetadata,
  getAgreements
} from 'common/store/ui/createContentListModal/selectors'
import type { FormikProps } from 'formik'
import { Formik } from 'formik'
import { isEqual } from 'lodash'
import { View } from 'react-native'

import { FormScreen } from 'app/components/form-screen'
import { AgreementList } from 'app/components/agreement-list'
import { useCollectionCoverArt } from 'app/hooks/useCollectionCoverArt'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { makeStyles } from 'app/styles'

import { ContentListDescriptionInput } from './ContentListDescriptionInput'
import { ContentListImageInput } from './ContentListImageInput'
import { ContentListNameInput } from './ContentListNameInput'
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
      const reorder = [...values.agreement_ids]
      const tmp = reorder[from]
      reorder.splice(from, 1)
      reorder.splice(to, 0, tmp)

      setFieldValue('agreement_ids', reorder)
      setFieldValue('agreements', data)
    },
    [setFieldValue, values.agreement_ids]
  )

  const handleRemove = useCallback(
    (index: number) => {
      if ((values.agreement_ids.length ?? 0) <= index) {
        return
      }
      const { agreement: agreementId, time } = values.agreement_ids[index]

      const agreementMetadata = values.agreements?.find(
        ({ agreement_id }) => agreement_id === agreementId
      )

      if (!agreementMetadata) return

      setFieldValue('removedAgreements', [
        ...values.removedAgreements,
        { agreementId, timestamp: time }
      ])

      const agreements = [...(values.agreements ?? [])]
      agreements.splice(index, 1)

      setFieldValue('agreements', agreements)
    },
    [values.agreement_ids, values.agreements, values.removedAgreements, setFieldValue]
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
      {values.agreements ? (
        <AgreementList
          hideArt
          isReorderable
          onReorder={handleReorder}
          onRemove={handleRemove}
          agreements={values.agreements}
          agreementItemAction='remove'
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
  const agreements = useSelectorWeb(getAgreements)

  const coverArt = useCollectionCoverArt({
    id: contentList?.content_list_id,
    sizes: contentList?._cover_art_sizes ?? null,
    size: SquareSizes.SIZE_1000_BY_1000
  })

  const handleSubmit = useCallback(
    (values: ContentListValues) => {
      if (contentList) {
        values.removedAgreements.forEach(({ agreementId, timestamp }) => {
          dispatchWeb(
            removeAgreementFromContentList(agreementId, contentList.content_list_id, timestamp)
          )
        })
        if (!isEqual(contentList?.content_list_contents.agreement_ids, values.agreement_ids)) {
          dispatchWeb(
            orderContentList(
              contentList?.content_list_id,
              values.agreement_ids.map(({ agreement, time }) => ({ id: agreement, time }))
            )
          )
        }
        dispatchWeb(
          editContentList(contentList.content_list_id, values as unknown as Collection)
        )
        dispatchWeb(agreementsActions.fetchLineupMetadatas())
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
    removedAgreements: [],
    agreements,
    agreement_ids: contentList.content_list_contents.agreement_ids
  }

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
      component={EditContentListForm}
    />
  )
}
