import { StyleSheet, View } from 'react-native'

import HeaderLogo from 'app/assets/images/colivingLogoHorizontal.svg'

const styles = StyleSheet.create({
  header: {
    backgroundColor: 'white',
    top: 0,
    width: '100%',
    height: 39,
    alignItems: 'center',
    zIndex: 15,
    borderBottomWidth: 1,
    borderColor: '#F7F7F9'
  },
  colivingLogoHeader: {
    position: 'absolute',
    alignSelf: 'center',
    top: 8,
    marginBottom: 16,
    zIndex: 3,
    height: 24
  }
})

const SignupHeader = () => {
  return (
    <View style={{ backgroundColor: 'white', zIndex: 15 }}>
      <View style={styles.header}>
        <HeaderLogo style={styles.colivingLogoHeader} fill={'#C2C0CC'} />
      </View>
    </View>
  )
}

export default SignupHeader
