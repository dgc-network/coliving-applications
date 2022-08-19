import { useEffect, useState, useCallback, useContext } from 'react'

import {
  ID,
  CreatePlaylistSource,
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
  createPlaylist,
  editPlaylist,
  orderPlaylist,
  removeAgreementFromPlaylist
} from 'common/store/cache/collections/actions'
import { agreementsActions } from 'common/store/pages/collection/lineup/actions'
import * as createPlaylistActions from 'common/store/ui/createPlaylistModal/actions'
import {
  getMetadata,
  getAgreements
} from 'common/store/ui/createPlaylistModal/selectors'
import DynamicImage from 'components/dynamic-image/DynamicImage'
import EditableRow, { Format } from 'components/groupable-list/EditableRow'
import GroupableList from 'components/groupable-list/GroupableList'
import Grouping from 'components/groupable-list/Grouping'
import TextElement, { Type } from 'components/nav/mobile/TextElement'
import { useTemporaryNavContext } from 'components/nav/store/context'
import { ToastContext } from 'components/toast/ToastContext'
import AgreementList from 'components/agreement/mobile/AgreementList'
import { useCollectionCoverArt } from 'hooks/useCollectionCoverArt'
import useHasChangedRoute from 'hooks/useHasChangedRoute'
import UploadStub from 'pages/profile-page/components/mobile/UploadStub'
import * as schemas from 'schemas'
import { AppState } from 'store/types'
import { resizeImage } from 'utils/imageProcessingUtil'
import { playlistPage } from 'utils/route'
import { withNullGuard } from 'utils/withNullGuard'

import styles from './EditPlaylistPage.module.css'
import RemovePlaylistAgreementDrawer from './RemovePlaylistAgreementDrawer'

const IS_NATIVE_MOBILE = process.env.REACT_APP_NATIVE_MOBILE

const messages = {
  createPlaylist: 'Create Playlist',
  editPlaylist: 'Edit Playlist',
  randomPhoto: 'Get Random Artwork',
  placeholderName: 'My Playlist',
  placeholderDescription: 'Give your playlist a description',
  toast: 'Playlist Created!'
}

const initialFormFields = {
  artwork: {},
  ...schemas.newCollectionMetadata()
}

type EditPlaylistPageProps = ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps>

const g = withNullGuard((props: EditPlaylistPageProps) => {
  const { account } = props
  if (account) return { ...props, account }
})

const EditPlaylistPage = g(
  ({
    close,
    goToRoute,
    account,
    createPlaylist,
    metadata,
    agreements,
    removeAgreement,
    editPlaylist,
    orderPlaylist,
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
      formFields.playlist_id,
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
          playlist_name: name
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

    const onReorderPlaylist = useCallback(
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
      // Copy the metadata playlist contents so that a reference is not changed between
      // removing agreements, updating agreement order, and edit playlist
      const playlistAgreementIds = [
        ...(metadata?.playlist_contents?.agreement_ids ?? [])
      ]

      for (const removedAgreement of removedAgreements) {
        const { playlist_id } = metadata!
        removeAgreement(removedAgreement.agreementId, playlist_id, removedAgreement.timestamp)
      }

      if (metadata && formFields.playlist_id) {
        // Edit playlist
        if (hasReordered) {
          // Reorder the playlist and refresh the lineup just in case it's
          // in the view behind the edit playlist page.
          orderPlaylist(
            metadata.playlist_id,
            formatReorder(playlistAgreementIds, reorderedAgreements)
          )
          // Update the playlist content agreement_ids so that the editPlaylist
          // optimistically update the cached collection agreementIds
          formFields.playlist_contents.agreement_ids = reorderedAgreements.map(
            (idx) => playlistAgreementIds[idx]
          )
        }
        refreshLineup()
        editPlaylist(metadata.playlist_id, formFields)

        close()
      } else {
        // Create new playlist
        const tempId = `${Date.now()}`
        createPlaylist(tempId, formFields)
        toast(messages.toast)
        close()
        goToRoute(
          playlistPage(account.handle, formFields.playlist_name, tempId)
        )
      }
    }, [
      formFields,
      createPlaylist,
      close,
      account,
      goToRoute,
      metadata,
      editPlaylist,
      hasReordered,
      reorderedAgreements,
      orderPlaylist,
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
        if ((metadata?.playlist_contents?.agreement_ids.length ?? 0) <= index)
          return
        const reorderedIndex = reorderedAgreements[index]
        const { playlist_contents } = metadata!
        const { agreement: agreementId, time } =
          playlist_contents.agreement_ids[reorderedIndex]
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
      const removeIdx = metadata?.playlist_contents.agreement_ids.findIndex(
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
        center: formFields.playlist_id
          ? messages.editPlaylist
          : messages.createPlaylist,
        right: (
          <TextElement
            text='Save'
            type={Type.PRIMARY}
            isEnabled={!!formFields.playlist_name}
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
        const playlistAgreement = metadata?.playlist_contents.agreement_ids[i]
        const isRemoveActive =
          showRemoveAgreementDrawer &&
          t.agreement_id === confirmRemoveAgreement?.agreementId &&
          playlistAgreement?.time === confirmRemoveAgreement?.timestamp

        return {
          isLoading: false,
          artistName: t.user.name,
          artistHandle: t.user.handle,
          agreementTitle: t.title,
          agreementId: t.agreement_id,
          time: playlistAgreement?.time,
          isDeleted: t.is_delete || !!t.user.is_deactivated,
          isRemoveActive
        }
      })
    }

    return (
      <div className={styles.editPlaylistPage}>
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
                initialValue={formFields.playlist_name}
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
                  onReorder={onReorderPlaylist}
                />
              </Grouping>
            )}
          </GroupableList>
        </div>
        <RemovePlaylistAgreementDrawer
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
    close: () => dispatch(createPlaylistActions.close()),
    createPlaylist: (tempId: string, metadata: Collection) =>
      dispatch(
        createPlaylist(tempId, metadata, CreatePlaylistSource.CREATE_PAGE)
      ),
    editPlaylist: (id: ID, metadata: Collection) =>
      dispatch(editPlaylist(id, metadata)),
    orderPlaylist: (playlistId: ID, idsAndTimes: any) =>
      dispatch(orderPlaylist(playlistId, idsAndTimes)),
    removeAgreement: (agreementId: ID, playlistId: ID, timestamp: number) =>
      dispatch(removeAgreementFromPlaylist(agreementId, playlistId, timestamp)),
    refreshLineup: () => dispatch(agreementsActions.fetchLineupMetadatas()),
    goToRoute: (route: string) => dispatch(pushRoute(route))
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(EditPlaylistPage)
