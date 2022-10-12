import { useEffect, useState, useCallback, useContext } from 'react'

import {
  ID,
  CreateContentListSource,
  Collection,
  SquareSizes,
  Nullable,
  RandomImage
} from '@coliving/common'
import { push as pushRoute } from 'connected-react-router'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'

import { ReactComponent as IconCamera } from 'assets/img/iconCamera.svg'
import placeholderCoverArt from 'assets/img/imageBlank2x.png'
import { getAccountUser } from 'common/store/account/selectors'
import {
  createContentList,
  editContentList,
  orderContentList,
  removeDigitalContentFromContentList
} from 'common/store/cache/collections/actions'
import { digitalContentsActions } from 'common/store/pages/collection/lineup/actions'
import * as createContentListActions from 'common/store/ui/createContentListModal/actions'
import {
  getMetadata,
  getDigitalContents
} from 'common/store/ui/createContentListModal/selectors'
import DynamicImage from 'components/dynamicImage/dynamicImage'
import EditableRow, { Format } from 'components/groupableList/editableRow'
import GroupableList from 'components/groupableList/groupableList'
import Grouping from 'components/groupableList/grouping'
import TextElement, { Type } from 'components/nav/mobile/textElement'
import { useTemporaryNavContext } from 'components/nav/store/context'
import { ToastContext } from 'components/toast/toastContext'
import DigitalContentList from 'components/digital_content/mobile/DigitalContentList'
import { useCollectionCoverArt } from 'hooks/useCollectionCoverArt'
import useHasChangedRoute from 'hooks/useHasChangedRoute'
import UploadStub from 'pages/profilePage/components/mobile/uploadStub'
import * as schemas from 'schemas'
import { AppState } from 'store/types'
import { resizeImage } from 'utils/imageProcessingUtil'
import { contentListPage } from 'utils/route'
import { withNullGuard } from 'utils/withNullGuard'

import styles from './EditContentListPage.module.css'
import RemoveContentListDigitalContentDrawer from './removeContentListDigitalContentDrawer'

const IS_NATIVE_MOBILE = process.env.REACT_APP_NATIVE_MOBILE

const messages = {
  createContentList: 'Create ContentList',
  editContentList: 'Edit ContentList',
  randomPhoto: 'Get Random Artwork',
  placeholderName: 'My ContentList',
  placeholderDescription: 'Give your contentList a description',
  toast: 'ContentList Created!'
}

const initialFormFields = {
  artwork: {},
  ...schemas.newCollectionMetadata()
}

type EditContentListPageProps = ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps>

const g = withNullGuard((props: EditContentListPageProps) => {
  const { account } = props
  if (account) return { ...props, account }
})

