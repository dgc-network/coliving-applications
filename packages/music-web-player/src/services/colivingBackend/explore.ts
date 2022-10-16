import { ID, Collection, FeedFilter, DigitalContent, UserDigitalContent } from '@coliving/common'

import ColivingBackend, {
  IDENTITY_SERVICE,
  AuthHeaders
} from 'services/colivingBackend'
import apiClient from 'services/colivingAPIClient/colivingAPIClient'

type CollectionWithScore = Collection & { score: number }

// @ts-ignore
const libs = () => window.colivingLibs

const scoreComparator = <T extends { score: number }>(a: T, b: T) =>
  b.score - a.score

type TopUserListen = {
  userId: number
  digitalContentId: number
}

type UserListens = {
  [key: number]: number
}

class Explore {
  /** DIGITAL_CONTENTS ENDPOINTS */
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

  static async getUserListens(digitalContentIds: ID[]): Promise<UserListens> {
    try {
      const { data, signature } = await ColivingBackend.signData()
      const idQuery = digitalContentIds.map((id) => `&digitalContentIdList=${id}`).join('')
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

  static async getTopFolloweeDigitalContentsFromWindow(
    window: string,
    limit = 25
  ): Promise<UserDigitalContent[]> {
    try {
      const digitalContents = await libs().discoveryNode.getTopFolloweeWindowed(
        'digital_content',
        window,
        limit,
        true
      )
      return digitalContents
    } catch (e) {
      console.error(e)
      return []
    }
  }

  static async getFeedNotListenedTo(limit = 25) {
    try {
      const digitalContents: UserDigitalContent[] = await ColivingBackend.getSocialFeed({
        filter: FeedFilter.ORIGINAL,
        offset: 0,
        limit: 100,
        withUsers: true,
        digitalContentsOnly: true
      })
      const digitalContentIds = digitalContents
        .map((digital_content: DigitalContent) => digital_content.digital_content_id)
        .filter(Boolean)
      const listens: any = await Explore.getUserListens(digitalContentIds)

      const notListenedToDigitalContents = digitalContents.filter(
        (digital_content: DigitalContent) => !listens[digital_content.digital_content_id]
      )
      return notListenedToDigitalContents.slice(0, limit)
    } catch (e) {
      console.error(e)
      return []
    }
  }

  static async getRemixables(currentUserId: ID, limit = 25) {
    try {
      const digitalContents = await apiClient.getRemixables({
        limit,
        currentUserId
      })

      return digitalContents
    } catch (e) {
      console.error(e)
      return []
    }
  }

  static async getTopFolloweeSaves(limit = 25) {
    try {
      const digitalContents: UserDigitalContent[] =
        await libs().discoveryNode.getTopFolloweeSaves('digital_content', limit, true)
      return digitalContents
    } catch (e) {
      console.error(e)
      return []
    }
  }

  static async getLatestDigitalContentID(): Promise<number> {
    try {
      const latestDigitalContentID = await libs().discoveryNode.getLatest('digital_content')
      return latestDigitalContentID
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
