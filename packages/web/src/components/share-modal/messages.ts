import { ShareType } from 'common/store/ui/share-modal/types'

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
  toast: (asset: ShareType) => `Copied Link to ${shareTypeMap[asset]}`,
  trackShareText: (title: string, handle: string) =>
    `Check out ${title} by ${handle} on @AudiusProject #Coliving`,
  profileShareText: (handle: string) =>
    `Check out ${handle} on @AudiusProject #Coliving`,
  albumShareText: (albumName: string, handle: string) =>
    `Check out ${albumName} by ${handle} @AudiusProject #Coliving`,
  playlistShareText: (playlistName: string, handle: string) =>
    `Check out ${playlistName} by ${handle} @AudiusProject #Coliving`,
  // TODO: See if you can display my when the account user is the user
  audioNftPlaylistShareText: (name: string) =>
    `Check out ${name} Audio NFTs in a playlist @AudiusProject #Coliving`
}
