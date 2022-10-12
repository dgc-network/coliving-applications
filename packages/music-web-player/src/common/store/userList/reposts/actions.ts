import { ID } from '@coliving/common'
import { createCustomAction } from 'typesafe-actions'

import { RepostType } from './types'

export const SET_REPOST = 'REPOSTING_USER_PAGE/SET_REPOST'
export const GET_AGREEMENT_REPOST_ERROR =
  'REPOSTING_USER_PAGE/GET_AGREEMENT_REPOST_ERROR'
export const GET_CONTENT_LIST_REPOST_ERROR =
  'REPOSTING_USER_PAGE/GET_CONTENT_LIST_REPOST_ERROR'

export const setRepost = createCustomAction(
  SET_REPOST,
  (id: ID, repostType: RepostType) => ({ id, repostType })
)
export const digitalContentRepostError = createCustomAction(
  GET_AGREEMENT_REPOST_ERROR,
  (id: ID, error: string) => ({ id, error })
)
export const contentListRepostError = createCustomAction(
  GET_CONTENT_LIST_REPOST_ERROR,
  (id: ID, error: string) => ({ id, error })
)
