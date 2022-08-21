import { ID, Collection, FeedFilter, Agreement, UserAgreement } from '@coliving/common'

import ColivingBackend, {
  IDENTITY_SERVICE,
  AuthHeaders
} from 'services/ColivingBackend'
import apiClient from 'services/coliving-api-client/ColivingAPIClient'

type CollectionWithScore = Collection & { score: number }

// @ts-ignore
const libs = () => window.colivingLibs

const scoreComparator = <T extends { score: number }>(a: T, b: T) =>
  b.score - a.score

type TopUserListen = {
  userId: number
  agreementId: number
}

type UserListens = {
  [key: number]: number
}

class Explore {
  /** AGREEMENTS ENDPOINTS */
  static async getTopUserListens(): Promise<TopUserListen[]> {
    try {
      const { data, signature } = await ColivingBackend.signData()
      return fetch(`${IDENTITY_SERVICE}/users/listens/top`, {
        headers: {
          [AuthHeaders.Message]: data,
          [AuthHeaders.Signature]: signature
        }
      })
        .then((res) => res.json())
        .then((res) => res.listens)
    } catch (e) {
      console.error(e)
      return []
    }
  }

  static async getUserListens(agreementIds: ID[]): Promise<UserListens> {
    try {
      const { data, signature } = await ColivingBackend.signData()
      const idQuery = agreementIds.map((id) => `&agreementIdList=${id}`).join('')
      return fetch(`${IDENTITY_SERVICE}/users/listens?${idQuery}`, {
        headers: {
          [AuthHeaders.Message]: data,
          [AuthHeaders.Signature]: signature
        }
      })
        .then((res) => res.json())
        .then((res) => res.listenMap)
    } catch (e) {
      console.error(e)
      return {}
    }
  }

  static async getTopFolloweeAgreementsFromWindow(
    window: string,
    limit = 25
  ): Promise<UserAgreement[]> {
    try {
      const agreements = await libs().discoveryNode.getTopFolloweeWindowed(
        'agreement',
        window,
        limit,
        true
      )
      return agreements
    } catch (e) {
      console.error(e)
      return []
    }
  }

  static async getFeedNotListenedTo(limit = 25) {
    try {
      const agreements: UserAgreement[] = await ColivingBackend.getSocialFeed({
        filter: FeedFilter.ORIGINAL,
        offset: 0,
        limit: 100,
        withUsers: true,
        agreementsOnly: true
      })
      const agreementIds = agreements
        .map((agreement: Agreement) => agreement.agreement_id)
        .filter(Boolean)
      const listens: any = await Explore.getUserListens(agreementIds)

      const notListenedToAgreements = agreements.filter(
        (agreement: Agreement) => !listens[agreement.agreement_id]
      )
      return notListenedToAgreements.slice(0, limit)
    } catch (e) {
      console.error(e)
      return []
    }
  }

  static async getRemixables(currentUserId: ID, limit = 25) {
    try {
      const agreements = await apiClient.getRemixables({
        limit,
        currentUserId
      })

      return agreements
    } catch (e) {
      console.error(e)
      return []
    }
  }

  static async getTopFolloweeSaves(limit = 25) {
    try {
      const agreements: UserAgreement[] =
        await libs().discoveryNode.getTopFolloweeSaves('agreement', limit, true)
      return agreements
    } catch (e) {
      console.error(e)
      return []
    }
  }

  static async getLatestAgreementID(): Promise<number> {
    try {
      const latestAgreementID = await libs().discoveryNode.getLatest('agreement')
      return latestAgreementID
    } catch (e) {
      console.error(e)
      return 0
    }
  }

  /** CONTENT_LIST ENDPOINTS */
  static async getTopCollections(
    type?: 'contentList' | 'album',
    followeesOnly?: boolean,
    limit = 20
  ): Promise<Collection[]> {
    try {
      const contentLists = await libs().discoveryNode.getTopContentLists(
        type,
        limit,
        undefined,
        followeesOnly ? 'followees' : undefined,
        true
      )
      return contentLists
    } catch (e) {
      console.error(e)
      return []
    }
  }

  static async getTopContentListsForMood(
    moods: string[],
    limit = 16
  ): Promise<Collection[]> {
    try {
      const requests = moods.map((mood) => {
        return libs().discoveryNode.getTopContentLists(
          'contentList',
          limit,
          mood,
          undefined,
          true
        )
      })
      const contentListsByMood = await Promise.all(requests)

      let allContentLists: CollectionWithScore[] = []
      contentListsByMood.forEach((contentLists) => {
        allContentLists = allContentLists.concat(contentLists)
      })
      return allContentLists.sort(scoreComparator).slice(0, 20)
    } catch (e) {
      console.error(e)
      return []
    }
  }
}

export default Explore
