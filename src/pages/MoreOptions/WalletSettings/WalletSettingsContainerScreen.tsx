import React, { useCallback } from 'react'
import { View, Text, StyleSheet, ScrollView, Image, ImageSourcePropType, Alert } from 'react-native'
import DeviceInfo from 'react-native-device-info'
import { AppBottomSheetTouchableWrapper } from '../../../components/AppBottomSheetTouchableWrapper'
import Ionicons from 'react-native-vector-icons/Ionicons'
import Colors from '../../../common/Colors'
import Fonts from '../../../common/Fonts'
import { RFValue } from 'react-native-responsive-fontsize'
import { widthPercentageToDP } from 'react-native-responsive-screen'
import { TransactionDetails } from '../../../bitcoin/utilities/Interface'
import defaultBottomSheetConfigs from '../../../common/configs/BottomSheetConfigs'
import AccountShellRescanningBottomSheet from '../../../components/bottom-sheets/account-shell-rescanning-bottom-sheet/AccountShellRescanningBottomSheet'
import { useBottomSheetModal } from '@gorhom/bottom-sheet'
import { RescannedTransactionData } from '../../../store/reducers/wallet-rescanning'
import WalletRescanningBottomSheet from '../../../components/bottom-sheets/wallet-rescanning-bottom-sheet/WalletRescanningBottomSheet'

export type Props = {
  navigation: any;
};

interface MenuOption {
  title: string;
  subtitle: string;
  imageSource: ImageSourcePropType;
  screenName?: string;
  onOptionPressed?: () => void;
}

const versionString = `Version ${DeviceInfo.getVersion()} (${DeviceInfo.getBuildNumber()})`

const menuOptions: MenuOption[] = [
  {
    title: 'Manage Passcode',
    subtitle: 'Change your passcode',
    imageSource: require( '../../../assets/images/icons/managepin.png' ),
    screenName: 'ManagePasscode',
  },
  {
    title: 'Change Currency',
    subtitle: 'Choose your currency',
    imageSource: require( '../../../assets/images/icons/country.png' ),
    screenName: 'ChangeCurrency',
  },
  // {
  //   title: 'Full Rescan',
  //   subtitle: 'Completely sync the account',
  //   imageSource: require( '../../../assets/images/icons/icon_checking_blue.png' ),
  //   onOptionPressed: handleRescanListItemSelection,
  // },
  //
  {
    title: 'Version History',
    subtitle: 'Version History',
    imageSource: require( '../../../assets/images/icons/icon_versionhistory.png' ),
    screenName: 'VersionHistory',
  },
  // {
  //   title: 'Hexa Release',
  //   subtitle: versionString,
  //   imageSource: require( '../../../assets/images/icons/settings.png' ),
  // },
]


const WalletSettingsContainerScreen: React.FC<Props> = ( { navigation, }: Props ) => {
  const {
    present: presentBottomSheet,
    dismiss: dismissBottomSheet,
  } = useBottomSheetModal()


  function handleOptionSelection( menuOption: MenuOption ) {
    if ( typeof menuOption.onOptionPressed === 'function' ) {
      menuOption.onOptionPressed()
    } else if ( menuOption.screenName !== undefined ) {
      navigation.navigate( menuOption.screenName )
    }
  }

  function handleRescanListItemSelection() {
    Alert.alert(
      'Re-scan your Account',
      'Re-scanning all your accounts may take some time.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Continue',
          onPress: showRescanningBottomSheet,
          style: 'default',
        },
      ]
    )
  }

  function handleTransactionDataSelectionFromRescan( transactionData: RescannedTransactionData ) {
    dismissBottomSheet()

    navigation.navigate( 'TransactionDetails', {
      transactionData: transactionData.details,
      accountShellID: transactionData.accountShell.id,
    } )
  }

  const showRescanningBottomSheet = useCallback( () => {
    presentBottomSheet(
      <WalletRescanningBottomSheet
        onDismiss={dismissBottomSheet}
        onTransactionDataSelected={handleTransactionDataSelectionFromRescan}
      />,
      {
        ...defaultBottomSheetConfigs,
        snapPoints: [ 0, '67%' ],
        dismissOnScrollDown: false,
        dismissOnOverlayPress: false,
      },
    )
  }, [ presentBottomSheet, dismissBottomSheet ] )


  return (
    <View style={styles.modalContainer}>
      <ScrollView style={{
        flex: 1
      }}>
        {menuOptions.map( ( menuOption ) => {
          return (
            <AppBottomSheetTouchableWrapper
              onPress={() => handleOptionSelection( menuOption )}
              style={styles.selectedContactsView}
            >
              <Image
                source={menuOption.imageSource}
                style={{
                  width: widthPercentageToDP( '7%' ),
                  height: widthPercentageToDP( '7%' ),
                  resizeMode: 'contain',
                  marginLeft: widthPercentageToDP( '3%' ),
                  marginRight: widthPercentageToDP( '3%' ),
                }}
              />
              <View
                style={{
                  justifyContent: 'center', marginRight: 10, flex: 1
                }}
              >
                <Text style={styles.titleText}>{menuOption.title}</Text>
                <Text style={styles.infoText}>{menuOption.subtitle}</Text>
              </View>

              <View style={{
                marginLeft: 'auto'
              }}>
                {menuOption.screenName !== undefined && (
                  <Ionicons
                    name="ios-arrow-forward"
                    color={Colors.textColorGrey}
                    size={15}
                    style={{
                      marginLeft: widthPercentageToDP( '3%' ),
                      marginRight: widthPercentageToDP( '3%' ),
                      alignSelf: 'center',
                    }}
                  />
                )}
              </View>
            </AppBottomSheetTouchableWrapper>
          )
        } )}
      </ScrollView>
    </View>
  )
}
const styles = StyleSheet.create( {
  modalContainer: {
    height: '100%',
    backgroundColor: Colors.white,
    alignSelf: 'center',
    width: '100%',
  },
  selectedContactsView: {
    marginLeft: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
    paddingTop: 15,
    paddingBottom: 20,
    borderBottomColor: Colors.borderColor,
    borderBottomWidth: 1,
  },
  titleText: {
    fontSize: RFValue( 13 ),
    fontFamily: Fonts.FiraSansRegular,
    color: Colors.blue,
  },
  infoText: {
    fontSize: RFValue( 11 ),
    fontFamily: Fonts.FiraSansRegular,
    color: Colors.textColorGrey,
    marginTop: 5,
  },
} )

export default WalletSettingsContainerScreen
