import Coliving from 'services/coliving'
import { useSelector, useDispatch } from 'react-redux'
import { ThunkAction } from 'redux-thunk'
import { Action } from 'redux'
import AppState from 'store/types'
import { ContentList, DigitalContent } from 'types'
import { useEffect, useState } from 'react'
import imageBlank from 'assets/img/imageBlank2x.png'
import {
  MusicError,
  setTopAlbums,
  setTopContentLists,
  setTopAgreements
} from './slice'
import { fetchWithLibs } from '../../../utils/fetch'

const COLIVING_URL = process.env.REACT_APP_COLIVING_URL

// -------------------------------- Selectors  ---------------------------------

export const getTopAgreements = (state: AppState) => state.cache.music.topAgreements
export const getTopContentLists = (state: AppState) =>
  state.cache.music.topContentLists
export const getTopAlbums = (state: AppState) => state.cache.music.topAlbums

// -------------------------------- Thunk Actions  ---------------------------------

export function fetchTopAgreements(): ThunkAction<
  void,
  AppState,
  Coliving,
  Action<string>
> {
  return async (dispatch, _, aud) => {
    try {
      await aud.awaitSetup()
      const data = await fetchWithLibs({
        endpoint: '/v1/agreements/trending',
        queryParams: { limit: 4 }
      })
      const agreements: DigitalContent[] = data.slice(0, 4).map((d: any) => ({
        title: d.title,
        handle: d.user.handle,
        artwork: d.artwork?.['480x480'] ?? imageBlank,
        url: `${COLIVING_URL}/agreements/${d.id}`,
        userUrl: `${COLIVING_URL}/users/${d.user.id}`
      }))
      dispatch(setTopAgreements({ agreements }))
    } catch (e) {
      dispatch(setTopAgreements({ agreements: MusicError.ERROR }))
      console.error(e)
    }
  }
}

export function fetchTopContentLists(): ThunkAction<
  void,
  AppState,
  Coliving,
  Action<string>
> {
  return async (dispatch, _, aud) => {
    try {
      await aud.awaitSetup()
      const limit = 5
      const data = await fetchWithLibs({
        endpoint: '/v1/full/contentLists/trending'
      })
      const contentLists: ContentList[] = data.slice(0, limit).map((d: any) => ({
        title: d.content_list_name,
        handle: d.user.handle,
        artwork: d.artwork?.['480x480'] ?? imageBlank,
        plays: d.total_play_count,
        url: `${COLIVING_URL}/contentLists/${d.id}`
      }))
      dispatch(setTopContentLists({ contentLists }))
    } catch (e) {
      console.error(e)
      dispatch(setTopContentLists({ contentLists: MusicError.ERROR }))
    }
  }
}

export function fetchTopAlbums(): ThunkAction<
  void,
  AppState,
  Coliving,
  Action<string>
> {
  return async (dispatch, _, aud) => {
    try {
      await aud.awaitSetup()
      const data = await fetchWithLibs({
        endpoint: '/v1/full/contentLists/top',
        queryParams: { type: 'album', limit: 5 }
      })
      const albums: ContentList[] = data.map((d: any) => ({
        title: d.content_list_name,
        handle: d.user.handle,
        artwork: d.artwork?.['480x480'] ?? imageBlank,
        plays: d.total_play_count,
        url: `${COLIVING_URL}/contentLists/${d.id}`
      }))
      dispatch(setTopAlbums({ albums }))
    } catch (e) {
      console.error(e)
      dispatch(setTopAlbums({ albums: MusicError.ERROR }))
    }
  }
}

// -------------------------------- Hooks  --------------------------------

export const useTopAgreements = () => {
  const [doOnce, setDoOnce] = useState(false)
  const topAgreements = useSelector(getTopAgreements)
  const dispatch = useDispatch()

  useEffect(() => {
    if (!doOnce && !topAgreements) {
      setDoOnce(true)
      dispatch(fetchTopAgreements())
    }
  }, [doOnce, topAgreements, dispatch])

  useEffect(() => {
    if (topAgreements) {
      setDoOnce(false)
    }
  }, [topAgreements, setDoOnce])

  return { topAgreements }
}

export const useTopContentLists = () => {
  const [doOnce, setDoOnce] = useState(false)
  const topContentLists = useSelector(getTopContentLists)
  const dispatch = useDispatch()

  useEffect(() => {
    if (!doOnce && !topContentLists) {
      setDoOnce(true)
      dispatch(fetchTopContentLists())
    }
  }, [topContentLists, dispatch, doOnce])

  useEffect(() => {
    if (topContentLists) {
      setDoOnce(false)
    }
  }, [topContentLists, setDoOnce])

  return { topContentLists }
}

export const useTopAlbums = () => {
  const [doOnce, setDoOnce] = useState(false)
  const topAlbums = useSelector(getTopAlbums)
  const dispatch = useDispatch()

  useEffect(() => {
    if (!doOnce && !topAlbums) {
      setDoOnce(true)
      dispatch(fetchTopAlbums())
    }
  }, [topAlbums, dispatch, doOnce])

  useEffect(() => {
    if (topAlbums) {
      setDoOnce(false)
    }
  }, [topAlbums, setDoOnce])

  return { topAlbums }
}
