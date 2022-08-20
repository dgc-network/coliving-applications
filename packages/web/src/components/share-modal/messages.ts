import { ShareType } from 'common/store/ui/share-modal/types'

const shareTypeMap: Record<ShareType, string> = {
  agreement: 'Agreement',
  profile: 'Profile',
  album: 'Album',
  content list: 'Playlist',
  liveNftPlaylist: 'Audio NFT Playlist'
}

export const messages = {
  modalTitle: (asset: ShareType) => `Share ${shareTypeMap[asset]}`,
  twitter: 'Share to Twitter',
  tikTok: 'Share Sound to TikTok',
  copyLink: (asset: ShareType) => `Copy Link to ${shareTypeMap[asset]}`,
  toast: (asset: ShareType) => `Copied Link to ${shareTypeMap[asset]}`,
  agreementShareText: (title: string, handle: string) =>
    `Check out ${title} by ${handle} on @dgc-network #Coliving`,
  profileShareText: (handle: string) =>
    `Check out ${handle} on @dgc-network #Coliving`,
  albumShareText: (albumName: string, handle: string) =>
    `Check out ${albumName} by ${handle} @dgc-network #Coliving`,
  content listShareText: (content listName: string, handle: string) =>
    `Check out ${content listName} by ${handle} @dgc-network #Coliving`,
  // TODO: See if you can display my when the account user is the user
  liveNftPlaylistShareText: (name: string) =>
    `Check out ${name} Audio NFTs in a content list @dgc-network #Coliving`
}
