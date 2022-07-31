import type { ShareType } from '-client/src/common/store/ui/share-modal/types'

const shareTypeMap: Record<ShareType, string> = {
  track: 'Track',
  profile: 'Profile',
  album: 'Album',
  playlist: 'Playlist',
  audioNftPlaylist: 'Audio NFT Playlist'
}

export const messages = {
  modalTitle: (asset: ShareType) => `Share ${shareTypeMap[asset]}`,
  twitter: 'Share to Twitter',
  tikTok: 'Share Sound to TikTok',
  copyLink: (asset: ShareType) => `Copy Link to ${shareTypeMap[asset]}`,
  shareSheet: (asset: ShareType) => `Share ${asset} via...`,
  toast: (asset: ShareType) => `Copied Link to ${shareTypeMap[asset]}`,
  trackShareText: (title: string, handle: string) =>
    `Check out ${title} by ${handle} on @dgc.network #Coliving`,
  profileShareText: (handle: string) =>
    `Check out ${handle} on @dgc.network #Coliving`,
  albumShareText: (albumName: string, handle: string) =>
    `Check out ${albumName} by ${handle} @dgc.network #Coliving`,
  playlistShareText: (playlistName: string, handle: string) =>
    `Check out ${playlistName} by ${handle} @dgc.network #Coliving`,
  nftPlaylistShareText: ''
}
