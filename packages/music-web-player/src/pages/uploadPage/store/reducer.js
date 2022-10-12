import {
  TOGGLE_MULTI_AGREEMENT_NOTIFICATION,
  UPLOAD_AGREEMENTS_REQUESTED,
  UPLOAD_AGREEMENTS_SUCCEEDED,
  UPLOAD_AGREEMENTS_FAILED,
  UPLOAD_SINGLE_AGREEMENT_FAILED,
  UPDATE_PROGRESS,
  RESET,
  RESET_STATE,
  UNDO_RESET_STATE
} from './actions'

const initialState = {
  openMultiDigitalContentNotification: true,
  digitalContents: null,
  metadata: null,
  uploadType: null,
  stems: [],
  uploading: false,
  uploadProgress: null,
  success: false,
  shouldReset: false,

  // For multidigitalContent upload, we allow some digitalContents to
  // fail without aborting the whole thing
  failedDigitalContentIndices: [],

  // Id to take the user to after completing upload.
  // Can be either a digital_content or contentList/album.
  completionId: null
}

const actionsMap = {
  [TOGGLE_MULTI_AGREEMENT_NOTIFICATION](state, action) {
    return {
      ...state,
      openMultiDigitalContentNotification: action.open
    }
  },
  [UPLOAD_AGREEMENTS_REQUESTED](state, action) {
    const newState = { ...state }
    newState.uploading = true
    newState.digitalContents = action.digitalContents
    newState.uploadProgress = action.digitalContents.map((t) => ({}))
    newState.metadata = action.metadata
    newState.uploadType = action.uploadType
    newState.stems = action.stems
    return newState
  },
  [UPLOAD_AGREEMENTS_SUCCEEDED](state, action) {
    const newState = { ...state }
    newState.uploading = false
    newState.success = true
    newState.completionId = action.id
    newState.uploadType = null
    newState.stems = []

    // Update the upload digitalContents with resulting metadata. This is used for TikTok sharing
    if (action.digitalContentMetadatas) {
      newState.digitalContents = state.digitalContents.map((t, i) => ({
        ...t,
        metadata: action.digitalContentMetadatas[i]
      }))
    }
    return newState
  },
  [UPLOAD_AGREEMENTS_FAILED](state, action) {
    const newState = { ...state }
    newState.uploading = false
    newState.uploadType = null
    newState.digitalContents = null
    newState.metadata = null
    newState.stems = []
    return newState
  },
  [UPDATE_PROGRESS](state, action) {
    const newState = { ...state }
    newState.uploadProgress = [...state.uploadProgress]
    newState.uploadProgress[action.index] = {
      ...newState.uploadProgress[action.index],
      ...action.progress
    }
    return newState
  },
  [RESET](state, action) {
    return {
      ...initialState,
      openMultiDigitalContentNotification: state.openMultiDigitalContentNotification
    }
  },
  [RESET_STATE](state) {
    return {
      ...state,
      shouldReset: true
    }
  },
  [UNDO_RESET_STATE](state) {
    return {
      ...state,
      shouldReset: false
    }
  },
  [UPLOAD_SINGLE_AGREEMENT_FAILED](state, action) {
    return {
      ...state,
      failedDigitalContentIndices: [...state.failedDigitalContentIndices, action.index]
    }
  }
}

export default function upload(state = initialState, action) {
  const matchingReduceFunction = actionsMap[action.type]
  if (!matchingReduceFunction) return state
  return matchingReduceFunction(state, action)
}
