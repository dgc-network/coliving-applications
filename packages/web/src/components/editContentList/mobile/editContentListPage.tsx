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
  removeAgreementFromContentList
} from 'common/store/cache/collections/actions'
import { agreementsActions } from 'common/store/pages/collection/lineup/actions'
import * as createContentListActions from 'common/store/ui/createContentListModal/actions'
import {
  getMetadata,
  getAgreements
} from 'common/store/ui/createContentListModal/selectors'
import DynamicImage from 'components/dynamicImage/dynamicImage'
import EditableRow, { Format } from 'components/groupableList/editableRow'
import GroupableList from 'components/groupableList/groupableList'
import Grouping from 'components/groupableList/grouping'
import TextElement, { Type } from 'components/nav/mobile/textElement'
import { useTemporaryNavContext } from 'components/nav/store/context'
import { ToastContext } from 'components/toast/toastContext'
import AgreementList from 'components/agreement/mobile/AgreementList'
import { useCollectionCoverArt } from 'hooks/useCollectionCoverArt'
import useHasChangedRoute from 'hooks/useHasChangedRoute'
import UploadStub from 'pages/profilePage/components/mobile/uploadStub'
import * as schemas from 'schemas'
import { AppState } from 'store/types'
import { resizeImage } from 'utils/imageProcessingUtil'
import { contentListPage } from 'utils/route'
import { withNullGuard } from 'utils/withNullGuard'

