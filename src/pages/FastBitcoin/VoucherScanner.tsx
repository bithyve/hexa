import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
  Image,
  ImageBackground,
  AsyncStorage,
  Linking,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native'
import Fonts from '../../common/Fonts'
import DeviceInfo from 'react-native-device-info'
import NavStyles from '../../common/Styles/NavStyles'
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen'
import {
  SECURE_ACCOUNT,
  TEST_ACCOUNT,
  REGULAR_ACCOUNT,
  FAST_BITCOINS,
} from '../../common/constants/serviceTypes'
import FontAwesome from 'react-native-vector-icons/FontAwesome'
import Entypo from 'react-native-vector-icons/Entypo'
import Colors from '../../common/Colors'
import BottomSheet from 'reanimated-bottom-sheet'
import { RFValue } from 'react-native-responsive-fontsize'
import { RNCamera } from 'react-native-camera'
import ErrorModalContents from '../../components/ErrorModalContents'
import ModalHeader from '../../components/ModalHeader'
import QuoteConfirmation from './QuoteConfirmation'
import VoucherRedeemSuccess from './VoucherRedeemSuccess'
import AccountVerification from './AccountVerification'
import { ScrollView } from 'react-native-gesture-handler'
import { useDispatch, useSelector } from 'react-redux'
import { UsNumberFormat } from '../../common/utilities'
import {
  accountSync,
  getQuote,
  executeOrder,
  ClearAccountSyncData,
  ClearQuoteDetails,
  ClearOrderDetails,
  accountSyncFail,
  getQuoteFail,
  executeOrderFail,
  storeFbtcData,
  clearFbtcVoucher,
} from '../../store/actions/fbtc'
import config from '../../bitcoin/HexaConfig'
import Loader from '../../components/loader'
import Toast from '../../components/Toast'
import moment from 'moment'
import { isEmpty } from '../../common/CommonFunctions'
import AccountShell from '../../common/data/models/AccountShell'
import SubAccountKind from '../../common/data/enums/SubAccountKind'
import { addNewSecondarySubAccount } from '../../store/actions/accounts'
import ExternalServiceSubAccountInfo from '../../common/data/models/SubAccountInfo/ExternalServiceSubAccountInfo'
import ServiceAccountKind from '../../common/data/enums/ServiceAccountKind'
import SourceAccountKind from '../../common/data/enums/SourceAccountKind'