const EditContentListPage = g(
  ({
    close,
    goToRoute,
    account,
    createContentList,
    metadata,
    digitalContents,
    removeDigitalContent,
    editContentList,
    orderContentList,
    refreshLineup
  }) => {
    // Close the page if the route was changed
    useHasChangedRoute(close)
    const initialMetadata = {
      ...(metadata as Collection),
      artwork: { url: '' }
    }

    const { toast } = useContext(ToastContext)
    const [formFields, setFormFields] = useState(
      initialMetadata || initialFormFields
    )

    const [showRemoveDigitalContentDrawer, setShowRemoveDigitalContentDrawer] = useState(false)
    const onDrawerClose = () => setShowRemoveDigitalContentDrawer(false)

    // Holds all digitalContents to be removed on save
    const [removedDigitalContents, setRemovedDigitalContents] = useState<
      { timestamp: number; digitalContentId: ID }[]
    >([])

    // Holds digital_content to be removed if confirmed
    const [confirmRemoveDigitalContent, setConfirmRemoveDigitalContent] =
      useState<Nullable<{ title: string; digitalContentId: ID; timestamp: number }>>(
        null
      )

    // State to keep digital_content of reordering
    const [reorderedDigitalContents, setReorderedDigitalContents] = useState<number[]>([])
    const [hasReordered, setHasReordered] = useState(false)
    useEffect(() => {
      if (reorderedDigitalContents.length === 0 && digitalContents && digitalContents.length !== 0) {
        setReorderedDigitalContents(digitalContents.map((_: any, i: number) => i))
      }
    }, [setReorderedDigitalContents, reorderedDigitalContents, digitalContents])

    const existingImage = useCollectionCoverArt(
      formFields.content_list_id,
      formFields._cover_art_sizes,
      SquareSizes.SIZE_1000_BY_1000,
      '' // default
    )
    const [isProcessingImage, setIsProcessingImage] = useState(false)
    const [didChangeArtwork, setDidChangeArtwork] = useState(false)

    const onDropArtwork = useCallback(
      async (selectedFiles: any) => {
        try {
          let file = selectedFiles[0]
          file = await resizeImage(file)
          const url = URL.createObjectURL(file)
          setFormFields((formFields: any) => ({
            ...formFields,
            artwork: { file, url }
          }))
          setDidChangeArtwork(true)
        } catch (err) {
          setFormFields((formFields: any) => ({
            ...formFields,
            artwork: {
              ...(formFields.artwork || {}),
              error: err instanceof Error ? err.message : 'Unknown error'
            }
          }))
        }
      },
      [setFormFields]
    )

    const getRandomArtwork = useCallback(async () => {
      setIsProcessingImage(true)
      const value = await RandomImage.get()
      if (value) {
        await onDropArtwork([value])
      }
      setIsProcessingImage(false)
    }, [onDropArtwork, setIsProcessingImage])

    const onUpdateName = useCallback(
      (name: string) => {
        setFormFields((formFields: any) => ({
          ...formFields,
          content_list_name: name
        }))
      },
      [setFormFields]
    )

    const onUpdateDescription = useCallback(
      (description: string) => {
        setFormFields((formFields: any) => ({ ...formFields, description }))
      },
      [setFormFields]
    )

    const onReorderContentList = useCallback(
      (source: number, destination: number) => {
        const reorder = [...reorderedDigitalContents]
        const tmp = reorder[source]
        reorder.splice(source, 1)
        reorder.splice(destination, 0, tmp)

        setHasReordered(true)
        setReorderedDigitalContents(reorder)
      },
      [setHasReordered, reorderedDigitalContents, setReorderedDigitalContents]
    )

    const formatReorder = (
      digitalContentIds: { digital_content: ID; time: number }[],
      reorder: number[]
    ) => {
      return reorder.map((i) => {
        const { digital_content, time } = digitalContentIds[i]
        return {
          id: digital_content,
          time
        }
      })
    }

    const onSave = useCallback(() => {
      // Sanitize description field. Description is required to be present, but can be null
      if (formFields.description === undefined) {
        formFields.description = null
      }
      // Copy the metadata contentList contents so that a reference is not changed between
      // removing digitalContents, updating digital_content order, and edit contentList
      const contentListDigitalContentIds = [
        ...(metadata?.content_list_contents?.digital_content_ids ?? [])
      ]

      for (const removedDigitalContent of removedDigitalContents) {
        const { content_list_id } = metadata!
        removeDigitalContent(removedDigitalContent.digitalContentId, content_list_id, removedDigitalContent.timestamp)
      }

      if (metadata && formFields.content_list_id) {
        // Edit contentList
        if (hasReordered) {
          // Reorder the contentList and refresh the lineup just in case it's
          // in the view behind the edit contentList page.
          orderContentList(
            metadata.content_list_id,
            formatReorder(contentListDigitalContentIds, reorderedDigitalContents)
          )
          // Update the contentList content digital_content_ids so that the editContentList
          // optimistically update the cached collection digitalContentIds
          formFields.content_list_contents.digital_content_ids = reorderedDigitalContents.map(
            (idx) => contentListDigitalContentIds[idx]
          )
        }
        refreshLineup()
        editContentList(metadata.content_list_id, formFields)

        close()
      } else {
        // Create new contentList
        const tempId = `${Date.now()}`
        createContentList(tempId, formFields)
        toast(messages.toast)
        close()
        goToRoute(
          contentListPage(account.handle, formFields.content_list_name, tempId)
        )
      }
    }, [
      formFields,
      createContentList,
      close,
      account,
      goToRoute,
      metadata,
      editContentList,
      hasReordered,
      reorderedDigitalContents,
      orderContentList,
      refreshLineup,
      toast,
      removeDigitalContent,
      removedDigitalContents
    ])

    /**
     * Stores the digital_content to be removed if confirmed
     * Opens the drawer to confirm removal of the digital_content
     */
    const onRemoveDigitalContent = useCallback(
      (index: number) => {
        if ((metadata?.content_list_contents?.digital_content_ids.length ?? 0) <= index)
          return
        const reorderedIndex = reorderedDigitalContents[index]
        const { content_list_contents } = metadata!
        const { digital_content: digitalContentId, time } =
          content_list_contents.digital_content_ids[reorderedIndex]
        const digitalContentMetadata = digitalContents?.find(
          (digital_content) => digital_content.digital_content_id === digitalContentId
        )
        if (!digitalContentMetadata) return
        setConfirmRemoveDigitalContent({
          title: digitalContentMetadata.title,
          digitalContentId,
          timestamp: time
        })
        setShowRemoveDigitalContentDrawer(true)
      },
      [
        reorderedDigitalContents,
        setShowRemoveDigitalContentDrawer,
        metadata,
        digitalContents,
        setConfirmRemoveDigitalContent
      ]
    )

    /**
     * Moves the digital_content to be removed to the removedDigitalContents array
     * Closes the drawer to confirm removal of the digital_content
     */
    const onConfirmRemove = useCallback(() => {
      if (!confirmRemoveDigitalContent) return
      const removeIdx = metadata?.content_list_contents.digital_content_ids.findIndex(
        (t) =>
          t.digital_content === confirmRemoveDigitalContent.digitalContentId &&
          t.time === confirmRemoveDigitalContent.timestamp
      )
      if (removeIdx === -1) return
      setRemovedDigitalContents((removed) =>
        removed.concat({
          digitalContentId: confirmRemoveDigitalContent.digitalContentId,
          timestamp: confirmRemoveDigitalContent.timestamp
        })
      )
      setReorderedDigitalContents((digitalContents) =>
        digitalContents.filter((digitalContentIndex) => digitalContentIndex !== removeIdx)
      )
      onDrawerClose()
    }, [metadata, confirmRemoveDigitalContent, setRemovedDigitalContents, setReorderedDigitalContents])

    const setters = useCallback(
      () => ({
        left: (
          <TextElement text='Cancel' type={Type.SECONDARY} onClick={close} />
        ),
        center: formFields.content_list_id
          ? messages.editContentList
          : messages.createContentList,
        right: (
          <TextElement
            text='Save'
            type={Type.PRIMARY}
            isEnabled={!!formFields.content_list_name}
            onClick={onSave}
          />
        )
      }),
      [close, formFields, onSave]
    )

    useTemporaryNavContext(setters)

    // Put together digital_content list if necessary
    let digitalContentList = null
    if (digitalContents && reorderedDigitalContents.length > 0) {
      digitalContentList = reorderedDigitalContents.map((i) => {
        const t = digitalContents[i]
        const contentListDigitalContent = metadata?.content_list_contents.digital_content_ids[i]
        const isRemoveActive =
          showRemoveDigitalContentDrawer &&
          t.digital_content_id === confirmRemoveDigitalContent?.digitalContentId &&
          contentListDigitalContent?.time === confirmRemoveDigitalContent?.timestamp

        return {
          isLoading: false,
          landlordName: t.user.name,
          landlordHandle: t.user.handle,
          digitalContentTitle: t.title,
          digitalContentId: t.digital_content_id,
          time: contentListDigitalContent?.time,
          isDeleted: t.is_delete || !!t.user.is_deactivated,
          isRemoveActive
        }
      })
    }

    return (
      <div className={styles.editContentListPage}>
        <div className={styles.artwork}>
          <DynamicImage
            image={
              didChangeArtwork
                ? formFields.artwork.url
                : existingImage || formFields.artwork.url || placeholderCoverArt
            }
            className={styles.image}
            wrapperClassName={styles.imageWrapper}
          >
            {
              <UploadStub
                onChange={onDropArtwork}
                isProcessing={isProcessingImage}
              />
            }
          </DynamicImage>
          <div className={styles.random} onClick={getRandomArtwork}>
            <IconCamera className={styles.iconCamera} />
            <div className={styles.text}>{messages.randomPhoto}</div>
          </div>
        </div>

        <div className={styles.info}>
          <GroupableList>
            <Grouping>
              <EditableRow
                label='Name'
                format={Format.INPUT}
                initialValue={formFields.content_list_name}
                placeholderValue={messages.placeholderName}
                onChange={onUpdateName}
                maxLength={64}
              />
              <EditableRow
                label='Description'
                format={Format.TEXT_AREA}
                initialValue={formFields?.description ?? undefined}
                placeholderValue={messages.placeholderDescription}
                onChange={onUpdateDescription}
                centerLeftElement={false}
                maxLength={256}
              />
            </Grouping>
            {/** Don't render digitalContentlist on native mobile. Errors
             * get thrown because of the null renderer
             */}
            {!IS_NATIVE_MOBILE && digitalContentList && digitalContentList.length > 0 && (
              <Grouping>
                <DigitalContentList
                  digitalContents={digitalContentList}
                  showDivider
                  noDividerMargin
                  isReorderable
                  onRemove={onRemoveDigitalContent}
                  onReorder={onReorderContentList}
                />
              </Grouping>
            )}
          </GroupableList>
        </div>
        <RemoveContentListDigitalContentDrawer
          isOpen={showRemoveDigitalContentDrawer}
          digitalContentTitle={confirmRemoveDigitalContent?.title}
          onClose={onDrawerClose}
          onConfirm={onConfirmRemove}
        />
      </div>
    )
  }
)

function mapStateToProps(state: AppState) {
  return {
    metadata: getMetadata(state),
    account: getAccountUser(state),
    digitalContents: getDigitalContents(state)
  }
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    close: () => dispatch(createContentListActions.close()),
    createContentList: (tempId: string, metadata: Collection) =>
      dispatch(
        createContentList(tempId, metadata, CreateContentListSource.CREATE_PAGE)
      ),
    editContentList: (id: ID, metadata: Collection) =>
      dispatch(editContentList(id, metadata)),
    orderContentList: (contentListId: ID, idsAndTimes: any) =>
      dispatch(orderContentList(contentListId, idsAndTimes)),
    removeDigitalContent: (digitalContentId: ID, contentListId: ID, timestamp: number) =>
      dispatch(removeDigitalContentFromContentList(digitalContentId, contentListId, timestamp)),
    refreshLineup: () => dispatch(digitalContentsActions.fetchLineupMetadatas()),
    goToRoute: (route: string) => dispatch(pushRoute(route))
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(EditContentListPage)
