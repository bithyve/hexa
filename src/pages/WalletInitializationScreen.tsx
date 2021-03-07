import React from 'react'
import {
  StyleSheet,
  View,
  SafeAreaView,
  TouchableOpacity,
  Image,
  StatusBar,
  Text,
  AsyncStorage,
} from 'react-native'
import {
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen'
import Ionicons from 'react-native-vector-icons/Ionicons'
import Fonts from '../common/Fonts'
import Colors from '../common/Colors'
import { RFValue } from 'react-native-responsive-fontsize'
import BottomInfoBox from '../components/BottomInfoBox'
import openLink from '../utils/OpenLink'
import content from '../common/content'

const WalletInitializationScreen = props => {
  return (
    <SafeAreaView style={{
      flex: 1
    }}>
      <StatusBar backgroundColor={Colors.white} barStyle="dark-content" />
      <View style={{
        flex: 1
      }}>
        <View style={{
          ...styles.viewSetupWallet, paddingTop: wp( '10%' )
        }}>
          <Text style={styles.headerTitleText}>{content.wallet_setup.new}</Text>
          <Text style={styles.headerInfoText}>{content.wallet_setup.first_time}</Text>
          <TouchableOpacity
            onPress={() => props.navigation.navigate( 'NewWalletName' )}
            style={styles.NewWalletTouchableView}
          >
            <Image
              style={styles.iconImage}
              source={require( '../assets/images/icons/icon_newwallet.png' )}
            />
            <View style={styles.textView}>
              <Text style={styles.touchableText}>{content.wallet_setup.create}</Text>
            </View>
            <View style={styles.arrowIconView}>
              <Ionicons
                name="ios-arrow-forward"
                color={Colors.textColorGrey}
                size={15}
                style={{
                  alignSelf: 'center'
                }}
              />
            </View>
          </TouchableOpacity>
        </View>
        <View style={styles.separator} />
        <View style={{
          ...styles.viewSetupWallet, paddingTop: wp( '10%' )
        }}>
          <Text style={styles.headerTitleText}>{content.wallet_setup.restore}</Text>
          <Text style={styles.headerInfoText}>{content.wallet_setup.if_restore}</Text>
          <TouchableOpacity
            onPress={async () => {
              if ( await AsyncStorage.getItem( 'recoveryExists' ) ) {
                props.navigation.navigate( 'RestoreSelectedContactsList' )

              } else {
                props.navigation.navigate( 'WalletNameRecovery' )
              }
            }}
            style={{
              ...styles.NewWalletTouchableView,
              paddingTop: 20,
              paddingBottom: 20,
            }}
          >
            <Image
              style={styles.iconImage}
              source={require( '../assets/images/icons/icon_secrets.png' )}
            />
            <View style={styles.textView}>
              <Text style={styles.touchableText}>{content.wallet_setup.using_recovery}</Text>
            </View>
            <View style={styles.arrowIconView}>
              <Ionicons
                name="ios-arrow-forward"
                color={Colors.textColorGrey}
                size={15}
                style={{
                  alignSelf: 'center'
                }}
              />
            </View>
          </TouchableOpacity>
        </View>
        <View style={styles.separator} />
        <View style={{
          flex: 1
        }}>
          <View style={{
            marginTop: 'auto'
          }}>
            <BottomInfoBox
              title={content.login.tos}
              infoText={content.login.tos_agree}
              linkText={content.login.tos}
              onPress={() => openLink( 'https://hexawallet.io/terms-of-service/' )}
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  )
}

export default WalletInitializationScreen

let styles = StyleSheet.create( {
  container: {
    flex: 1,
  },
  viewSetupWallet: {
    height: wp( '55%' ),
    backgroundColor: Colors.white,
  },
  headerTitleText: {
    color: Colors.blue,
    fontSize: RFValue( 20 ),
    marginLeft: 15,
    marginRight: 15,
    fontFamily: Fonts.FiraSansRegular,
  },
  headerInfoText: {
    color: Colors.textColorGrey,
    fontSize: RFValue( 12 ),
    marginLeft: 15,
    marginRight: 15,
    fontWeight: 'normal',
    marginTop: 3,
    fontFamily: Fonts.FiraSansRegular,
  },
  NewWalletTouchableView: {
    flex: 1,
    flexDirection: 'row',
    marginLeft: 20,
    marginRight: 20,
  },
  iconImage: {
    resizeMode: 'contain',
    width: 35,
    height: 35,
    alignSelf: 'center',
  },
  textView: {
    marginLeft: 10,
    flex: 1,
    justifyContent: 'center',
  },
  touchableText: {
    color: Colors.blue,
    fontSize: RFValue( 13 ),
    fontFamily: Fonts.FiraSansRegular,
  },
  arrowIconView: {
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  separator: {
    height: 4,
    backgroundColor: Colors.backgroundColor,
  },
} )
