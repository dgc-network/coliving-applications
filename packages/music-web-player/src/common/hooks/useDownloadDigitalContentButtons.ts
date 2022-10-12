import {
  ID,
  stemCategoryFriendlyNames,
  StemCategory,
  DigitalContent,
  StemDigitalContent
} from '@coliving/common'
import moment from 'moment'
import { useSelector as reduxUseSelector, shallowEqual } from 'react-redux'

import { CommonState } from 'common/store'
import { getHasAccount } from 'common/store/account/selectors'
import { getDigitalContent, getDigitalContents } from 'common/store/cache/digital_contents/selectors'
import { getCurrentUploads } from 'common/store/stemsUpload/selectors'

export type DownloadButtonConfig = {
  state: ButtonState
  type: ButtonType
  label: string
  onClick?: () => void
}

export enum ButtonState {
  PROCESSING,
  LOG_IN_REQUIRED,
  DOWNLOADABLE,
  REQUIRES_FOLLOW
}

export enum ButtonType {
  STEM,
  AGREEMENT
}

type Stem = {
  category: StemCategory
  downloadable: boolean
  downloadURL?: string
  id?: ID
}

type LabeledStem = Omit<Stem, 'category'> & { label: string }

type UseDownloadDigitalContentButtonsArgs = {
  following: boolean
  isOwner: boolean
  onDownload: (
    digitalContentID: number,
    cid: string,
    category?: string,
    parentDigitalContentId?: ID
  ) => void
  onNotLoggedInClick?: () => void
}

const messages = {
  getDownloadDigitalContent: (stemCount: number) => `${stemCount ? 'Original' : ''}`,
  getDownloadStem: (friendlyName: string, categoryCount: number) =>
    `${friendlyName} ${categoryCount || ''}`
}

const doesRequireFollow = (
  isOwner: boolean,
  following: boolean,
  digital_content: DigitalContent
) => !isOwner && !following && digital_content.download?.requires_follow

const useCurrentStems = ({
  digitalContentId,
  useSelector
}: {
  digitalContentId: ID
  useSelector: typeof reduxUseSelector
}) => {
  const digital_content: DigitalContent | null = useSelector(
    (state: CommonState) => getDigitalContent(state, { id: digitalContentId }),
    shallowEqual
  )
  const stemIds = (digital_content?._stems ?? []).map((s) => s.digital_content_id)
  const stemDigitalContentsMap = useSelector(
    (state: CommonState) => getDigitalContents(state, { ids: stemIds }),
    shallowEqual
  ) as { [id: number]: StemDigitalContent }

  // Sort the stems, filter deletes
  const stemDigitalContents = Object.values(stemDigitalContentsMap)
    .filter((t) => !t._marked_deleted && !t.is_delete)
    .sort(
      (a, b) =>
        moment(a.created_at).milliseconds() -
        moment(b.created_at).milliseconds()
    )
    .map((t) => ({
      downloadURL: t.download?.cid,
      category: t.stem_of.category,
      downloadable: true,
      id: t.digital_content_id
    }))
    .filter((t) => t.downloadURL)
  return { stemDigitalContents, digital_content }
}

const useUploadingStems = ({
  digitalContentId,
  useSelector
}: {
  digitalContentId: ID
  useSelector: typeof reduxUseSelector
}) => {
  const currentUploads = useSelector(
    (state: CommonState) => getCurrentUploads(state, digitalContentId),
    shallowEqual
  )
  const uploadingDigitalContents = currentUploads.map((u) => ({
    category: u.category,
    downloadable: false
  }))
  return { uploadingDigitalContents }
}

const getFriendlyNames = (stems: Stem[]): LabeledStem[] => {
  // Make a map of counts of the shape { category: { count, index }}
  // where count is the number of occurences of a category, and index
  // digitalContents which instance you're pointing at when naming.
  const catCounts = stems.reduce((acc, cur) => {
    const { category } = cur
    if (!acc[category]) {
      acc[category] = { count: 0, index: 0 }
    }
    acc[category].count += 1
    return acc
  }, {} as { [category: string]: { count: number; index: number } })

  return stems.map((t) => {
    const friendlyName = stemCategoryFriendlyNames[t.category]
    let label
    const counts = catCounts[t.category]
    if (counts.count <= 1) {
      label = messages.getDownloadStem(friendlyName, 0)
    } else {
      counts.index += 1
      label = messages.getDownloadStem(friendlyName, counts.index)
    }

    return {
      downloadURL: t.downloadURL,
      downloadable: t.downloadable,
      label,
      id: t.id
    }
  })
}

