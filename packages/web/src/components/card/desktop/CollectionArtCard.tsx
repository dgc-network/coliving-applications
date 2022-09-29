import { useCallback, useState } from 'react'

import { ID, SquareSizes } from '@coliving/common'
import cn from 'classnames'
import { push as pushRoute } from 'connected-react-router'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'

import { ReactComponent as IconKebabHorizontal } from 'assets/img/iconKebabHorizontal.svg'
import placeholderArt from 'assets/img/imageBlank2x.png'
import { getUserId } from 'common/store/account/selectors'
import { getCollection } from 'common/store/cache/collections/selectors'
import { getUserFromCollection } from 'common/store/cache/users/selectors'
import { LandlordPopover } from 'components/landlord/LandlordPopover'
import DynamicImage from 'components/dynamicImage/dynamicImage'
import Menu, { MenuType } from 'components/menu/Menu'
import PerspectiveCard from 'components/perspective-card/PerspectiveCard'
import RepostFavoritesStats, {
  Size
} from 'components/repost-favorites-stats/RepostFavoritesStats'
import { useCollectionCoverArt } from 'hooks/useCollectionCoverArt'
import {
  setUsers,
  setVisibility
} from 'store/application/ui/userListModal/slice'
import {
  UserListType,
  UserListEntityType
} from 'store/application/ui/userListModal/types'
import { AppState } from 'store/types'
import { contentListPage, albumPage, profilePage } from 'utils/route'
import { withNullGuard } from 'utils/withNullGuard'

import styles from './CollectionArtCard.module.css'

type OwnProps = {
  className?: string
  id: ID
  index: number
  isLoading?: boolean
  setDidLoad?: (index: number) => void
}

type CollectionArtCardProps = OwnProps &
  ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps>

const g = withNullGuard((props: CollectionArtCardProps) => {
  const { collection, user } = props
  if (collection && user) {
    return {
      ...props,
      collection,
      user
    }
  }
})

const CollectionArtCard = g(
  ({
    className,
    index,
    isLoading,
    setDidLoad,
    collection,
    user,
    currentUserId,
    setRepostUsers,
    setFavoriteUsers,
    setModalVisibility,
    goToRoute
  }) => {
    const {
      content_list_id,
      content_list_name,
      is_album,
      _cover_art_sizes,
      has_current_user_reposted,
      has_current_user_saved,
      repost_count,
      save_count
    } = collection
    const { user_id, name, handle } = user

    const [isPerspectiveDisabled, setIsPerspectiveDisabled] = useState(false)

    const goToCollection = useCallback(() => {
      if (isPerspectiveDisabled) return
      const link = is_album
        ? albumPage(handle, content_list_name, content_list_id)
        : contentListPage(handle, content_list_name, content_list_id)
      goToRoute(link)
    }, [
      is_album,
      handle,
      content_list_name,
      content_list_id,
      goToRoute,
      isPerspectiveDisabled
    ])

    const goToProfile = useCallback(() => {
      const link = profilePage(handle)
      goToRoute(link)
    }, [handle, goToRoute])

    const onClickReposts = useCallback(() => {
      setRepostUsers(content_list_id)
      setModalVisibility()
    }, [setRepostUsers, setModalVisibility, content_list_id])

    const onClickFavorites = useCallback(() => {
      setFavoriteUsers(content_list_id)
      setModalVisibility()
    }, [setFavoriteUsers, setModalVisibility, content_list_id])

    const image = useCollectionCoverArt(
      content_list_id,
      _cover_art_sizes,
      SquareSizes.SIZE_480_BY_480,
      placeholderArt
    )
    if (image && setDidLoad) setDidLoad(index)

    const menu = {
      type: (is_album ? 'album' : 'contentList') as MenuType,
      handle,
      contentListId: content_list_id,
      contentListName: content_list_name,
      isOwner: currentUserId === user_id,
      includeShare: true,
      includeRepost: true,
      includeSave: true,
      includeVisitPage: true,
      isFavorited: has_current_user_saved,
      isReposted: has_current_user_reposted,
      metadata: collection,
      name: content_list_name
    }

    return (
      <div className={cn(styles.card, className)}>
        <PerspectiveCard
          onClick={goToCollection}
          isDisabled={isPerspectiveDisabled}
          className={styles.perspectiveCard}
        >
          <DynamicImage
            wrapperClassName={styles.coverArt}
            image={isLoading ? '' : image}
          >
            <Menu menu={menu} onClose={() => setIsPerspectiveDisabled(false)}>
              {(ref, triggerPopup) => (
                <div
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsPerspectiveDisabled(true)
                    triggerPopup()
                  }}
                  className={styles.iconKebabHorizontalWrapper}
                >
                  <IconKebabHorizontal
                    className={styles.iconKebabHorizontal}
                    ref={ref}
                  />
                </div>
              )}
            </Menu>
          </DynamicImage>
        </PerspectiveCard>
        <div className={styles.contentListName} onClick={goToCollection}>
          {content_list_name}
        </div>
        <div className={styles.nameWrapper}>
          <LandlordPopover handle={handle}>
            <span className={styles.userName} onClick={goToProfile}>
              {name}
            </span>
          </LandlordPopover>
        </div>
        <RepostFavoritesStats
          isUnlisted={false}
          size={Size.SMALL}
          repostCount={repost_count}
          saveCount={save_count}
          onClickReposts={onClickReposts}
          onClickFavorites={onClickFavorites}
          className={styles.statsWrapper}
        />
      </div>
    )
  }
)

function mapStateToProps(state: AppState, ownProps: OwnProps) {
  return {
    collection: getCollection(state, { id: ownProps.id }),
    user: getUserFromCollection(state, { id: ownProps.id }),
    currentUserId: getUserId(state)
  }
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    setRepostUsers: (agreementID: ID) =>
      dispatch(
        setUsers({
          userListType: UserListType.REPOST,
          entityType: UserListEntityType.COLLECTION,
          id: agreementID
        })
      ),
    setFavoriteUsers: (agreementID: ID) =>
      dispatch(
        setUsers({
          userListType: UserListType.FAVORITE,
          entityType: UserListEntityType.COLLECTION,
          id: agreementID
        })
      ),
    setModalVisibility: () => dispatch(setVisibility(true)),
    goToRoute: (route: string) => dispatch(pushRoute(route))
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(CollectionArtCard)
