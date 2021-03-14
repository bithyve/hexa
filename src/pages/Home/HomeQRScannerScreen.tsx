import React from 'react'
import { View, Text, StyleSheet, Image, Alert } from 'react-native'
import BottomInfoBox from '../../components/BottomInfoBox'
import getFormattedStringFromQRString from '../../utils/qr-codes/GetFormattedStringFromQRData'
import ListStyles from '../../common/Styles/ListStyles'
import CoveredQRCodeScanner from '../../components/qr-code-scanning/CoveredQRCodeScanner'
import RecipientAddressTextInputSection from '../../components/send/RecipientAddressTextInputSection'
import { REGULAR_ACCOUNT, TEST_ACCOUNT } from '../../common/constants/serviceTypes'
import AccountShell from '../../common/data/models/AccountShell'
import SubAccountKind from '../../common/data/enums/SubAccountKind'
import { useDispatch, useSelector } from 'react-redux'
import { addTransferDetails, clearTransfer } from '../../store/actions/accounts'
import { resetStackToSend } from '../../navigation/actions/NavigationActions'
import { Button } from 'react-native-elements'
import ButtonStyles from '../../common/Styles/ButtonStyles'
import { heightPercentageToDP, widthPercentageToDP } from 'react-native-responsive-screen'
import { ScrollView } from 'react-native-gesture-handler'
import Bitcoin from '../../bitcoin/utilities/accounts/Bitcoin'
import { SATOSHIS_IN_BTC } from '../../common/constants/Bitcoin'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'

// TODO: The patterns here are meant to be the starting point for the way other
// other screens that render QRCode scanners should lay out their components and
// handle actions from the scanning.

export type Props = {
  navigation: any;
};

const HeaderSection: React.FC = () => {
  return (
    <View style={styles.infoHeaderSection}>
      <Text style={ListStyles.infoHeaderSubtitleText}>
        Scan a Bitcoin address or any Hexa QR
      </Text>
    </View>
  )
}

const HomeQRScannerScreen: React.FC<Props> = ( { navigation, }: Props ) => {
  const dispatch = useDispatch()
  const accountShells: AccountShell[] = useSelector(
    ( state ) => state.accounts.accountShells,
  )
  const accountsState = useSelector( ( state ) => state.accounts, )

  function handleBarcodeRecognized( { data: dataString }: { data: string } ) {
    dispatch( clearTransfer( REGULAR_ACCOUNT ) )
    const network = Bitcoin.networkType( dataString )
    if ( network ) {
      const serviceType =
        network === 'MAINNET' ? REGULAR_ACCOUNT : TEST_ACCOUNT // default service type

      const service = accountsState[ serviceType ].service
      const { type } = service.addressDiff( dataString )

      if ( type=='address' ) {
        onSend( dataString, null, null )
      } else if( type=='paymentURI' )  {
        const res = service.decodePaymentURI( dataString )
        const address = res.address
        const options = res.options
        let donationId = null
        // checking for donationId to send note
        if ( options && options.message ) {
          const rawMessage = options.message
          donationId = rawMessage.split( ':' ).pop().trim()
        }

        const bitcoinAmount= options.amount
          ? `${Math.round( options.amount * SATOSHIS_IN_BTC )}`
          : ''

        onSend( address, bitcoinAmount, donationId )
      }
      return
    }

    const onCodeScanned = navigation.getParam( 'onCodeScanned' )
    if ( typeof onCodeScanned === 'function' ) {
      const data = getFormattedStringFromQRString( dataString )
      onCodeScanned( data )
    }

    navigation.goBack( null )
  }

  function onSend( address, bitcoinAmount, donationId ) {
    const item = {
      id: address,
    }
    dispatch( clearTransfer( REGULAR_ACCOUNT ) )

    dispatch( addTransferDetails( REGULAR_ACCOUNT, {
      selectedContact: item,
    } ) )

    let defaultAccountShell: AccountShell
    accountShells.forEach( ( shell: AccountShell ) => {
      if (
        shell.primarySubAccount.kind === SubAccountKind.REGULAR_ACCOUNT &&
        !shell.primarySubAccount.instanceNumber
      )
        defaultAccountShell = shell
    } )

    navigation.dispatch(
      resetStackToSend( {
        accountShellID: defaultAccountShell.id,
        selectedContact: item,
        serviceType: REGULAR_ACCOUNT,
        isFromAddressBook: true,
        ...bitcoinAmount && {
          bitcoinAmount
        },
        ...donationId && {
          donationId
        }
      } )
    )
  }

  return (
    <View style={styles.rootContainer}>
      <KeyboardAwareScrollView
        resetScrollToCoords={{
          x: 0, y: 0
        }}
        scrollEnabled={false}
        style={styles.rootContainer}
      >
        <HeaderSection />

        <CoveredQRCodeScanner
          onCodeScanned={handleBarcodeRecognized}
          containerStyle={{
            marginBottom: 16
          }}
        />

        <View style={styles.viewSectionContainer}>
          <RecipientAddressTextInputSection
            containerStyle={{
              margin: 0, padding: 0
            }}
            placeholder="Enter Address Manually"
            accountKind={REGULAR_ACCOUNT}
            onAddressSubmitted={( address ) => {
              onSend( address, null, null )
            }}
          />
        </View>

        <View
          style={styles.floatingActionButtonContainer}
        >
          <Button
            raised
            title="Receive Bitcoins"
            icon={
              <Image
                source={require( '../../assets/images/icons/icon_bitcoin_light.png' )}
                style={{
                  width: widthPercentageToDP( 4 ),
                  height: widthPercentageToDP( 4 ),
                  resizeMode: 'contain',
                }}
              />
            }
            buttonStyle={{
              ...ButtonStyles.floatingActionButton,
              borderRadius: 9999,
              paddingHorizontal: widthPercentageToDP( 5 )
            }}
            titleStyle={{
              ...ButtonStyles.floatingActionButtonText,
              marginLeft: 8,
            }}
            onPress={() => { navigation.navigate( 'ReceiveQR' )}}
          />
        </View>
        <View style={{
          marginTop: 'auto'
        }}>
          <BottomInfoBox
            style
            title="What can you scan?"
            infoText="
          Scan a bitcoin address, a Hexa Friends and Family request, a Hexa Keeper request, or a restore request
        "
          />
        </View>
      </KeyboardAwareScrollView>
    </View>
  )
}

const styles = StyleSheet.create( {
  rootContainer: {
    flex: 1
  },
  viewSectionContainer: {
    marginBottom: 16,
  },
  infoHeaderSection: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  floatingActionButtonContainer: {
    bottom: heightPercentageToDP( 1.5 ),
    right: 0,
    marginLeft: 'auto',
    padding: heightPercentageToDP( 1.5 ),
  },
  // scannerContainer: {
  //   alignSelf: 'center',
  //   marginBottom: 16,
  //   width: widthPercentageToDP(90),
  //   height: widthPercentageToDP(90),
  // },
} )

export default HomeQRScannerScreen


