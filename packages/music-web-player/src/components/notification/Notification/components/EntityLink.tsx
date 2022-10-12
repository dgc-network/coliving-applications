import { MouseEventHandler, useCallback } from 'react'

import { Name, Collection, DigitalContent, User, Nullable } from '@coliving/common'
import { push } from 'connected-react-router'
import { useDispatch } from 'react-redux'

import { Entity } from 'common/store/notifications/types'
import { useRecord, make } from 'store/analytics/actions'

import { getEntityLink } from '../utils'

import styles from './entityLink.module.css'

type EntityType = (Collection | DigitalContent) & { user: Nullable<User> }

type EntityLinkProps = {
  entity: EntityType
  entityType: Entity
}

export const useGoToEntity = (
  entity: Nullable<EntityType>,
  entityType: Entity
) => {
  const dispatch = useDispatch()
  const record = useRecord()

  const handleClick: MouseEventHandler = useCallback(
    (event) => {
      if (!entity) return
      event.stopPropagation()
      event.preventDefault()
      const link = getEntityLink(entity)
      dispatch(push(link))
      record(
        make(Name.NOTIFICATIONS_CLICK_TILE, {
          kind: entityType,
          link_to: link
        })
      )
    },
    [dispatch, entity, entityType, record]
  )
  return handleClick
}

export const EntityLink = (props: EntityLinkProps) => {
  const { entity, entityType } = props
  const title = 'content_list_id' in entity ? entity.content_list_name : entity.title

  const handleClick = useGoToEntity(entity, entityType)

  return (
    <a className={styles.link} onClick={handleClick}>
      {title}
    </a>
  )
}
