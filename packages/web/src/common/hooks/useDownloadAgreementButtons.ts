import {
  ID,
  stemCategoryFriendlyNames,
  StemCategory,
  Agreement,
  StemAgreement
} from '@coliving/common'
import moment from 'moment'
import { useSelector as reduxUseSelector, shallowEqual } from 'react-redux'

import { CommonState } from 'common/store'
import { getHasAccount } from 'common/store/account/selectors'
import { getAgreement, getAgreements } from 'common/store/cache/agreements/selectors'
import { getCurrentUploads } from 'common/store/stems-upload/selectors'

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

type UseDownloadAgreementButtonsArgs = {
  following: boolean
  isOwner: boolean
  onDownload: (
    agreementID: number,
    cid: string,
    category?: string,
    parentAgreementId?: ID
  ) => void
  onNotLoggedInClick?: () => void
}

const messages = {
  getDownloadAgreement: (stemCount: number) => `${stemCount ? 'Original' : ''}`,
  getDownloadStem: (friendlyName: string, categoryCount: number) =>
    `${friendlyName} ${categoryCount || ''}`
}

const doesRequireFollow = (
  isOwner: boolean,
  following: boolean,
  agreement: Agreement
) => !isOwner && !following && agreement.download?.requires_follow

const useCurrentStems = ({
  agreementId,
  useSelector
}: {
  agreementId: ID
  useSelector: typeof reduxUseSelector
}) => {
  const agreement: Agreement | null = useSelector(
    (state: CommonState) => getAgreement(state, { id: agreementId }),
    shallowEqual
  )
  const stemIds = (agreement?._stems ?? []).map((s) => s.agreement_id)
  const stemAgreementsMap = useSelector(
    (state: CommonState) => getAgreements(state, { ids: stemIds }),
    shallowEqual
  ) as { [id: number]: StemAgreement }

  // Sort the stems, filter deletes
  const stemAgreements = Object.values(stemAgreementsMap)
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
      id: t.agreement_id
    }))
    .filter((t) => t.downloadURL)
  return { stemAgreements, agreement }
}

const useUploadingStems = ({
  agreementId,
  useSelector
}: {
  agreementId: ID
  useSelector: typeof reduxUseSelector
}) => {
  const currentUploads = useSelector(
    (state: CommonState) => getCurrentUploads(state, agreementId),
    shallowEqual
  )
  const uploadingAgreements = currentUploads.map((u) => ({
    category: u.category,
    downloadable: false
  }))
  return { uploadingAgreements }
}

const getFriendlyNames = (stems: Stem[]): LabeledStem[] => {
  // Make a map of counts of the shape { category: { count, index }}
  // where count is the number of occurences of a category, and index
  // agreements which instance you're pointing at when naming.
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
  parentAgreementId,
  stems,
  agreement
}: UseDownloadAgreementButtonsArgs & {
  isLoggedIn: boolean
  stems: LabeledStem[]
  parentAgreementId: ID
  agreement: Agreement
}) => {
  return stems.map((u) => {
    const state = (() => {
      if (!isLoggedIn) return ButtonState.LOG_IN_REQUIRED

      const requiresFollow = doesRequireFollow(isOwner, following, agreement)
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
          onDownload(id, downloadURL, u.label, parentAgreementId)
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
  agreement
}: UseDownloadAgreementButtonsArgs & {
  isLoggedIn: boolean
  agreement: Agreement | null
  stemButtonsLength: number
}) => {
  if (!agreement?.download?.is_downloadable) {
    return undefined
  }

  const label = messages.getDownloadAgreement(stemButtonsLength)
  const config: DownloadButtonConfig = {
    state: ButtonState.PROCESSING,
    label,
    type: ButtonType.AGREEMENT
  }

  const requiresFollow = doesRequireFollow(isOwner, following, agreement)
  if (isLoggedIn && requiresFollow) {
    return {
      ...config,
      state: ButtonState.REQUIRES_FOLLOW
    }
  }

  const { cid } = agreement.download
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
        onDownload(agreement.agreement_id, cid)
      }
    }
  }

  return config
}

export const useDownloadAgreementButtons = ({
  following,
  isOwner,
  onDownload,
  onNotLoggedInClick,
  agreementId,
  useSelector
}: UseDownloadAgreementButtonsArgs & {
  agreementId: ID
  useSelector: typeof reduxUseSelector
}) => {
  const isLoggedIn = useSelector(getHasAccount)

  // Get already uploaded stems and parent agreement
  const { stemAgreements, agreement } = useCurrentStems({ agreementId, useSelector })

  // Get the currently uploading stems
  const { uploadingAgreements } = useUploadingStems({ agreementId, useSelector })
  if (!agreement) return []

  // Combine uploaded and uploading stems
  const combinedStems = [...stemAgreements, ...uploadingAgreements] as Stem[]

  // Give the stems friendly names
  const combinedFriendly = getFriendlyNames(combinedStems)

  // Make buttons for stems
  const stemButtons = getStemButtons({
    following,
    isLoggedIn,
    isOwner,
    onDownload,
    onNotLoggedInClick,
    parentAgreementId: agreementId,
    stems: combinedFriendly,
    agreement
  })

  // Make download original button
  const originalAgreementButton = makeDownloadOriginalButton({
    following,
    isLoggedIn,
    isOwner,
    onDownload,
    onNotLoggedInClick,
    stemButtonsLength: stemButtons.length,
    agreement
  })

  return [...(originalAgreementButton ? [originalAgreementButton] : []), ...stemButtons]
}
