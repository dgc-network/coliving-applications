import type { ShareType } from '-client/src/common/store/ui/share-modal/types'

const shareTypeMap: Record<ShareType, string> = {
  agreement: 'Agreement',
  profile: 'Profile',
  album: 'Album',
  contentList: 'ContentList',
  liveNftContentList: 'Audio NFT ContentList'
}

export const messages = {
  modalTitle: (asset: ShareType) => `Share ${shareTypeMap[asset]}`,
  twitter: 'Share to Twitter',
  tikTok: 'Share Sound to TikTok',
  copyLink: (asset: ShareType) => `Copy Link to ${shareTypeMap[asset]}`,
  shareSheet: (asset: ShareType) => `Share ${asset} via...`,
  toast: (asset: ShareType) => `Copied Link to ${shareTypeMap[asset]}`,
  agreementShareText: (title: string, handle: string) =>
    `Check out ${title} by ${handle} on @dgc-network #Coliving`,
  profileShareText: (handle: string) =>
    `Check out ${handle} on @dgc-network #Coliving`,
  albumShareText: (albumName: string, handle: string) =>
    `Check out ${albumName} by ${handle} @dgc-network #Coliving`,
  contentListShareText: (contentListName: string, handle: string) =>
    `Check out ${contentListName} by ${handle} @dgc-network #Coliving`,
  nftContentListShareText: ''
}