import styles from './EditContentListPage.module.css'
import RemoveContentListAgreementDrawer from './removeContentListAgreementDrawer'

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
    agreements,
    removeAgreement,
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

    const [showRemoveAgreementDrawer, setShowRemoveAgreementDrawer] = useState(false)
    const onDrawerClose = () => setShowRemoveAgreementDrawer(false)

    // Holds all agreements to be removed on save
    const [removedAgreements, setRemovedAgreements] = useState<
      { timestamp: number; agreementId: ID }[]
    >([])

    // Holds agreement to be removed if confirmed
    const [confirmRemoveAgreement, setConfirmRemoveAgreement] =
      useState<Nullable<{ title: string; agreementId: ID; timestamp: number }>>(
        null
      )

    // State to keep agreement of reordering
    const [reorderedAgreements, setReorderedAgreements] = useState<number[]>([])
    const [hasReordered, setHasReordered] = useState(false)
    useEffect(() => {
      if (reorderedAgreements.length === 0 && agreements && agreements.length !== 0) {
        setReorderedAgreements(agreements.map((_: any, i: number) => i))
      }
    }, [setReorderedAgreements, reorderedAgreements, agreements])

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
        const reorder = [...reorderedAgreements]
        const tmp = reorder[source]
        reorder.splice(source, 1)
        reorder.splice(destination, 0, tmp)

        setHasReordered(true)
        setReorderedAgreements(reorder)
      },
      [setHasReordered, reorderedAgreements, setReorderedAgreements]
    )

    const formatReorder = (
      agreementIds: { agreement: ID; time: number }[],
      reorder: number[]
    ) => {
      return reorder.map((i) => {
        const { agreement, time } = agreementIds[i]
        return {
          id: agreement,
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
      // removing agreements, updating agreement order, and edit contentList
      const contentListAgreementIds = [
        ...(metadata?.content_list_contents?.agreement_ids ?? [])
      ]

      for (const removedAgreement of removedAgreements) {
        const { content_list_id } = metadata!
        removeAgreement(removedAgreement.agreementId, content_list_id, removedAgreement.timestamp)
      }

      if (metadata && formFields.content_list_id) {
        // Edit contentList
        if (hasReordered) {
          // Reorder the contentList and refresh the lineup just in case it's
          // in the view behind the edit contentList page.
          orderContentList(
            metadata.content_list_id,
            formatReorder(contentListAgreementIds, reorderedAgreements)
          )
          // Update the contentList content agreement_ids so that the editContentList
          // optimistically update the cached collection agreementIds
          formFields.content_list_contents.agreement_ids = reorderedAgreements.map(
            (idx) => contentListAgreementIds[idx]
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
      reorderedAgreements,
      orderContentList,
      refreshLineup,
      toast,
      removeAgreement,
      removedAgreements
    ])

    /**
     * Stores the agreement to be removed if confirmed
     * Opens the drawer to confirm removal of the agreement
     */
    const onRemoveAgreement = useCallback(
      (index: number) => {
        if ((metadata?.content_list_contents?.agreement_ids.length ?? 0) <= index)
          return
        const reorderedIndex = reorderedAgreements[index]
        const { content_list_contents } = metadata!
        const { agreement: agreementId, time } =
          content_list_contents.agreement_ids[reorderedIndex]
        const agreementMetadata = agreements?.find(
          (agreement) => agreement.agreement_id === agreementId
        )
        if (!agreementMetadata) return
        setConfirmRemoveAgreement({
          title: agreementMetadata.title,
          agreementId,
          timestamp: time
        })
        setShowRemoveAgreementDrawer(true)
      },
      [
        reorderedAgreements,
        setShowRemoveAgreementDrawer,
        metadata,
        agreements,
        setConfirmRemoveAgreement
      ]
    )

    /**
     * Moves the agreement to be removed to the removedAgreements array
     * Closes the drawer to confirm removal of the agreement
     */
    const onConfirmRemove = useCallback(() => {
      if (!confirmRemoveAgreement) return
      const removeIdx = metadata?.content_list_contents.agreement_ids.findIndex(
        (t) =>
          t.agreement === confirmRemoveAgreement.agreementId &&
          t.time === confirmRemoveAgreement.timestamp
      )
      if (removeIdx === -1) return
      setRemovedAgreements((removed) =>
        removed.concat({
          agreementId: confirmRemoveAgreement.agreementId,
          timestamp: confirmRemoveAgreement.timestamp
        })
      )
      setReorderedAgreements((agreements) =>
        agreements.filter((agreementIndex) => agreementIndex !== removeIdx)
      )
      onDrawerClose()
    }, [metadata, confirmRemoveAgreement, setRemovedAgreements, setReorderedAgreements])

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

    // Put together agreement list if necessary
    let agreementList = null
    if (agreements && reorderedAgreements.length > 0) {
      agreementList = reorderedAgreements.map((i) => {
        const t = agreements[i]
        const contentListAgreement = metadata?.content_list_contents.agreement_ids[i]
        const isRemoveActive =
          showRemoveAgreementDrawer &&
          t.agreement_id === confirmRemoveAgreement?.agreementId &&
          contentListAgreement?.time === confirmRemoveAgreement?.timestamp

        return {
          isLoading: false,
          landlordName: t.user.name,
          landlordHandle: t.user.handle,
          agreementTitle: t.title,
          agreementId: t.agreement_id,
          time: contentListAgreement?.time,
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
            {/** Don't render agreementlist on native mobile. Errors
             * get thrown because of the null renderer
             */}
            {!IS_NATIVE_MOBILE && agreementList && agreementList.length > 0 && (
              <Grouping>
                <AgreementList
                  agreements={agreementList}
                  showDivider
                  noDividerMargin
                  isReorderable
                  onRemove={onRemoveAgreement}
                  onReorder={onReorderContentList}
                />
              </Grouping>
            )}
          </GroupableList>
        </div>
        <RemoveContentListAgreementDrawer
          isOpen={showRemoveAgreementDrawer}
          agreementTitle={confirmRemoveAgreement?.title}
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
    agreements: getAgreements(state)
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
    removeAgreement: (agreementId: ID, contentListId: ID, timestamp: number) =>
      dispatch(removeAgreementFromContentList(agreementId, contentListId, timestamp)),
    refreshLineup: () => dispatch(agreementsActions.fetchLineupMetadatas()),
    goToRoute: (route: string) => dispatch(pushRoute(route))
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(EditContentListPage)