const VoucherScanner = ( props ) => {
  //const FBTCVoucher = useSelector((state) => state.fbtc.FBTCVoucher);
  const cameraRef = useRef<RNCamera>()
  const [ FBTCAccount_Data, setFBTCAccount_Data ] = useState( {
  } )
  const [ TextHideShow, setTextHideShow ] = useState( true )
  const userKey1 = props.navigation.state.params
    ? props.navigation.state.params.userKey
    : ''
  const [ bitcoinAddress, setBitcoinAddress ] = useState( '' )
  const QuoteDetails = useSelector( ( state ) => state.fbtc.getQuoteDetails )

  const executeOrderDetails = useSelector(
    ( state ) => state.fbtc.executeOrderDetails,
  )
  const [ hideShow, setHideShow ] = useState( false )
  const [ isUserRegistered, setIsUserRegistered ] = useState( false )
  const [ openCameraFlag, setOpenCameraFlag ] = useState( false )
  const [ voucherCode, setVoucherCode ] = useState( '' )
  const [ userKey, setUserKey ] = useState( userKey1 )
  const accountsSyncFail = useSelector( ( state ) => state.fbtc.accountSyncFail )
  const accountSyncFailMessage = useSelector(
    ( state ) => state.fbtc.accountSyncFailMessage,
  )
  const IsGetQuoteFail = useSelector( ( state ) => state.fbtc.getQuoteFail )
  const getQuoteFailMessage = useSelector(
    ( state ) => state.fbtc.getQuoteFailMessage,
  )
  const IsExecuteOrderFail = useSelector( ( state ) => state.fbtc.accountSyncFail )
  const executeOrderFailMessage = useSelector(
    ( state ) => state.fbtc.accountSyncFailMessage,
  )
  const dispatch = useDispatch()
  const accountSyncDetails = useSelector(
    ( state ) => state.fbtc.accountSyncDetails,
  )
  const [ errorTitle, setErrorTitle ] = useState( '' )
  const [ errorInfo, setErrorInfo ] = useState( '' )
  const [ errorNote, setErrorNote ] = useState( '' )
  const [ errorProccedButtonText, setErrorProccedButtonText ] = useState( '' )
  const [ showLoader, setShowLoader ] = useState( false )
  const FBTCAccountData = useSelector( ( state ) => state.fbtc.FBTCAccountData )
  const accountShells: AccountShell[] = useSelector(
    ( state ) => state.accounts.accountShells,
  )

  const [ balances, setBalances ] = useState( {
    regularBalance: 0,
    secureBalance: 0,
  } )

  const [ ErrorModalBottomSheet, setErrorModalBottomSheet ] = useState(
    React.createRef<BottomSheet>(),
  )
  const [
    RegistrationSuccessBottomSheet,
    setRegistrationSuccessBottomSheet,
  ] = useState( React.createRef<BottomSheet>() )
  const [ QuoteBottomSheet, setQuoteBottomSheet ] = useState(
    React.createRef<BottomSheet>(),
  )
  const [
    VoucherRedeemSuccessBottomSheet,
    setVoucherRedeemSuccessBottomSheet,
  ] = useState( React.createRef<BottomSheet>() )
  const [
    AccountVerificationBottomSheet,
    setAccountVerificationBottomSheet,
  ] = useState( React.createRef<BottomSheet>() )
  const [ Quote, setQuote ] = useState( {
  } )
  const accounts = [
    {
      accountType: '',
      accountName: 'Choose a deposit account',
      amount: '',
      image: require( '../../assets/images/icons/icon_test.png' ),
    },
    {
      accountType: REGULAR_ACCOUNT,
      accountName: 'Checking Account',
      amount: '5,000',
      image: require( '../../assets/images/icons/icon_regular.png' ),
    },
    {
      accountType: SECURE_ACCOUNT,
      accountName: 'Saving Account',
      amount: '3,000',
      image: require( '../../assets/images/icons/icon_secureaccount.png' ),
    },
  ]
  const [ selectedAccount, setSelectedAccount ] = useState( {
    accountType: REGULAR_ACCOUNT,
    accountName: 'Checking Account',
    amount: '0',
    image: require( '../../assets/images/icons/icon_regular.png' ),
  } )
  const service = useSelector(
    ( state ) => state.accounts[ selectedAccount && selectedAccount.accountType ].service,
  )

  useEffect( () => {
    if ( FBTCAccountData ) {
      //console.log("FBTCAccountData-- in useEffect", FBTCAccountData);
      setFBTCAccount_Data( FBTCAccountData )
    }
  }, [ FBTCAccountData ] )


  const usePrevious = <T extends {}>( value: T ): T | undefined => {
    const ref = useRef<T>()
    useEffect( () => {
      ref.current = value
    } )
    return ref.current
  }
  const prevFBTCAccount_Data = usePrevious( {
    FBTCAccount_Data
  } )

  useEffect( () => {
    check()
  }, [] )

  useEffect( () => {
    ( async () => {
      if ( prevFBTCAccount_Data.FBTCAccount_Data !== FBTCAccount_Data ) {
        check()
      }
    } )()
  }, [ FBTCAccount_Data ] )

  const check = async () => {
    const FBTCAccountData = FBTCAccount_Data
    console.log( 'FBTCAccountData', FBTCAccountData )
    if ( FBTCAccountData && FBTCAccountData.user_key ) {
      setIsUserRegistered( true )
    }
    if ( userKey1 || ( FBTCAccountData && FBTCAccountData.user_key ) ) {
      const voucherCodeTemp = JSON.parse(
        await AsyncStorage.getItem( 'voucherData' ),
      )
      if ( voucherCodeTemp ) {
        setVoucherCode( voucherCodeTemp && voucherCodeTemp.voucher_code )
        setSelectedAccount( voucherCodeTemp && voucherCodeTemp.selectedAccount )
      }
    }
    if ( !userKey && FBTCAccountData && FBTCAccountData.user_key ) {
      setUserKey( FBTCAccountData.user_key )
    }
  }

  const getFastBitcoinsAccount = () => {
    const accountNumber = 1
    const receivingAddress = service.getReceivingAddress(
      FAST_BITCOINS,
      accountNumber,
    )
    if( receivingAddress ){
      setBitcoinAddress(
        receivingAddress,
      )
    }
    else{
      let parentShell: AccountShell
      accountShells.forEach( ( shell: AccountShell ) => {
        if( !shell.primarySubAccount.instanceNumber ){ // out of box checking/savings acc
          if( shell.primarySubAccount.sourceKind === selectedAccount.accountType ) parentShell = shell
        }
      } )
      if( parentShell ){
        const newSecondarySubAccount = new ExternalServiceSubAccountInfo( {
          instanceNumber: accountNumber,
          defaultTitle: 'FastBitcoins.com',
          defaultDescription: 'Use FastBitcoin vouchers',
          accountShellID: parentShell.id,
          serviceAccountKind: ServiceAccountKind.FAST_BITCOINS,
          isTFAEnabled: selectedAccount.accountType === SourceAccountKind.SECURE_ACCOUNT? true: false
        } )
        dispatch(
          addNewSecondarySubAccount( newSecondarySubAccount, parentShell ),
        )
      } else console.log( 'Unable to find the parent shell' )
    }
  }

  useEffect( () => {
    if ( selectedAccount && service ) {
      getFastBitcoinsAccount()
    }
  }, [ selectedAccount, service ] )

  useEffect( () => {
    if( accountShells ){
      let regularBalance = 0
      let secureBalance = 0
      accountShells.forEach( ( shell ) => {
        if( !shell.primarySubAccount.instanceNumber ){ // out of box checking/savings acc
          switch( shell.primarySubAccount.kind ){
              case SubAccountKind.REGULAR_ACCOUNT:
                regularBalance += AccountShell.getTotalBalance( shell )
                break

              case SubAccountKind.SECURE_ACCOUNT:
                secureBalance += AccountShell.getTotalBalance( shell )
                break
          }
        }
      } )

      setBalances( {
        regularBalance,
        secureBalance,
      } )
    }

  }, [ accountShells ] )

  useEffect( () => {
    if ( voucherCode ) {
      if ( selectedAccount && selectedAccount.accountType != '' ) {
        ( async () => {
          let voucherDataTemp = JSON.parse(
            await AsyncStorage.getItem( 'voucherData' ),
          )
          voucherDataTemp = {
            voucher_code: voucherCode,
            selectedAccount: selectedAccount,
          }
          // dispatch(storeFbtcVoucher(voucherDataTemp));
          await AsyncStorage.setItem(
            'voucherData',
            JSON.stringify( voucherDataTemp ),
          )
          const voucherDataAfterAdd = JSON.parse(
            await AsyncStorage.getItem( 'voucherData' ),
          )
          // console.log("voucherDataAfterAdd",voucherDataAfterAdd);
        } )()
        // console.log('voucherCode,selectedAccount', voucherCode,selectedAccount)
        if ( isUserRegistered ) {
          if ( voucherCode.length == 12 && selectedAccount ) createFBTCAccount()
        } else {
          if ( voucherCode.length == 12 && selectedAccount && !userKey1 )
            AccountVerificationBottomSheet.current.snapTo( 1 )
        }
      } else {
        Toast( 'Please select Account' )
      }
    }
  }, [ selectedAccount, voucherCode ] )

  const barcodeRecognized = async ( barcodes ) => {
    if ( barcodes.data ) {
      if ( barcodes.data.includes( 'fastbitcoins.com' ) ) {
        const tempData = barcodes.data.split( '/' )
        setVoucherCode( tempData[ tempData.length - 1 ] )
      }
      setOpenCameraFlag( false )
    }
  }

  const saveVoucherCodeToAccount = async ( selectedAccount, voucherCode ) => {
    const fBTCAccount = FBTCAccount_Data
    if ( !isEmpty( fBTCAccount ) ) {
      //console.log("inside if saveVoucherCodeToAccount", voucherCode,selectedAccount)
      let temp = true
      for ( let i = 0; i < fBTCAccount.test_account.voucher.length; i++ ) {
        const element = fBTCAccount.test_account.voucher[ i ]
        if (
          voucherCode == element.voucherCode &&
          element.hasOwnProperty( 'quotes' )
        ) {
          temp = false
          break
        }
      }
      if ( temp ) {
        for ( let i = 0; i < fBTCAccount.checking_account.voucher.length; i++ ) {
          const element = fBTCAccount.checking_account.voucher[ i ]
          if (
            voucherCode == element.voucherCode &&
            element.hasOwnProperty( 'quotes' )
          ) {
            temp = false
            break
          }
        }
      }
      if ( temp ) {
        for ( let i = 0; i < fBTCAccount.saving_account.voucher.length; i++ ) {
          const element = fBTCAccount.saving_account.voucher[ i ]
          if (
            voucherCode == element.voucherCode &&
            element.hasOwnProperty( 'quotes' )
          ) {
            temp = false
            break
          }
        }
      }
      if ( temp ) {
        // console.log("SELCTED ACOOUNT", selectedAccount);
        let accountType = 'saving_account'
        if ( selectedAccount && selectedAccount.accountType == TEST_ACCOUNT ) {
          accountType = 'test_account'
        } else if (
          selectedAccount &&
          selectedAccount.accountType == REGULAR_ACCOUNT
        ) {
          accountType = 'checking_account'
        }
        fBTCAccount[ accountType ].voucher.push( {
          voucherCode: voucherCode,
        } )
        if ( fBTCAccount.redeem_vouchers && voucherCode && !userKey1 ) {
          setShowLoader( true )
          getQuoteDetailsMethod()
        }
        dispatch( storeFbtcData( fBTCAccount ) )
        await AsyncStorage.setItem( 'FBTCAccount', JSON.stringify( fBTCAccount ) )
      } else {
        setTimeout( () => {
          setErrorTitle( 'This voucher already redeemed' )
          setErrorProccedButtonText( 'Done' )
          setVoucherCode( '' )
        }, 2 )
        await AsyncStorage.setItem( 'voucherData', '' );
        ( ErrorModalBottomSheet as any ).current.snapTo( 1 )
      }
    }
  }

  const onRedeem = () => {
    const serviceType: SubAccountKind =
      selectedAccount.accountName === 'Checking Account'
        ? SubAccountKind.REGULAR_ACCOUNT
        : SubAccountKind.SECURE_ACCOUNT

    let defaultAccountShellId: string // checking|savings(default)
    accountShells.forEach( ( shell ) => {
      if (
        shell.primarySubAccount.kind === serviceType &&
        !shell.primarySubAccount.instanceNumber
      )
        defaultAccountShellId = shell.id
    } )

    props.navigation.replace( 'AccountDetails', {
      accountShellID: defaultAccountShellId,
    } )
  }

  useEffect( () => {
    if ( userKey ) createFBTCAccount()
  }, [ userKey ] )

  const createFBTCAccount = async () => {
    const FBTCAccountData = FBTCAccount_Data
    let obj
    if ( isEmpty( FBTCAccountData ) ) {
      obj = {
        user_key: userKey,
        registrationDate: moment( new Date() ).valueOf(),
        test_account: {
          voucher: [],
        },
        checking_account: {
          voucher: [],
        },
        saving_account: {
          voucher: [],
        },
      }
    } else {
      obj = FBTCAccountData
    }
    dispatch( storeFbtcData( obj ) )
    await AsyncStorage.setItem( 'FBTCAccount', JSON.stringify( obj ) )
    const voucherData = JSON.parse( await AsyncStorage.getItem( 'voucherData' ) )
    // console.log("voucherData1", voucherData)
    if ( voucherData ) {
      saveVoucherCodeToAccount(
        voucherData.selectedAccount,
        voucherData.voucher_code,
      )
    }
    if (
      !obj.hasOwnProperty( 'redeem_vouchers' ) &&
      !obj.hasOwnProperty( 'exchange_balances' ) &&
      !obj.hasOwnProperty( 'sell_bitcoins' )
    )
      checkAuth()
  }

  const checkAuth = () => {
    const data = {
      userKey: userKey,
    }
    setShowLoader( true )
    dispatch( accountSync( data ) )
  }

  useEffect( () => {
    if ( accountSyncDetails ) {
      ( async () => {
        const FBTCAccountData = FBTCAccount_Data
        let obj
        if ( !isEmpty( FBTCAccountData ) ) {
          obj = {
            ...FBTCAccountData,
            redeem_vouchers: accountSyncDetails.redeem_vouchers,
            exchange_balances: accountSyncDetails.exchange_balances,
            sell_bitcoins: accountSyncDetails.sell_bitcoins,
          }
          dispatch( storeFbtcData( obj ) )
          //await AsyncStorage.setItem('FBTCAccount', JSON.stringify(obj));
        }
        if ( accountSyncDetails.redeem_vouchers ) {
          setTimeout( () => {
            setShowLoader( false )
          }, 2 );
          ( RegistrationSuccessBottomSheet as any ).current.snapTo( 1 )

          dispatch( ClearAccountSyncData() )
        }
      } )()
    }
  }, [ accountSyncDetails, FBTCAccount_Data ] )

  const getQuoteDetailsMethod = async () => {
    //let voucherData = voucherCodeAsync;
    const voucherData = JSON.parse( await AsyncStorage.getItem( 'voucherData' ) )
    const FBTCAccountData = FBTCAccount_Data
    const data = {
      user_key: FBTCAccountData.user_key,
      quote_type: 'voucher',
      voucher_code: voucherData ? voucherData.voucher_code : '',
    }
    dispatch( getQuote( data ) )
  }

  useEffect( () => {
    ( async () => {
      if ( QuoteDetails ) {
        console.log( 'QuoteDetails', QuoteDetails )
        setShowLoader( false )
        QuoteBottomSheet.current.snapTo( 1 )
        // if(QuoteDetails)
        // setTimeout(() => {
        //   setQuote(QuoteDetails);
        // }, 2);
        await AsyncStorage.setItem( 'quoteData', JSON.stringify( QuoteDetails ) )
      }
    } )()
  }, [ QuoteDetails ] )

  const storeQuotesDetails = async () => {
    const voucherFromAsync = JSON.parse(
      await AsyncStorage.getItem( 'voucherData' ),
    )
    const fBTCAccountData = FBTCAccount_Data
    if (
      voucherFromAsync &&
      voucherFromAsync.selectedAccount.accountType == TEST_ACCOUNT
    ) {
      let tmp = true
      for ( let i = 0; i < fBTCAccountData.test_account.voucher.length; i++ ) {
        const element = fBTCAccountData.test_account.voucher[ i ]
        if ( element.voucherCode == voucherFromAsync.voucher_code ) {
          tmp = false
          fBTCAccountData.test_account.voucher[ i ].quotes = QuoteDetails
          break
        }
      }
      if ( tmp ) {
        const obj = {
          quotes: QuoteDetails,
          voucherCode: voucherFromAsync.voucher_code,
        }
        fBTCAccountData.test_account.voucher.push( obj )
      }
    }
    if (
      voucherFromAsync &&
      voucherFromAsync.selectedAccount.accountType == SECURE_ACCOUNT
    ) {
      let tmp = true
      for ( let i = 0; i < fBTCAccountData.saving_account.voucher.length; i++ ) {
        const element = fBTCAccountData.saving_account.voucher[ i ]
        if ( element.voucherCode == voucherFromAsync.voucher_code ) {
          fBTCAccountData.saving_account.voucher[ i ].quotes = QuoteDetails
          tmp = false
          break
        }
      }
      if ( tmp ) {
        const obj = {
          quotes: QuoteDetails,
          voucherCode: voucherFromAsync.voucher_code,
        }
        fBTCAccountData.saving_account.voucher.push( obj )
      }
    }
    if (
      voucherFromAsync &&
      voucherFromAsync.selectedAccount.accountType == REGULAR_ACCOUNT
    ) {
      let tmp = true
      for (
        let i = 0;
        i < fBTCAccountData.checking_account.voucher.length;
        i++
      ) {
        const element = fBTCAccountData.checking_account.voucher[ i ]
        if ( element.voucherCode == voucherFromAsync.voucher_code ) {
          tmp = false
          fBTCAccountData.checking_account.voucher[ i ].quotes = QuoteDetails
          break
        }
      }
      if ( tmp ) {
        const obj = {
          quotes: QuoteDetails,
          voucherCode: voucherFromAsync.voucher_code,
        }
        fBTCAccountData.checking_account.voucher.push( obj )
      }
    }
    dispatch( storeFbtcData( fBTCAccountData ) )
    await AsyncStorage.setItem( 'FBTCAccount', JSON.stringify( fBTCAccountData ) )
    executeOrderMethod()
  }

  const renderRegistrationSuccessModalContent = useCallback( () => {
    return (
      <ErrorModalContents
        modalRef={RegistrationSuccessBottomSheet}
        title={'FastBitcoins Account\nSuccessfully Registered'}
        info={'FastBitcoins successfully registered'}
        note={
          'Congratulations, your wallet has been successfully linked to your FastBitcoins account. Now you can proceed to redeem your vouchers'
        }
        proceedButtonText={'Redeem Voucher'}
        onPressProceed={() => {
          const FBTCAccountData = FBTCAccount_Data
          if ( FBTCAccountData.redeem_vouchers && voucherCode ) {
            setTimeout( () => {
              setShowLoader( true )
            }, 2 )
            getQuoteDetailsMethod();
            ( RegistrationSuccessBottomSheet as any ).current.snapTo( 0 )
          }
        }}
        isIgnoreButton={true}
        cancelButtonText={'Back'}
        onPressIgnore={() => {}}
        isBottomImage={true}
        bottomImage={require( '../../assets/images/icons/illustration.png' )}
      />
    )
  }, [ FBTCAccount_Data ] )

  const renderRegistrationSuccessModalHeader = useCallback( () => {
    return (
      <ModalHeader
      // onPressHeader={() => {
      //   (RegistrationSuccessBottomSheet as any).current.snapTo(0);
      // }}
      />
    )
  }, [] )

  useEffect( () => {
    if ( executeOrderDetails ) {
      storeOrderResponse()
    }
  }, [ executeOrderDetails ] )

  const storeOrderResponse = async () => {
    const fBTCAccountData = FBTCAccount_Data
    const voucherFromAsync = JSON.parse(
      await AsyncStorage.getItem( 'voucherData' ),
    )
    if ( fBTCAccountData ) {
      const obj = {
        ...executeOrderDetails,
        date: moment( new Date() ).valueOf(),
      }
      if (
        voucherFromAsync &&
        voucherFromAsync.selectedAccount.accountType == TEST_ACCOUNT
      ) {
        for ( let i = 0; i < fBTCAccountData.test_account.voucher.length; i++ ) {
          const element = fBTCAccountData.test_account.voucher[ i ]
          if ( element.voucherCode == voucherFromAsync.voucher_code ) {
            fBTCAccountData.test_account.voucher[ i ].orderData = obj
            break
          }
        }
      }
      if (
        voucherFromAsync &&
        voucherFromAsync.selectedAccount.accountType == SECURE_ACCOUNT
      ) {
        for (
          let i = 0;
          i < fBTCAccountData.saving_account.voucher.length;
          i++
        ) {
          const element = fBTCAccountData.saving_account.voucher[ i ]
          if ( element.voucherCode == voucherFromAsync.voucher_code ) {
            fBTCAccountData.saving_account.voucher[ i ].orderData = obj
            break
          }
        }
      }
      if (
        voucherFromAsync &&
        voucherFromAsync.selectedAccount.accountType == REGULAR_ACCOUNT
      ) {
        for (
          let i = 0;
          i < fBTCAccountData.checking_account.voucher.length;
          i++
        ) {
          const element = fBTCAccountData.checking_account.voucher[ i ]
          if ( element.voucherCode == voucherFromAsync.voucher_code ) {
            fBTCAccountData.checking_account.voucher[ i ].orderData = obj
            break
          }
        }
      }
      dispatch( storeFbtcData( fBTCAccountData ) )
      await AsyncStorage.setItem(
        'FBTCAccount',
        JSON.stringify( fBTCAccountData ),
      )
      setTimeout( () => {
        setShowLoader( false )
      }, 2 )
      VoucherRedeemSuccessBottomSheet.current.snapTo( 1 )
      await AsyncStorage.setItem( 'quoteData', '' )
      dispatch( clearFbtcVoucher() )
      await AsyncStorage.setItem( 'voucherData', '' )
    }
    dispatch( ClearOrderDetails() )
  }

  const executeOrderMethod = async () => {
    const quoteData = JSON.parse( await AsyncStorage.getItem( 'quoteData' ) )
    const fBTCAccountData = FBTCAccount_Data
    const voucherFromAsync = JSON.parse(
      await AsyncStorage.getItem( 'voucherData' ),
    )
    if ( fBTCAccountData && fBTCAccountData.user_key && bitcoinAddress ) {
      const data = {
        user_key: fBTCAccountData.user_key,
        wallet_slug: config.WALLET_SLUG,
        quote_type: 'voucher',
        quote_token: quoteData.quote_token,
        voucher_code: voucherFromAsync.voucher_code,
        delivery_type: '1',
        delivery_destination: bitcoinAddress,
      }
      setQuote( QuoteDetails )
      dispatch( executeOrder( data ) )
      dispatch( ClearQuoteDetails() )
    } else {
      Toast( 'Please select Account' )
    }
  }

  const renderQuoteModalContent = useCallback( () => {
    if ( QuoteDetails ) {
      return (
        <QuoteConfirmation
          onPressRedeem={() => {
            setShowLoader( true )
            storeQuotesDetails()
          }}
          onPressBack={() => {
            QuoteBottomSheet.current.snapTo( 0 )
            setTimeout( () => {
              setVoucherCode( '' )
            }, 2 )
          }}
          voucherNumber={voucherCode ? voucherCode : ''}
          purchasedFor={QuoteDetails ? QuoteDetails.amount : ''}
          redeemAmount={QuoteDetails ? QuoteDetails.bitcoin_amount : ''}
          bitcoinRate={QuoteDetails ? QuoteDetails.exchange_rate : ''}
          currencyCode={QuoteDetails ? QuoteDetails.currency : ''}
          loading={false}
        />
      )
    }
  }, [ QuoteDetails, voucherCode ] )

  const renderQuoteModalHeader = useCallback( () => {
    return (
      <ModalHeader
      // onPressHeader={() => {
      //   (QuoteBottomSheet as any).current.snapTo(0);
      // }}
      />
    )
  }, [] )

  const renderVoucherRedeemSuccessModalContent = useCallback( () => {
    if ( selectedAccount ) {
      return (
        <VoucherRedeemSuccess
          onPressRedeem={onRedeem}
          onPressBack={() => {
            VoucherRedeemSuccessBottomSheet.current.snapTo( 0 )
          }}
          accountName={selectedAccount.accountName}
          redeemAmount={
            Quote && Quote.bitcoin_amount ? Quote.bitcoin_amount : ''
          }
          loading={false}
        />
      )
    }
  }, [ selectedAccount, Quote ] )

  const renderVoucherRedeemSuccessModalHeader = useCallback( () => {
    return (
      <ModalHeader
      // onPressHeader={() => {
      //   (VoucherRedeemSuccessBottomSheet as any).current.snapTo(0);
      // }}
      />
    )
  }, [] )

  const renderAccountVerificationModalContent = useCallback( () => {
    return (
      <AccountVerification
        link={config.FBTC_REGISTRATION_URL}
        openLinkVerification={() => {
          Linking.openURL( config.FBTC_REGISTRATION_URL )
          props.navigation.goBack()
        }}
      />
    )
  }, [] )

  const renderAccountVerificationModalHeader = useCallback( () => {
    return (
      <ModalHeader
      // onPressHeader={() => {
      //   AccountVerificationBottomSheet.current.snapTo(0);
      // }}
      />
    )
  }, [] )

  useEffect( () => {
    if ( accountsSyncFail && accountSyncFailMessage ) {
      setTimeout( () => {
        setShowLoader( false )
        setErrorTitle( accountSyncFailMessage )
        setErrorProccedButtonText( 'Done' )
      }, 2 );
      ( ErrorModalBottomSheet as any ).current.snapTo( 1 )
      const data = {
        accountSyncFail: false,
        accountSyncFailMessage: '',
      }
      dispatch( accountSyncFail( data ) )
    }
  }, [ accountsSyncFail, accountSyncFailMessage ] )

  useEffect( () => {
    if ( IsGetQuoteFail && getQuoteFailMessage ) {
      setTimeout( () => {
        setShowLoader( false )
        setErrorTitle( getQuoteFailMessage )
        setErrorProccedButtonText( 'Done' )
      }, 2 );
      ( ErrorModalBottomSheet as any ).current.snapTo( 1 )
      const data = {
        getQuoteFail: false,
        getQuoteFailMessage: '',
      }
      dispatch( getQuoteFail( data ) )
    }
  }, [ IsGetQuoteFail, getQuoteFailMessage ] )

  useEffect( () => {
    if ( IsExecuteOrderFail && executeOrderFailMessage ) {
      setTimeout( () => {
        setErrorTitle( executeOrderFailMessage )
        setErrorProccedButtonText( 'Done' )
        setShowLoader( false )
      }, 2 );
      ( ErrorModalBottomSheet as any ).current.snapTo( 1 )
      const data = {
        executeOrderFail: false,
        executeOrderFailMessage: '',
      }
      dispatch( executeOrderFail( data ) )
    }
  }, [ IsExecuteOrderFail, executeOrderFailMessage ] )

  const renderErrorModalContent = useCallback( () => {
    return (
      <ErrorModalContents
        modalRef={ErrorModalBottomSheet}
        title={errorTitle}
        info={errorInfo}
        note={errorNote}
        proceedButtonText={errorProccedButtonText}
        onPressProceed={() => {
          ( ErrorModalBottomSheet as any ).current.snapTo( 0 )
        }}
        isIgnoreButton={true}
        cancelButtonText={'Back'}
        onPressIgnore={() => {
          ( ErrorModalBottomSheet as any ).current.snapTo( 0 )
        }}
        isBottomImage={true}
        bottomImage={require( '../../assets/images/icons/reject.png' )}
      />
    )
  }, [ errorTitle, errorInfo, errorNote, errorProccedButtonText ] )

  const renderErrorModalHeader = useCallback( () => {
    return (
      <ModalHeader
      // onPressHeader={() => {
      //   (ErrorModalBottomSheet as any).current.snapTo(0);
      // }}
      />
    )
  }, [] )

  return (
    <View style={{
      flex: 1
    }}>
      <SafeAreaView style={{
        flex: 0
      }} />
      <StatusBar backgroundColor={Colors.white} barStyle="dark-content" />
      <View style={NavStyles.modalHeaderTitleView}>
        <View style={{
          flex: 1, flexDirection: 'row', alignItems: 'center'
        }}>
          <TouchableOpacity
            onPress={() => {
              props.navigation.goBack()
            }}
            hitSlop={{
              top: 20, left: 20, bottom: 20, right: 20
            }}
            style={styles.backArrowView}
          >
            <FontAwesome name="long-arrow-left" color={Colors.blue} size={17} />
          </TouchableOpacity>
          <Text style={NavStyles.modalHeaderTitleText}>
            Scan a FastBitcoins voucher
          </Text>
        </View>
      </View>
      <KeyboardAvoidingView
        style={{
          flex: 1, paddingTop: wp( '5%' ), position: 'relative'
        }}
        behavior={Platform.OS == 'ios' ? 'padding' : ''}
        enabled
      >
        <ScrollView style={{
          flex: 1
        }}>
          <View style={{
            height: '100%'
          }}>
            {openCameraFlag ? (
              <View style={styles.cameraView}>
                <RNCamera
                  ref={cameraRef}
                  style={styles.camera}
                  onBarCodeRead={barcodeRecognized}
                  captureAudio={false}
                >
                  <View style={{
                    flex: 1
                  }}>
                    <View style={styles.topCornerView}>
                      <View style={styles.topLeftCornerView} />
                      <View style={styles.topRightCornerView} />
                    </View>
                    <View style={styles.bottomCornerView}>
                      <View style={styles.bottomLeftCornerView} />
                      <View style={styles.bottomRightCornerView} />
                    </View>
                  </View>
                </RNCamera>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => setOpenCameraFlag( true )}
                style={{
                  alignSelf: 'center'
                }}
              >
                <ImageBackground
                  source={require( '../../assets/images/icons/iPhone-QR.jpg' )}
                  style={styles.cameraImage}
                >
                  <View style={{
                    flex: 1
                  }}>
                    <View style={styles.topCornerView}>
                      <View style={styles.topLeftCornerView} />
                      <View style={styles.topRightCornerView} />
                    </View>
                    <View style={styles.bottomCornerView}>
                      <View style={styles.bottomLeftCornerView} />
                      <View style={styles.bottomRightCornerView} />
                    </View>
                  </View>
                </ImageBackground>
              </TouchableOpacity>
            )}
            <TextInput
              placeholder={'Enter Voucher Code'}
              placeholderTextColor={Colors.borderColor}
              style={styles.qrModalTextInput}
              autoCorrect={false}
              onChangeText={( text ) => {
                setVoucherCode( text )
              }}
              onFocus={() => {
                setTextHideShow( false )
              }}
              onBlur={() => {
                setTextHideShow( true )
              }}
              value={voucherCode}
              autoCompleteType="off"
              keyboardType={
                Platform.OS == 'ios' ? 'ascii-capable' : 'visible-password'
              }
            />
          </View>
        </ScrollView>
        {hideShow ? (
          <View style={styles.dropDownView}>
            {accounts.map( ( value ) => {
              return (
                <TouchableOpacity
                  activeOpacity={10}
                  onPress={() => {
                    setHideShow( false )
                    setSelectedAccount( value )
                  }}
                  style={styles.dropDownElement}
                >
                  {value.accountType != '' && (
                    <Image
                      source={value.image}
                      style={{
                        width: wp( '8%' ), height: wp( '8%' )
                      }}
                    />
                  )}
                  <View style={{
                    flex: 1, marginLeft: 10
                  }}>
                    <Text style={styles.dropDownElementTitleText}>
                      {value.accountName}
                    </Text>
                    {value.accountType != '' && (
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'flex-end',
                        }}
                      >
                        <Image
                          style={styles.cardBitCoinImage}
                          source={require( '../../assets/images/icons/icon_bitcoin_gray.png' )}
                        />
                        <Text style={styles.cardAmountText}>
                          {value.accountType === REGULAR_ACCOUNT
                            ? UsNumberFormat( balances.regularBalance )
                            : UsNumberFormat( balances.secureBalance )}
                        </Text>
                        <Text style={styles.cardAmountUnitText}>sats</Text>
                      </View>
                    )}
                  </View>
                  <View
                    style={{
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Entypo
                      name={'dots-three-horizontal'}
                      color={Colors.borderColor}
                      size={RFValue( 13 )}
                    />
                  </View>
                </TouchableOpacity>
              )
            } )}
          </View>
        ) : null}
        {!isUserRegistered ? (
          <View
            style={{
              marginBottom: -20,
            }}
          >
            <View
              style={{
                marginBottom: 25,
                padding: 20,
                backgroundColor: props.backgroundColor
                  ? props.backgroundColor
                  : Colors.backgroundColor,
                marginLeft: 20,
                marginRight: 20,
                borderRadius: 10,
                justifyContent: 'center',
              }}
            >
              <Text
                style={{
                  color: props.titleColor ? props.titleColor : Colors.blue,
                  fontSize: RFValue( 13 ),
                  marginBottom: 2,
                  fontFamily: Fonts.FiraSansRegular,
                }}
              >
                {'Already registered with FastBitcoins?'}
              </Text>
              <View style={{
                flexDirection: 'row'
              }}>
                <Text
                  style={{
                    color: Colors.textColorGrey,
                    fontSize: RFValue( 12 ),
                    fontFamily: Fonts.FiraSansRegular,
                  }}
                >
                  {
                    'Go to your FastBitcoins.com account on this device and choose Hexa from "Linked Wallets"'
                  }
                </Text>
              </View>
            </View>
          </View>
        ) : null}
        <Text
          style={{
            marginTop: 'auto',
            marginBottom: 10,
            paddingLeft: 20,
            paddingRight: 15,
            fontSize: RFValue( 11 ),
            fontFamily: Fonts.FiraSansMedium,
            color: Colors.textColorGrey,
          }}
        >
          {TextHideShow ? 'Deposit Account' : ''}
        </Text>
      </KeyboardAvoidingView>
      <View
        style={{
          marginBottom: hp( '2%' ),
        }}
      >
        <TouchableOpacity
          activeOpacity={10}
          onPress={() => {
            setHideShow( !hideShow )
          }}
          style={{
            ...styles.dropDownElement,
            borderRadius: 10,
            marginLeft: 20,
            marginRight: 20,
            marginBottom: 20,
          }}
        >
          {selectedAccount && selectedAccount.accountType != '' && (
            <Image
              source={selectedAccount.image}
              style={{
                width: wp( '8%' ), height: wp( '8%' )
              }}
            />
          )}
          <View style={{
            flex: 1, marginLeft: 10
          }}>
            <Text style={styles.dropDownElementTitleText}>
              {selectedAccount && selectedAccount.accountName
                ? selectedAccount.accountName
                : ''}
            </Text>
            {selectedAccount && selectedAccount.accountType != '' && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-end',
                }}
              >
                <Image
                  style={styles.cardBitCoinImage}
                  source={require( '../../assets/images/icons/icon_bitcoin_gray.png' )}
                />
                <Text style={styles.cardAmountText}>
                  {selectedAccount &&
                  selectedAccount.accountType === REGULAR_ACCOUNT
                    ? UsNumberFormat( balances.regularBalance )
                    : UsNumberFormat( balances.secureBalance )}
                </Text>
                <Text style={styles.cardAmountUnitText}>sats</Text>
              </View>
            )}
          </View>
          <View style={{
            justifyContent: 'center', alignItems: 'center'
          }}>
            <Entypo
              name={'dots-three-horizontal'}
              color={Colors.borderColor}
              size={RFValue( 13 )}
            />
          </View>
        </TouchableOpacity>
      </View>
      {showLoader ? <Loader isLoading={true} /> : null}
      <BottomSheet
        enabledGestureInteraction={false}
        enabledInnerScrolling={true}
        ref={RegistrationSuccessBottomSheet as any}
        snapPoints={[
          -50,
          Platform.OS == 'ios' && DeviceInfo.hasNotch() ? hp( '35%' ) : hp( '40%' ),
        ]}
        renderContent={renderRegistrationSuccessModalContent}
        renderHeader={renderRegistrationSuccessModalHeader}
      />
      <BottomSheet
        enabledInnerScrolling={true}
        enabledGestureInteraction={false}
        ref={ErrorModalBottomSheet as any}
        snapPoints={[
          -50,
          Platform.OS == 'ios' && DeviceInfo.hasNotch() ? hp( '35%' ) : hp( '40%' ),
        ]}
        renderContent={renderErrorModalContent}
        renderHeader={renderErrorModalHeader}
      />
      {QuoteDetails && (
        <BottomSheet
          enabledInnerScrolling={true}
          enabledGestureInteraction={false}
          ref={QuoteBottomSheet as any}
          snapPoints={[
            -50,
            Platform.OS == 'ios' && DeviceInfo.hasNotch()
              ? hp( '55%' )
              : hp( '60%' ),
          ]}
          renderContent={renderQuoteModalContent}
          renderHeader={renderQuoteModalHeader}
        />
      )}
      <BottomSheet
        enabledInnerScrolling={true}
        enabledGestureInteraction={false}
        ref={VoucherRedeemSuccessBottomSheet as any}
        snapPoints={[
          -50,
          Platform.OS == 'ios' && DeviceInfo.hasNotch() ? hp( '55%' ) : hp( '60%' ),
        ]}
        renderContent={renderVoucherRedeemSuccessModalContent}
        renderHeader={renderVoucherRedeemSuccessModalHeader}
      />
      <BottomSheet
        enabledInnerScrolling={true}
        enabledGestureInteraction={false}
        ref={AccountVerificationBottomSheet as any}
        snapPoints={[
          -50,
          Platform.OS == 'ios' && DeviceInfo.hasNotch() ? hp( '35%' ) : hp( '40%' ),
        ]}
        renderContent={renderAccountVerificationModalContent}
        renderHeader={renderAccountVerificationModalHeader}
      />
    </View>
  )
}