const getStemButtons = ({
  following,
  isLoggedIn,
  isOwner,
  onDownload,
  onNotLoggedInClick,
  parentDigitalContentId,
  stems,
  digital_content
}: UseDownloadDigitalContentButtonsArgs & {
  isLoggedIn: boolean
  stems: LabeledStem[]
  parentDigitalContentId: ID
  digital_content: DigitalContent
}) => {
  return stems.map((u) => {
    const state = (() => {
      if (!isLoggedIn) return ButtonState.LOG_IN_REQUIRED

      const requiresFollow = doesRequireFollow(isOwner, following, digital_content)
      if (requiresFollow) return ButtonState.REQUIRES_FOLLOW

      return u.downloadable ? ButtonState.DOWNLOADABLE : ButtonState.PROCESSING
    })()

    const onClick = (() => {
      const { downloadURL, id } = u
      if (downloadURL !== undefined && id !== undefined)
        return () => {
          if (!isLoggedIn) {
            onNotLoggedInClick?.()
          }
          onDownload(id, downloadURL, u.label, parentDigitalContentId)
        }
    })()

    return {
      label: u.label,
      downloadURL: u.downloadURL,
      type: ButtonType.STEM,
      state,
      onClick
    }
  })
}

const makeDownloadOriginalButton = ({
  following,
  isLoggedIn,
  isOwner,
  onNotLoggedInClick,
  onDownload,
  stemButtonsLength,
  digital_content
}: UseDownloadDigitalContentButtonsArgs & {
  isLoggedIn: boolean
  digital_content: DigitalContent | null
  stemButtonsLength: number
}) => {
  if (!digital_content?.download?.is_downloadable) {
    return undefined
  }

  const label = messages.getDownloadDigitalContent(stemButtonsLength)
  const config: DownloadButtonConfig = {
    state: ButtonState.PROCESSING,
    label,
    type: ButtonType.AGREEMENT
  }

  const requiresFollow = doesRequireFollow(isOwner, following, digital_content)
  if (isLoggedIn && requiresFollow) {
    return {
      ...config,
      state: ButtonState.REQUIRES_FOLLOW
    }
  }

  const { cid } = digital_content.download
  if (cid) {
    return {
      ...config,
      state: isLoggedIn
        ? ButtonState.DOWNLOADABLE
        : ButtonState.LOG_IN_REQUIRED,
      onClick: () => {
        if (!isLoggedIn) {
          onNotLoggedInClick?.()
        }
        onDownload(digital_content.digital_content_id, cid)
      }
    }
  }

  return config
}

export const useDownloadDigitalContentButtons = ({
  following,
  isOwner,
  onDownload,
  onNotLoggedInClick,
  digitalContentId,
  useSelector
}: UseDownloadDigitalContentButtonsArgs & {
  digitalContentId: ID
  useSelector: typeof reduxUseSelector
}) => {
  const isLoggedIn = useSelector(getHasAccount)

  // Get already uploaded stems and parent digital_content
  const { stemDigitalContents, digital_content } = useCurrentStems({ digitalContentId, useSelector })

  // Get the currently uploading stems
  const { uploadingDigitalContents } = useUploadingStems({ digitalContentId, useSelector })
  if (!digital_content) return []

  // Combine uploaded and uploading stems
  const combinedStems = [...stemDigitalContents, ...uploadingDigitalContents] as Stem[]

  // Give the stems friendly names
  const combinedFriendly = getFriendlyNames(combinedStems)

  // Make buttons for stems
  const stemButtons = getStemButtons({
    following,
    isLoggedIn,
    isOwner,
    onDownload,
    onNotLoggedInClick,
    parentDigitalContentId: digitalContentId,
    stems: combinedFriendly,
    digital_content
  })

  // Make download original button
  const originalDigitalContentButton = makeDownloadOriginalButton({
    following,
    isLoggedIn,
    isOwner,
    onDownload,
    onNotLoggedInClick,
    stemButtonsLength: stemButtons.length,
    digital_content
  })

  return [...(originalDigitalContentButton ? [originalDigitalContentButton] : []), ...stemButtons]
}
