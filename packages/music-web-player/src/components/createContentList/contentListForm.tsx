import { useEffect, useState } from 'react'

import {
  Collection,
  CollectionMetadata,
  SquareSizes,
  DeepNullable,
  Nullable
} from '@coliving/common'

import Input from 'components/dataEntry/input'
import TextArea from 'components/dataEntry/textArea'
import UploadArtwork from 'components/upload/uploadArtwork'
import { useCollectionCoverArt } from 'hooks/useCollectionCoverArt'
import * as schemas from 'schemas'
import { resizeImage } from 'utils/imageProcessingUtil'

import { CreateActions, EditActions } from './formActions'
import styles from './ContentListForm.module.css'

const messages = {
  editContentListButtonText: 'Save Changes',
  cancelButtonText: 'Cancel',
  deleteContentListButtonText: 'Delete ContentList',
  deleteAlbumButtonText: 'Delete Album',
  createContentListButtonText: 'Create ContentList'
}

export type ContentListFormFields = Partial<Collection> & {
  artwork: {
    file: Blob
    url: string
    source: 'unsplash' | 'original'
    error?: string
  }
  is_current: boolean
  mood: Nullable<string>
  created_at: Nullable<string>
  tags: Nullable<string>
  genre: Nullable<string>
  isAlbum: boolean
} & DeepNullable<
    Pick<
      CollectionMetadata,
      | 'is_private'
      | 'updated_at'
      | 'cover_art'
      | 'cover_art_sizes'
      | 'content_list_name'
      | 'content_list_owner_id'
      | 'save_count'
      | 'upc'
      | 'description'
    >
  >

type ContentListFormProps = {
  metadata?: Nullable<Collection>
  isAlbum?: boolean
  onOpenArtworkPopup?: () => void
  onCloseArtworkPopup?: () => void
  isEditMode?: boolean
  /** Only applies to edit mode */
  onDelete?: () => void
  /** Only applies to edit mode */
  onCancel?: () => void
  onSave: (formFields: ContentListFormFields) => void
}

const ContentListForm = ({
  isAlbum = false,
  metadata,
  onSave: onSaveParent,
  onCancel,
  onDelete,
  onOpenArtworkPopup,
  onCloseArtworkPopup,
  isEditMode = false
}: ContentListFormProps) => {
  const [formFields, setFormFields] = useState<ContentListFormFields>({
    artwork: {},
    ...schemas.newCollectionMetadata(metadata)
  })
  const [errors, setErrors] = useState({
    contentListName: false,
    artwork: false
  })
  const [hasSubmitted, setHasSubmitted] = useState(false)

  const coverArt = useCollectionCoverArt(
    formFields.content_list_id,
    formFields?._cover_art_sizes ? formFields._cover_art_sizes : null,
    SquareSizes.SIZE_1000_BY_1000
  )

  // On receiving new, defined metadata, update the form fields
  useEffect(() => {
    if (metadata) {
      setFormFields((oldFormFields) => ({
        ...schemas.newCollectionMetadata(metadata),
        artwork: oldFormFields.artwork,
        content_list_name: oldFormFields.content_list_name,
        description: oldFormFields.description
      }))
    }
  }, [metadata])

  const onDropArtwork = async (selectedFiles: any, source: any) => {
    setErrors({
      ...errors,
      artwork: false
    })
    try {
      let file = selectedFiles[0]
      file = await resizeImage(file)
      const url = URL.createObjectURL(file)
      setFormFields((formFields: ContentListFormFields) => ({
        ...formFields,
        artwork: { file, url, source }
      }))
    } catch (err) {
      setFormFields((formFields: ContentListFormFields) => ({
        ...formFields,
        artwork: {
          ...(formFields.artwork || {}),
          error: err instanceof Error ? err.message : 'Unknown error'
        }
      }))
    }
  }

  const onChangeContentListName = (name: string) => {
    setFormFields((formFields: ContentListFormFields) => ({
      ...formFields,
      content_list_name: name
    }))
    if (name) {
      setErrors({ ...errors, contentListName: false })
    }
  }

  const onChangeDescription = (description: string) => {
    setFormFields((formFields: ContentListFormFields) => ({
      ...formFields,
      description
    }))
  }

  const onSave = () => {
    const nameIsEmpty = !formFields.content_list_name
    const artworkIsEmpty = !formFields.artwork.file && !coverArt
    if (nameIsEmpty || artworkIsEmpty) {
      setErrors({
        ...errors,
        artwork: artworkIsEmpty,
        contentListName: nameIsEmpty
      })
    } else {
      setHasSubmitted(true)
      onSaveParent(formFields)
    }
  }

  return (
    <div>
      <div className={styles.contentListForm}>
        <UploadArtwork
          artworkUrl={formFields.artwork.url || coverArt}
          onDropArtwork={onDropArtwork}
          error={errors.artwork}
          imageProcessingError={Boolean(formFields.artwork.error)}
          onOpenPopup={onOpenArtworkPopup}
          onClosePopup={onCloseArtworkPopup}
        />
        <div className={styles.form}>
          <Input
            variant='elevatedPlaceholder'
            placeholder={`${isAlbum ? 'Album' : 'ContentList'} Name`}
            defaultValue={formFields.content_list_name || ''}
            error={errors.contentListName}
            onChange={onChangeContentListName}
            characterLimit={64}
          />
          <TextArea
            className={styles.description}
            placeholder='Description'
            onChange={onChangeDescription}
            defaultValue={formFields.description || ''}
          />
        </div>
      </div>
      <div className={styles.actionsWrapper}>
        {isEditMode ? (
          <EditActions
            deleteText={
              isAlbum
                ? messages.deleteAlbumButtonText
                : messages.deleteContentListButtonText
            }
            saveText={messages.editContentListButtonText}
            cancelText={messages.cancelButtonText}
            onCancel={onCancel}
            onDelete={onDelete}
            onSave={onSave}
            disabled={hasSubmitted}
          />
        ) : (
          <CreateActions
            onSave={onSave}
            disabled={hasSubmitted}
            saveText={messages.createContentListButtonText}
          />
        )}
      </div>
    </div>
  )
}

export default ContentListForm