const styles = StyleSheet.create( {
  backArrowView: {
    height: 30,
    width: 30,
    justifyContent: 'center',
  },
  cameraView: {
    width: wp( '90%' ),
    height: wp( '90%' ),
    overflow: 'hidden',
    borderRadius: 20,
    alignSelf: 'center',
  },
  camera: {
    width: wp( '90%' ),
    height: wp( '90%' ),
  },
  topCornerView: {
    flexDirection: 'row',
    paddingTop: 12,
    paddingRight: 12,
    paddingLeft: 12,
    width: '100%',
  },
  bottomCornerView: {
    marginTop: 'auto',
    flexDirection: 'row',
    paddingBottom: 12,
    paddingRight: 12,
    paddingLeft: 12,
    width: '100%',
  },
  topLeftCornerView: {
    borderLeftWidth: 1,
    borderTopColor: 'white',
    borderLeftColor: 'white',
    height: hp( '5%' ),
    width: hp( '5%' ),
    borderTopWidth: 1,
  },
  topRightCornerView: {
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderRightColor: 'white',
    borderTopColor: 'white',
    height: hp( '5%' ),
    width: hp( '5%' ),
    marginLeft: 'auto',
  },
  bottomLeftCornerView: {
    borderLeftWidth: 1,
    borderBottomColor: 'white',
    borderLeftColor: 'white',
    height: hp( '5%' ),
    width: hp( '5%' ),
    borderBottomWidth: 1,
  },
  bottomRightCornerView: {
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderRightColor: 'white',
    borderBottomColor: 'white',
    height: hp( '5%' ),
    width: hp( '5%' ),
    marginLeft: 'auto',
  },
  cameraImage: {
    width: wp( '90%' ),
    height: wp( '90%' ),
    overflow: 'hidden',
    borderRadius: 20,
  },
  cardBitCoinImage: {
    width: wp( '4%' ),
    height: wp( '4%' ),
    marginRight: 5,
    resizeMode: 'contain',
    marginBottom: wp( '1%' ),
  },
  cardAmountText: {
    color: Colors.black,
    fontFamily: Fonts.FiraSansRegular,
    fontSize: RFValue( 17 ),
    marginRight: 5,
    marginTop: 'auto',
    lineHeight: RFValue( 17 ),
  },
  cardAmountUnitText: {
    color: Colors.textColorGrey,
    fontFamily: Fonts.FiraSansRegular,
    fontSize: RFValue( 11 ),
    marginTop: 'auto',
    lineHeight: RFValue( 17 ),
  },
  dropDownElement: {
    backgroundColor: Colors.backgroundColor,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: wp( '5%' ),
    paddingBottom: wp( '5%' ),
    paddingLeft: wp( '3%' ),
    paddingRight: wp( '3%' ),
    width: wp( '90%' ),
  },
  dropDownView: {
    marginBottom: 10,
    position: 'absolute',
    bottom: 0,
    zIndex: 999,
    backgroundColor: Colors.white,
    marginLeft: wp( '5%' ),
    marginRight: wp( '5%' ),
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    overflow: 'hidden',
  },
  dropDownElementTitleText: {
    color: Colors.blue,
    fontFamily: Fonts.FiraSansRegular,
    fontSize: RFValue( 13 ),
    marginBottom: 5,
  },
  qrModalTextInput: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.backgroundColor,
    height: 50,
    margin: 20,
    paddingLeft: 15,
    paddingRight: 15,
    fontSize: RFValue( 11 ),
    fontFamily: Fonts.FiraSansMedium,
  },
} )

export default VoucherScanner
