import React, { createRef, PureComponent } from 'react'
import {
  View,
  StyleSheet,
  StatusBar,
  ImageBackground,
  Platform,
  AsyncStorage,
  Linking,
  Alert,
  Image,
  AppState,
  InteractionManager
} from 'react-native'
import { Easing } from 'react-native-reanimated'
import { heightPercentageToDP, widthPercentageToDP } from 'react-native-responsive-screen'
import DeviceInfo from 'react-native-device-info'
import CustodianRequestRejectedModalContents from '../../components/CustodianRequestRejectedModalContents'
import * as RNLocalize from 'react-native-localize'
import { BottomSheetView } from '@gorhom/bottom-sheet'
import Colors from '../../common/Colors'
import ButtonStyles from '../../common/Styles/ButtonStyles'
import {
  TEST_ACCOUNT,
  REGULAR_ACCOUNT,
  SECURE_ACCOUNT,
  FAST_BITCOINS,
} from '../../common/constants/serviceTypes'
import { connect } from 'react-redux'
import { downloadMShare, uploadRequestedShare } from '../../store/actions/sss'
import { createRandomString } from '../../common/CommonFunctions/timeFormatter'
import {
  approveTrustedContact,
  fetchEphemeralChannel,
  fetchTrustedChannel,
  clearPaymentDetails,
  postRecoveryChannelSync,
} from '../../store/actions/trustedContacts'
import {
  updateFCMTokens,
  fetchNotifications,
  notificationsUpdated,
} from '../../store/actions/notifications'
import { setCurrencyCode } from '../../store/actions/preferences'
import { getCurrencyImageByRegion, isEmpty,  buildVersionExists } from '../../common/CommonFunctions/index'
import ErrorModalContents from '../../components/ErrorModalContents'
import Toast from '../../components/Toast'
import PushNotification from 'react-native-push-notification'
import NotificationListContent from '../../components/NotificationListContent'
import { timeFormatter } from '../../common/CommonFunctions/timeFormatter'
import RelayServices from '../../bitcoin/services/RelayService'
import AddContactAddressBook from '../Contacts/AddContactAddressBook'
import config from '../../bitcoin/HexaConfig'
import TrustedContactsService from '../../bitcoin/services/TrustedContactsService'
import HomeHeader from '../../components/home/home-header'
import idx from 'idx'
import CustomBottomTabs, {
  BottomTab,
  TAB_BAR_HEIGHT,
} from '../../components/home/custom-bottom-tabs'
import {
  addTransferDetails,
  autoSyncShells,
  addNewAccountShell
} from '../../store/actions/accounts'
import { trustedChannelActions } from '../../bitcoin/utilities/Interface'
import moment from 'moment'
import { withNavigationFocus } from 'react-navigation'
import CustodianRequestModalContents from '../../components/CustodianRequestModalContents'
import semver from 'semver'
import {
  updatePreference,
  setFCMToken,
  setSecondaryDeviceAddress,
} from '../../store/actions/preferences'
import Bitcoin from '../../bitcoin/utilities/accounts/Bitcoin'
import TrustedContactRequestContent from './TrustedContactRequestContent'
import BottomSheetBackground from '../../components/bottom-sheets/BottomSheetBackground'
import BottomSheetHeader from '../Accounts/BottomSheetHeader'
import { Button } from 'react-native-elements'
import checkAppVersionCompatibility from '../../utils/CheckAppVersionCompatibility'
import defaultBottomSheetConfigs from '../../common/configs/BottomSheetConfigs'
import BottomSheet from '@gorhom/bottom-sheet'
import { resetToHomeAction } from '../../navigation/actions/NavigationActions'
import { Milliseconds } from '../../common/data/typealiases/UnitAliases'
import { SATOSHIS_IN_BTC } from '../../common/constants/Bitcoin'
import { getEnvReleaseTopic } from '../../utils/geEnvSpecificParams'
import { AccountsState } from '../../store/reducers/accounts'
import HomeAccountCardsList from './HomeAccountCardsList'
import AccountShell from '../../common/data/models/AccountShell'
import PushNotificationIOS from '@react-native-community/push-notification-ios'
import SourceAccountKind from '../../common/data/enums/SourceAccountKind'
import TransactionDescribing from '../../common/data/models/Transactions/Interfaces'
import messaging from '@react-native-firebase/messaging'
import firebase from '@react-native-firebase/app'
import ExternalServiceSubAccountInfo from '../../common/data/models/SubAccountInfo/ExternalServiceSubAccountInfo'
import BuyBitcoinHomeBottomSheet, { BuyBitcoinBottomSheetMenuItem, BuyMenuItemKind } from '../../components/home/BuyBitcoinHomeBottomSheet'
import BottomSheetWyreInfo from '../../components/bottom-sheets/wyre/BottomSheetWyreInfo'
import BottomSheetRampInfo from '../../components/bottom-sheets/ramp/BottomSheetRampInfo'
import ServiceAccountKind from '../../common/data/enums/ServiceAccountKind'
import { setVersion } from '../../store/actions/versionHistory'
import { clearRampCache } from '../../store/actions/RampIntegration'
import { clearWyreCache } from '../../store/actions/WyreIntegration'

export const BOTTOM_SHEET_OPENING_ON_LAUNCH_DELAY: Milliseconds = 800

export enum BottomSheetState {
  Closed,
  Open,
}

export enum BottomSheetKind {
  TAB_BAR_BUY_MENU,
  CUSTODIAN_REQUEST,
  CUSTODIAN_REQUEST_REJECTED,
  TRUSTED_CONTACT_REQUEST,
  ADD_CONTACT_FROM_ADDRESS_BOOK,
  NOTIFICATIONS_LIST,
  WYRE_STATUS_INFO,
  RAMP_STATUS_INFO,
  ERROR,
}

interface HomeStateTypes {
  notificationLoading: boolean;
  notificationData?: any[];
  CurrencyCode: string;
  netBalance: number;
  selectedBottomTab: BottomTab | null;

  bottomSheetState: BottomSheetState;
  currentBottomSheetKind: BottomSheetKind | null;

  secondaryDeviceOtp: any;
  currencyCode: string;
  errorMessageHeader: string;
  errorMessage: string;
  selectedContact: any[];
  notificationDataChange: boolean;
  appState: string;
  trustedContactRequest: any;
  recoveryRequest: any;
  custodyRequest: any;
  isLoadContacts: boolean;
  lastActiveTime: string;
  wyreDeepLinkContent: string | null;
  rampDeepLinkContent: string | null;
  rampFromBuyMenu: boolean | null;
  rampFromDeepLink: boolean | null;
  wyreFromBuyMenu: boolean | null;
  wyreFromDeepLink: boolean | null;
}

interface HomePropsTypes {
  navigation: any;
  notificationList: any[];
  exchangeRates?: any[];

  accountsState: AccountsState;
  currentWyreSubAccount: ExternalServiceSubAccountInfo | null;
  currentRampSubAccount: ExternalServiceSubAccountInfo | null;

  walletName: string;
  UNDER_CUSTODY: any;
  fetchNotifications: any;
  updateFCMTokens: any;
  postRecoveryChannelSync: any;
  downloadMShare: any;
  approveTrustedContact: any;
  fetchTrustedChannel: any;
  fetchEphemeralChannel: any;
  uploadRequestedShare: any;
  s3Service: any;
  overallHealth: any;
  autoSyncShells: any;
  clearWyreCache: any;
  clearRampCache: any;
  addNewAccountShell: any;
  addTransferDetails: any;
  paymentDetails: any;
  clearPaymentDetails: any;
  trustedContacts: TrustedContactsService;
  isFocused: boolean;
  notificationListNew: any;
  notificationsUpdated: any;
  setCurrencyCode: any;
  currencyCode: any;
  updatePreference: any;
  fcmTokenValue: any;
  setFCMToken: any;
  setSecondaryDeviceAddress: any;
  secondaryDeviceAddressValue: any;
  releaseCasesValue: any;
  setVersion: any;
  versionHistory: any;
  wyreDeepLinkContent: string | null;
  rampDeepLinkContent: string | null;
  rampFromBuyMenu: boolean | null;
  rampFromDeepLink: boolean | null;
  wyreFromBuyMenu: boolean | null;
  wyreFromDeepLink: boolean | null;
}

const releaseNotificationTopic = getEnvReleaseTopic()

class Home extends PureComponent<HomePropsTypes, HomeStateTypes> {
  focusListener: any;
  appStateListener: any;
  firebaseNotificationListener: any;
  notificationOpenedListener: any;

  bottomSheetRef = createRef<BottomSheet>();
  openBottomSheetOnLaunchTimeout: null | ReturnType<typeof setTimeout>;

  static whyDidYouRender = true;

  constructor( props ) {
    super( props )

    this.focusListener = null
    this.appStateListener = null
    this.openBottomSheetOnLaunchTimeout = null

    this.state = {
      notificationData: [],
      CurrencyCode: 'USD',
      netBalance: 0,
      selectedBottomTab: null,
      bottomSheetState: BottomSheetState.Closed,
      currentBottomSheetKind: null,
      secondaryDeviceOtp: {
      },
      currencyCode: 'USD',
      errorMessageHeader: '',
      errorMessage: '',
      selectedContact: [],
      notificationDataChange: false,
      appState: '',
      trustedContactRequest: null,
      recoveryRequest: null,
      custodyRequest: null,
      isLoadContacts: false,
      lastActiveTime: moment().toISOString(),
      notificationLoading: true,
      wyreDeepLinkContent: null,
      rampDeepLinkContent: null,
      rampFromBuyMenu: null,
      rampFromDeepLink: null,
      wyreFromBuyMenu: null,
      wyreFromDeepLink: null
    }
  }

  navigateToAddNewAccountScreen = () => {
    this.props.navigation.navigate( 'AddNewAccount' )
  };

  onPressNotifications = async () => {
    const notificationList = JSON.parse(
      await AsyncStorage.getItem( 'notificationList' ),
    )
    const tmpList = []
    if ( notificationList ) {
      for ( let i = 0; i < notificationList.length; i++ ) {
        const element = notificationList[ i ]
        const obj = {
          ...element,
          read: element.isMandatory ? false : true,
        }
        tmpList.push( obj )
      }
    }
    await AsyncStorage.setItem( 'notificationList', JSON.stringify( tmpList ) )
    tmpList.sort( function ( left, right ) {
      return moment.utc( right.date ).unix() - moment.utc( left.date ).unix()
    } )
    this.setState( {
      notificationData: tmpList,
      notificationDataChange: !this.state.notificationDataChange,
    } )
    setTimeout( () => {
      this.setState( {
        notificationLoading: false
      } )
    }, 500 )

    this.openBottomSheetOnLaunch( BottomSheetKind.NOTIFICATIONS_LIST )
  };

  processQRData = async ( qrData ) => {
    const { accountsState, addTransferDetails, navigation } = this.props

    const network = Bitcoin.networkType( qrData )
    if ( network ) {
      const serviceType =
        network === 'MAINNET' ? REGULAR_ACCOUNT : TEST_ACCOUNT // default service type

      const service = accountsState[ serviceType ].service
      const { type } = service.addressDiff( qrData )
      if ( type ) {
        let item
        switch ( type ) {
            case 'address':
              const recipientAddress = qrData
              item = {
                id: recipientAddress,
              }

              addTransferDetails( serviceType, {
                selectedContact: item,
              } )
              navigation.navigate( 'SendToContact', {
                selectedContact: item,
                serviceType,
              } )
              break

            case 'paymentURI':
              let address, options, donationId
              try {
                const res = service.decodePaymentURI( qrData )
                address = res.address
                options = res.options

                // checking for donationId to send note
                if ( options && options.message ) {
                  const rawMessage = options.message
                  donationId = rawMessage.split( ':' ).pop().trim()
                }
              } catch ( err ) {
                Alert.alert( 'Unable to decode payment URI' )
                return
              }

              item = {
                id: address,
              }

              addTransferDetails( serviceType, {
                selectedContact: item,
              } )

              navigation.navigate( 'SendToContact', {
                selectedContact: item,
                serviceType,
                bitcoinAmount: options.amount
                  ? `${Math.round( options.amount * SATOSHIS_IN_BTC )}`
                  : '',
                donationId,
              } )
              break

            default:
              Toast( 'Invalid QR' )
              break
        }

        return
      }
    }

    try {
      const scannedData = JSON.parse( qrData )

      if ( scannedData.ver ) {
        const isAppVersionCompatible = await checkAppVersionCompatibility( {
          relayCheckMethod: scannedData.type,
          version: scannedData.ver,
        } )

        if ( !isAppVersionCompatible ) {
          return
        }
      }

      switch ( scannedData.type ) {
          case 'trustedGuardian':
            const trustedGuardianRequest = {
              isGuardian: scannedData.isGuardian,
              approvedTC: scannedData.approvedTC,
              requester: scannedData.requester,
              publicKey: scannedData.publicKey,
              info: scannedData.info,
              uploadedAt: scannedData.uploadedAt,
              type: scannedData.type,
              isQR: true,
              version: scannedData.ver,
            }
            this.setState(
              {
                secondaryDeviceOtp: trustedGuardianRequest,
                trustedContactRequest: trustedGuardianRequest,
                recoveryRequest: null,
                isLoadContacts: true,
              },
              () => {
                navigation.goBack()

                this.openBottomSheetOnLaunch(
                  BottomSheetKind.TRUSTED_CONTACT_REQUEST,
                  1,
                )
              },
            )

            break

          case 'secondaryDeviceGuardian':
            const secondaryDeviceGuardianRequest = {
              isGuardian: scannedData.isGuardian,
              requester: scannedData.requester,
              publicKey: scannedData.publicKey,
              info: scannedData.info,
              uploadedAt: scannedData.uploadedAt,
              type: scannedData.type,
              isQR: true,
              version: scannedData.ver,
            }

            this.setState(
              {
                secondaryDeviceOtp: secondaryDeviceGuardianRequest,
                trustedContactRequest: secondaryDeviceGuardianRequest,
                recoveryRequest: null,
              },
              () => {
                this.openBottomSheetOnLaunch(
                  BottomSheetKind.TRUSTED_CONTACT_REQUEST,
                  1,
                )
              },
            )

            break

          case 'trustedContactQR':
            const tcRequest = {
              requester: scannedData.requester,
              publicKey: scannedData.publicKey,
              info: scannedData.info,
              type: scannedData.type,
              isQR: true,
              version: scannedData.ver,
            }

            this.setState(
              {
                secondaryDeviceOtp: tcRequest,
                trustedContactRequest: tcRequest,
                recoveryRequest: null,
              },
              () => {
                this.openBottomSheetOnLaunch(
                  BottomSheetKind.TRUSTED_CONTACT_REQUEST,
                  1,
                )
              },
            )

            break

          case 'paymentTrustedContactQR':
            const paymentTCRequest = {
              isPaymentRequest: true,
              requester: scannedData.requester,
              publicKey: scannedData.publicKey,
              info: scannedData.info,
              type: scannedData.type,
              isQR: true,
              version: scannedData.ver,
            }

            this.setState(
              {
                secondaryDeviceOtp: paymentTCRequest,
                trustedContactRequest: paymentTCRequest,
                recoveryRequest: null,
              },
              () => {
                this.openBottomSheetOnLaunch(
                  BottomSheetKind.TRUSTED_CONTACT_REQUEST,
                  1,
                )
              },
            )

            break

          case 'recoveryQR':
            const recoveryRequest = {
              isRecovery: true,
              requester: scannedData.requester,
              publicKey: scannedData.KEY,
              isQR: true,
            }
            this.setState(
              {
                recoveryRequest: recoveryRequest,
                trustedContactRequest: null,
              },
              () => {
                this.openBottomSheetOnLaunch(
                  BottomSheetKind.TRUSTED_CONTACT_REQUEST,
                  1,
                )
              },
            )
            break

          case 'ReverseRecoveryQR':
            Alert.alert(
              'Restoration QR Identified',
              'Restoration QR only works during restoration mode',
            )
            break

          default:
            break
      }
    } catch ( err ) {
      console.log( err )
      Toast( 'Invalid QR' )
    }
  };

  scheduleNotification = async () => {
    PushNotification.cancelAllLocalNotifications()
    const channelIdRandom = moment().valueOf()

    PushNotification.createChannel(
      {
        channelId: `${channelIdRandom}`,
        channelName: 'reminder',
        channelDescription: 'A channel to categorise your notifications',
        playSound: false,
        soundName: 'default',
        importance: 4, // (optional) default: 4. Int value of the Android notification importance
        vibrate: true, // (optional) default: true. Creates the default vibration patten if true.
      },
      ( created ) => console.log( `createChannel returned '${created}'` ) // (optional) callback returns whether the channel was created, false means it already existed.
    )
    const date = new Date()
    date.setHours( date.getHours() + config.NOTIFICATION_HOUR )

    //let date =  new Date(Date.now() + (3 * 60 * 1000));
    PushNotification.localNotificationSchedule( {
      channelId: channelIdRandom,
      vibrate: true,
      vibration: 300,
      priority: 'high',
      showWhen: true,
      autoCancel: true,
      soundName: 'default',
      title: 'We have not seen you in a while!',
      message: 'Opening your app regularly ensures you get all the notifications and security updates', // (required)
      date: date,
      repeatType: 'day',
      allowWhileIdle: true, // (optional) set notification to work while on doze, default: false
    } )

    PushNotification.getScheduledLocalNotifications( ( notiifcations )=>{
      console.log( 'SCHEDULE notiifcations', notiifcations )
    } )

  };

  localNotification = async ( notificationDetails ) => {
    const channelIdRandom = moment().valueOf()
    PushNotification.createChannel(
      {
        channelId: `${channelIdRandom}`,
        channelName: 'reminder',
        channelDescription: 'A channel to categorise your notifications',
        playSound: false,
        soundName: 'default',
        importance: 4, // (optional) default: 4. Int value of the Android notification importance
        vibrate: true, // (optional) default: true. Creates the default vibration patten if true.
      },
      ( created ) => console.log( `createChannel localNotification returned '${created}'` ) // (optional) callback returns whether the channel was created, false means it already existed.
    )

    PushNotification.localNotification( {
      /* Android Only Properties */
      channelId: `${channelIdRandom}`,
      showWhen: true, // (optional) default: true
      autoCancel: true, // (optional) default: true
      vibrate: true, // (optional) default: true
      vibration: 300, // vibration length in milliseconds, ignored if vibrate=false, default: 1000
      priority: 'high', // (optional) set notification priority, default: high

      /* iOS and Android properties */
      id: notificationDetails.id,
      title: notificationDetails.title,
      message: notificationDetails.body,
      soundName: 'default',
    } )
  };

  bootStrapNotifications = async () => {
    if ( Platform.OS === 'ios' ) {
      firebase
        .messaging()
        .hasPermission()
        .then( enabled => {
          if ( enabled ) {
            this.storeFCMToken()
            this.scheduleNotification()
            this.createNotificationListeners()
          } else {
            firebase
              .messaging()
              .requestPermission( {
                provisional: true
              } )
              .then( () => {
                this.storeFCMToken()
                this.scheduleNotification()
                this.createNotificationListeners()
              } )
              .catch( () => {
                console.log( 'Permission rejected.' )
              } )
          }
        } )
        .catch()
    } else {
      this.storeFCMToken()
      this.scheduleNotification()
      this.createNotificationListeners()
    }
  };

  storeFCMToken = async () => {
    const fcmToken = await messaging().getToken()
    console.log( 'TOKEN', fcmToken )
    const fcmArray = [ fcmToken ]
    const fcmTokenFromAsync = this.props.fcmTokenValue
    if ( !fcmTokenFromAsync || fcmTokenFromAsync != fcmToken ) {
      this.props.setFCMToken( fcmToken )

      await AsyncStorage.setItem( 'fcmToken', fcmToken )
      this.props.updateFCMTokens( fcmArray )

      AsyncStorage.getItem( 'walletRecovered' ).then( ( recovered ) => {
        // updates the new FCM token to channels post recovery
        if ( recovered ) {
          this.props.postRecoveryChannelSync()
        }
      } )
    }
  };

  createNotificationListeners = async () => {
    PushNotification.configure( {
      onNotification: ( notification ) => {
        console.log( 'NOTIFICATION:', notification )
        // process the notification
        if( notification.data ){
          this.props.fetchNotifications()
          this.onNotificationOpen( notification )
          // (required) Called when a remote is received or opened, or local notification is opened
          notification.finish( PushNotificationIOS.FetchResult.NoData )
        }
      },

      // (optional) Called when Registered Action is pressed and invokeApp is false, if true onNotification will be called (Android)
      onAction: ( notification ) => {
        console.log( 'ACTION:', notification.action )
        console.log( 'NOTIFICATION:', notification )

        // process the action
      },

      // (optional) Called when the user fails to register for remote notifications. Typically occurs when APNS is having issues, or the device is a simulator. (iOS)
      onRegistrationError: ( err ) => {
        console.error( err.message, err )
      },

      // IOS ONLY (optional): default: all - Permissions to register.
      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },

      // Should the initial notification be popped automatically
      // default: true
      popInitialNotification: true,

      /**
       * (optional) default: true
       * - Specified if permissions (ios) and token (android and ios) will requested or not,
       * - if not, you must call PushNotificationsHandler.requestPermissions() later
       * - if you are not using remote notification or do not have Firebase installed, use this:
       *     requestPermissions: Platform.OS === 'ios'
       */
      requestPermissions: true,
    } )
  };

  onNotificationOpen = async ( item ) => {
    console.log( 'item', item )
    const content = JSON.parse( item.data.content )
    // let asyncNotificationList = notificationListNew;
    let asyncNotificationList = JSON.parse(
      await AsyncStorage.getItem( 'notificationList' ),
    )
    if ( !asyncNotificationList ) {
      asyncNotificationList = []
    }
    let readStatus = true
    if ( content.notificationType == releaseNotificationTopic ) {
      const releaseCases = this.props.releaseCasesValue
      //JSON.parse(await AsyncStorage.getItem('releaseCases'));
      if ( releaseCases.ignoreClick ) {
        readStatus = true
      } else if ( releaseCases.remindMeLaterClick ) {
        readStatus = false
      } else {
        readStatus = false
      }
    }
    const obj = {
      type: content.notificationType,
      isMandatory: false,
      read: readStatus,
      title: item.title,
      time: timeFormatter( moment( new Date() ), moment( new Date() ).valueOf() ),
      date: new Date(),
      info: item.body,
      notificationId: content.notificationId,
    }
    asyncNotificationList.push( obj )
    // this.props.notificationsUpdated(asyncNotificationList);

    await AsyncStorage.setItem(
      'notificationList',
      JSON.stringify( asyncNotificationList ),
    )
    asyncNotificationList.sort( function ( left, right ) {
      return moment.utc( right.date ).unix() - moment.utc( left.date ).unix()
    } )
    this.setState( {
      notificationData: asyncNotificationList,
      notificationDataChange: !this.state.notificationDataChange,
    } )
    this.onPressNotifications()
  };

  onAppStateChange = async ( nextAppState ) => {
    const { appState } = this.state
    try {
      // TODO: Will this function ever be called if the state wasn't different? If not,
      // I don't think we need to be holding on to `appState` in this component's state.
      if ( appState === nextAppState ) return
      this.setState(
        {
          appState: nextAppState,
        },
        async () => {
          if ( nextAppState === 'active' ) {
            this.scheduleNotification()
          }
          if ( nextAppState === 'inactive' || nextAppState == 'background' ) {
            this.props.updatePreference( {
              key: 'hasShownNoInternetWarning',
              value: false,
            } )
          }
        },
      )
    } catch ( error ) {
      // do nothing
    }
  };

  componentDidMount = () => {
    const { navigation, versionHistory } = this.props
    const versionData = []
    this.closeBottomSheet()
    this.calculateNetBalance()

    this.appStateListener = AppState.addEventListener(
      'change',
      this.onAppStateChange,
    )

    this.bootStrapNotifications()
    this.setUpFocusListener()
    this.getNewTransactionNotifications()

    Linking.addEventListener( 'url', this.handleDeepLinkEvent )
    Linking.getInitialURL().then( this.handleDeepLinking )

    // call this once deeplink is detected aswell
    this.handleDeepLinkModal()

    const unhandledDeepLinkURL = navigation.getParam( 'unhandledDeepLinkURL' )

    if ( unhandledDeepLinkURL ) {
      navigation.setParams( {
        unhandledDeepLinkURL: null
      } )
      this.handleDeepLinking( unhandledDeepLinkURL )
    }
    InteractionManager.runAfterInteractions( () => {
      // This will sync balances and transactions for all account shells
      this.props.autoSyncShells()
      this.props.setVersion()
    } )
  };

  getNewTransactionNotifications = async () => {
    const newTransactions = []
    const { accountsState } = this.props
    const regularAccount = accountsState[ REGULAR_ACCOUNT ].service.hdWallet
    const secureAccount = accountsState[ SECURE_ACCOUNT ].service.secureHDWallet
    // console.log( ':regularAccount', regularAccount )

    const newTransactionsRegular =
      regularAccount.derivativeAccounts[ FAST_BITCOINS ][ 1 ] &&
      regularAccount.derivativeAccounts[ FAST_BITCOINS ][ 1 ].newTransactions
    const newTransactionsSecure =
      secureAccount.derivativeAccounts[ FAST_BITCOINS ][ 1 ] &&
      secureAccount.derivativeAccounts[ FAST_BITCOINS ][ 1 ].newTransactions
    // console.log( ':newTransactionsRegular', newTransactionsRegular )
    if ( newTransactionsRegular && newTransactionsRegular.length )
      newTransactions.push( ...newTransactionsRegular )
    if ( newTransactionsSecure && newTransactionsSecure.length )
      newTransactions.push( ...newTransactionsSecure )

    if ( newTransactions.length ) {
      // let asyncNotification = notificationListNew;
      const asyncNotification = JSON.parse(
        await AsyncStorage.getItem( 'notificationList' ),
      )
      let asyncNotificationList = []
      if ( asyncNotification.length ) {
        asyncNotificationList = []
        for ( let i = 0; i < asyncNotification.length; i++ ) {
          asyncNotificationList.push( asyncNotification[ i ] )
        }
      }

      for ( let i = 0; i < newTransactions.length; i++ ) {
        let present = false
        for ( const tx of asyncNotificationList ) {
          if (
            tx.notificationsData &&
            newTransactions[ i ].txid === tx.notificationsData.txid
          )
            present = true
        }
        if ( present ) continue

        const obj = {
          type: 'contact',
          isMandatory: false,
          read: false,
          title: 'Alert from FastBitcoins',
          time: timeFormatter( moment( new Date() ), moment( new Date() ).valueOf() ),
          date: new Date(),
          info: 'You have a new transaction',
          notificationId: createRandomString( 17 ),
          notificationsData: newTransactions[ i ],
        }
        asyncNotificationList.push( obj )
        const notificationDetails = {
          id: obj.notificationId,
          title: obj.title,
          body: obj.info,
        }
        console.log( ':asyncNotificationList', asyncNotificationList )

        this.localNotification( notificationDetails )
      }
      //this.props.notificationsUpdated(asyncNotificationList);
      await AsyncStorage.setItem(
        'notificationList',
        JSON.stringify( asyncNotificationList ),
      )
      asyncNotificationList.sort( function ( left, right ) {
        return moment.utc( right.date ).unix() - moment.utc( left.date ).unix()
      } )
      setTimeout( () => {
        this.setState( {
          notificationData: asyncNotificationList,
          notificationDataChange: !this.state.notificationDataChange,
        } )
      }, 2 )
    }
  };


  componentDidUpdate = ( prevProps ) => {
    if (
      prevProps.notificationList !== this.props.notificationList ||
      prevProps.releaseCasesValue !== this.props.releaseCasesValue
    ) {
      this.setupNotificationList()
    }

    if ( prevProps.accountsState.accountShells !== this.props.accountsState.accountShells ) {
      this.calculateNetBalance()
      // this.getNewTransactionNotifications()
    }

    if ( prevProps.fcmTokenValue !== this.props.fcmTokenValue ) {
      this.storeFCMToken()
    }

    if (
      prevProps.secondaryDeviceAddressValue !==
      this.props.secondaryDeviceAddressValue
    ) {
      this.setSecondaryDeviceAddresses()
    }

    if ( this.props.paymentDetails !== null && this.props.paymentDetails ) {
      const serviceType = REGULAR_ACCOUNT
      const {
        paymentDetails,
        accountsState,
        navigation,
        addTransferDetails,
        clearPaymentDetails,
      } = this.props
      let { address, paymentURI } = paymentDetails
      let options: any = {
      }
      if ( paymentURI ) {
        try {
          const details = accountsState[ serviceType ].service.decodePaymentURI(
            paymentURI,
          )
          address = details.address
          options = details.options
        } catch ( err ) {
          Alert.alert( 'Unable to decode payment URI' )
          return
        }
      }

      const item = {
        id: address,
      }

      addTransferDetails( serviceType, {
        selectedContact: item,
      } )

      clearPaymentDetails()

      navigation.navigate( 'SendToContact', {
        selectedContact: item,
        serviceType,
        bitcoinAmount: options.amount
          ? `${Math.round( options.amount * SATOSHIS_IN_BTC )}`
          : '',
      } )
    }
  };

  handleDeepLinkModal = () => {
    const custodyRequest = this.props.navigation.getParam( 'custodyRequest' )
    const recoveryRequest = this.props.navigation.getParam( 'recoveryRequest' )
    const trustedContactRequest = this.props.navigation.getParam(
      'trustedContactRequest',
    )
    const userKey = this.props.navigation.getParam( 'userKey' )

    if ( custodyRequest ) {
      this.setState( {
        custodyRequest
      }, () => {
        this.openBottomSheetOnLaunch( BottomSheetKind.CUSTODIAN_REQUEST )
      } )
    } else if ( recoveryRequest || trustedContactRequest ) {
      this.setState(
        {
          recoveryRequest,
          trustedContactRequest,
        },
        () => {
          this.openBottomSheetOnLaunch(
            BottomSheetKind.TRUSTED_CONTACT_REQUEST,
            1,
          )
        },
      )
    } else if ( userKey ) {
      this.props.navigation.navigate( 'VoucherScanner', {
        userKey
      } )
    }
  };

  cleanupListeners() {
    if ( typeof this.focusListener === 'function' ) {
      this.props.navigation.removeListener( 'didFocus', this.focusListener )
    }

    if ( typeof this.appStateListener === 'function' ) {
      AppState.removeEventListener( 'change', this.appStateListener )
    }

    Linking.removeEventListener( 'url', this.handleDeepLinkEvent )

    clearTimeout( this.openBottomSheetOnLaunchTimeout )
    if ( this.firebaseNotificationListener ) {
      this.firebaseNotificationListener()
    }
  }

  componentWillUnmount() {
    this.cleanupListeners()
  }

  openBottomSheetOnLaunch(
    kind: BottomSheetKind,
    snapIndex: number | null = null,
  ) {
    this.openBottomSheetOnLaunchTimeout = setTimeout( () => {
      this.openBottomSheet( kind, snapIndex )
    }, BOTTOM_SHEET_OPENING_ON_LAUNCH_DELAY )
  }

  handleDeepLinkEvent = async ( { url } ) => {
    console.log( 'Home::handleDeepLinkEvent::URL: ', url )

    const { navigation, isFocused } = this.props

    // If the user is on one of Home's nested routes, and a
    // deep link is opened, we will navigate back to Home first.
    if ( !isFocused ) {
      navigation.dispatch(
        resetToHomeAction( {
          unhandledDeepLinkURL: url,
        } ),
      )
    } else {
      this.handleDeepLinking( url )
    }
  };

  handleDeepLinking = async ( url: string | null ) => {
    if ( url == null ) {
      return
    }

    console.log( 'Home::handleDeepLinking::URL: ' + url )

    const splits = url.split( '/' )

    if ( splits.includes( 'wyre' ) ) {
      this.props.clearWyreCache()
      this.setState( {
        wyreDeepLinkContent:url,
        wyreFromBuyMenu: false,
        wyreFromDeepLink: true
      }, () => {
        this.openBottomSheet( BottomSheetKind.WYRE_STATUS_INFO )
      } )
    }
    if ( splits.includes( 'ramp' ) ) {
      this.props.clearRampCache()
      this.setState( {
        rampDeepLinkContent:url,
        rampFromBuyMenu: false,
        rampFromDeepLink: true
      }, () => {
        this.openBottomSheet( BottomSheetKind.RAMP_STATUS_INFO )
      } )
    }
    if ( splits[ 5 ] === 'sss' ) {
      const requester = splits[ 4 ]

      if ( splits[ 6 ] === 'ek' ) {
        const custodyRequest = {
          requester,
          ek: splits[ 7 ],
          uploadedAt: splits[ 8 ],
        }

        this.setState(
          {
            custodyRequest,
          },
          () => {
            this.openBottomSheetOnLaunch( BottomSheetKind.CUSTODIAN_REQUEST )
          },
        )
      } else if ( splits[ 6 ] === 'rk' ) {
        const recoveryRequest = {
          requester, rk: splits[ 7 ]
        }

        this.setState(
          {
            recoveryRequest,
            trustedContactRequest: null,
          },
          () => {
            this.openBottomSheetOnLaunch(
              BottomSheetKind.TRUSTED_CONTACT_REQUEST,
              1,
            )
          },
        )
      }
    } else if ( [ 'tc', 'tcg', 'atcg', 'ptc' ].includes( splits[ 4 ] ) ) {
      if ( splits[ 3 ] !== config.APP_STAGE ) {
        Alert.alert(
          'Invalid deeplink',
          `Following deeplink could not be processed by Hexa:${config.APP_STAGE.toUpperCase()}, use Hexa:${splits[ 3 ]
          }`,
        )
      } else {
        const version = splits.pop().slice( 1 )

        if ( version ) {
          const isAppVersionCompatible = await checkAppVersionCompatibility( {
            relayCheckMethod: splits[ 4 ],
            version,
          } )

          if ( !isAppVersionCompatible ) {
            return
          }
        }

        const trustedContactRequest = {
          isGuardian: [ 'tcg', 'atcg' ].includes( splits[ 4 ] ),
          approvedTC: splits[ 4 ] === 'atcg' ? true : false,
          isPaymentRequest: splits[ 4 ] === 'ptc' ? true : false,
          requester: splits[ 5 ],
          encryptedKey: splits[ 6 ],
          hintType: splits[ 7 ],
          hint: splits[ 8 ],
          uploadedAt: splits[ 9 ],
          version,
        }

        this.setState(
          {
            trustedContactRequest,
            recoveryRequest: null,
          },
          () => {
            this.openBottomSheetOnLaunch(
              BottomSheetKind.TRUSTED_CONTACT_REQUEST,
              1,
            )
          },
        )
      }
    } else if ( splits[ 4 ] === 'rk' ) {
      const recoveryRequest = {
        isRecovery: true,
        requester: splits[ 5 ],
        encryptedKey: splits[ 6 ],
        hintType: splits[ 7 ],
        hint: splits[ 8 ],
      }

      this.setState(
        {
          recoveryRequest,
          trustedContactRequest: null,
        },
        () => {
          this.openBottomSheetOnLaunch(
            BottomSheetKind.TRUSTED_CONTACT_REQUEST,
            1,
          )
        },
      )
    } else if ( splits[ 4 ] === 'rrk' ) {
      Alert.alert(
        'Restoration link Identified',
        'Restoration links only works during restoration mode',
      )
    }

    if ( url.includes( 'fastbitcoins' ) ) {
      const userKey = url.substr( url.lastIndexOf( '/' ) + 1 )
      this.props.navigation.navigate( 'VoucherScanner', {
        userKey
      } )
    }
  };

  setUpFocusListener = () => {
    const { navigation } = this.props

    this.focusListener = navigation.addListener( 'didFocus', () => {
      this.setCurrencyCodeFromAsync()
      this.props.fetchNotifications()
      this.setState( {
        lastActiveTime: moment().toISOString(),
      } )
    } )

    this.setCurrencyCodeFromAsync()
  };


  setSecondaryDeviceAddresses = async () => {
    let secondaryDeviceOtpTemp = this.props.secondaryDeviceAddressValue

    if ( !secondaryDeviceOtpTemp ) {
      secondaryDeviceOtpTemp = []
    }
    if (
      secondaryDeviceOtpTemp.findIndex(
        ( value ) => value.otp == ( this.state.secondaryDeviceOtp as any ).otp,
      ) == -1
    ) {
      secondaryDeviceOtpTemp.push( this.state.secondaryDeviceOtp )
      this.props.setSecondaryDeviceAddress( secondaryDeviceOtpTemp )
    }
  };

  getAssociatedContact = async () => {
    // TODO -- need to check this
    this.setSecondaryDeviceAddresses()
  };

  setCurrencyCodeFromAsync = async () => {
    const { currencyCode } = this.props
    if ( !currencyCode ) {
      this.props.setCurrencyCode( RNLocalize.getCurrencies()[ 0 ] )
      this.setState( {
        currencyCode: RNLocalize.getCurrencies()[ 0 ],
      } )
    } else {
      this.setState( {
        currencyCode: currencyCode,
      } )
    }
  };

  calculateNetBalance = () => {
    const { accountShells } = this.props.accountsState

    let totalBalance = 0
    accountShells.forEach( ( accountShell: AccountShell ) => {
      if( accountShell.primarySubAccount.sourceKind !== SourceAccountKind.TEST_ACCOUNT )
        totalBalance += AccountShell.getTotalBalance( accountShell )
    } )

    this.setState( {
      netBalance: totalBalance,
    } )
  };

  onNotificationListOpen = async () => {
    // let asyncNotificationList = notificationListNew;
    const asyncNotificationList = JSON.parse(
      await AsyncStorage.getItem( 'notificationList' ),
    )
    if ( asyncNotificationList ) {
      for ( let i = 0; i < asyncNotificationList.length; i++ ) {
        if ( asyncNotificationList[ i ] ) {
          asyncNotificationList[ i ].time = timeFormatter(
            moment( new Date() ),
            moment( asyncNotificationList[ i ].date ).valueOf(),
          )
        }
      }
      // this.props.notificationsUpdated(asyncNotificationList);

      await AsyncStorage.setItem(
        'notificationList',
        JSON.stringify( asyncNotificationList ),
      )
      asyncNotificationList.sort( function ( left, right ) {
        return moment.utc( right.date ).unix() - moment.utc( left.date ).unix()
      } )

      this.setState( {
        notificationData: asyncNotificationList,
        notificationDataChange: !this.state.notificationDataChange,
      } )
    }
  };

  onTrustedContactRequestAccepted = ( key ) => {
    this.closeBottomSheet()
    this.processDLRequest( key, false )
  };

  onTrustedContactRejected = () => {
    this.closeBottomSheet()
  };

  onPhoneNumberChange = () => { };

  handleBottomTabSelection = ( tab: BottomTab ) => {
    this.setState( {
      selectedBottomTab: tab
    } )

    if ( tab === BottomTab.Transactions ) {
      this.props.navigation.navigate( 'AllTransactions' )
    } else if ( tab === BottomTab.More ) {
      this.props.navigation.navigate( 'MoreOptions' )
    } else if ( tab === BottomTab.QR ) {
      this.props.navigation.navigate( 'QRScanner', {
        onCodeScanned: this.processQRData,
      } )
    } else if ( tab === BottomTab.FriendsAndFamily ) {
      this.props.navigation.navigate( 'FriendsAndFamily' )
    }
  };

  handleBuyBitcoinBottomSheetSelection = ( menuItem: BuyBitcoinBottomSheetMenuItem ) => {
    switch ( menuItem.kind ) {
        case BuyMenuItemKind.FAST_BITCOINS:
          this.props.navigation.navigate( 'VoucherScanner' )
          break
        case BuyMenuItemKind.SWAN:
          this.props.navigation.navigate( 'SwanIntegrationScreen' )
          break
        case BuyMenuItemKind.RAMP:
          if ( !this.props.currentRampSubAccount ) {
            const newSubAccount = new ExternalServiceSubAccountInfo( {
              instanceNumber: 1,
              defaultTitle: 'Ramp Account',
              defaultDescription: 'BTC Purchased from Ramp',
              serviceAccountKind: ServiceAccountKind.RAMP,
            } )

            this.props.addNewAccountShell( newSubAccount )
          }
          this.props.clearRampCache()
          this.setState( {
            rampDeepLinkContent: null,
            rampFromDeepLink: false,
            rampFromBuyMenu: true
          }, () => {
            this.openBottomSheet( BottomSheetKind.RAMP_STATUS_INFO )
          } )
          break
        case BuyMenuItemKind.WYRE:
          if ( !this.props.currentWyreSubAccount ) {
            const newSubAccount = new ExternalServiceSubAccountInfo( {
              instanceNumber: 1,
              defaultTitle: 'Wyre Account',
              defaultDescription: 'BTC Purchased from Wyre',
              serviceAccountKind: ServiceAccountKind.WYRE,
            } )
            this.props.addNewAccountShell( newSubAccount )
            // this.props.navigation.navigate( 'NewWyreAccountDetails', {
            //   currentSubAccount: newSubAccount,
            // } )
          }
          this.props.clearWyreCache()
          this.setState( {
            wyreDeepLinkContent: null,
            wyreFromDeepLink: false,
            wyreFromBuyMenu: true
          }, () => {
            this.openBottomSheet( BottomSheetKind.WYRE_STATUS_INFO )
          } )
          break
    }
  }

  processDLRequest = ( key, rejected ) => {
    const { trustedContactRequest, recoveryRequest } = this.state
    let {
      requester,
      isGuardian,
      approvedTC,
      encryptedKey,
      publicKey,
      info,
      isQR,
      uploadedAt,
      isRecovery,
      version,
    } = trustedContactRequest || recoveryRequest
    const {
      UNDER_CUSTODY,
      uploadRequestedShare,
      navigation,
      approveTrustedContact,
      fetchTrustedChannel,
      walletName,
      trustedContacts,
    } = this.props

    if ( !isRecovery ) {
      if ( requester === walletName ) {
        Toast( 'Cannot be your own Contact/Guardian' )
        return
      }

      let expiry = config.TC_REQUEST_EXPIRY
      if ( !semver.valid( version ) ) {
        // expiry support for 0.7, 0.9 and 1.0
        expiry = config.LEGACY_TC_REQUEST_EXPIRY
      }

      if ( uploadedAt && Date.now() - uploadedAt > expiry ) {
        Alert.alert(
          `${isQR ? 'QR' : 'Link'} expired!`,
          `Please ask the sender to initiate a new ${isQR ? 'QR' : 'Link'}`,
        )
      } else {
        if ( isGuardian && UNDER_CUSTODY[ requester ] ) {
          Alert.alert(
            'Failed to accept',
            `You already custody a share against the wallet name: ${requester}`,
          )
        } else {
          if ( !publicKey ) {
            try {
              publicKey = TrustedContactsService.decryptPub( encryptedKey, key )
                .decryptedPub
              info = key
            } catch ( err ) {
              Alert.alert(
                'Invalid Number/Email',
                'Decryption failed due to invalid input, try again.',
              )
              return
            }
          }

          let existingContactName
          Object.keys( trustedContacts.tc.trustedContacts ).forEach(
            ( contactName ) => {
              const contact = trustedContacts.tc.trustedContacts[ contactName ]
              if ( contact.contactsPubKey === publicKey ) {
                existingContactName = contactName
              }
            },
          )
          if ( existingContactName && !approvedTC ) {
            Toast( 'Contact already exists against this request' )
            return
          }

          if ( publicKey && !rejected ) {
            if ( !approvedTC ) {
              navigation.navigate( 'ContactsListForAssociateContact', {
                postAssociation: ( contact ) => {
                  let contactName = ''
                  if ( contact ) {
                    contactName = `${contact.firstName} ${contact.lastName ? contact.lastName : ''
                    }`
                      .toLowerCase()
                      .trim()
                  } else {
                    // contactName = `${requester}'s Wallet`.toLowerCase();
                    Alert.alert( 'Contact association failed' )
                    return
                  }
                  if ( !semver.valid( version ) ) {
                    // for 0.7, 0.9 and 1.0: info remains null
                    info = null
                  }

                  const contactInfo = {
                    contactName,
                    info,
                  }

                  approveTrustedContact(
                    contactInfo,
                    publicKey,
                    true,
                    requester,
                    isGuardian,
                  )
                },
                isGuardian,
              } )
            } else {
              if ( !existingContactName ) {
                Alert.alert(
                  'Invalid Link/QR',
                  'You are not a valid trusted contact for approving this request',
                )
                return
              }
              const contactInfo = {
                contactName: existingContactName,
                info,
              }

              fetchTrustedChannel(
                contactInfo,
                trustedChannelActions.downloadShare,
                requester,
              )
            }
          } else if ( publicKey && rejected ) {
            // don't associate; only fetch the payment details from EC
            // fetchEphemeralChannel(null, null, publicKey);
          }
        }
      }
    } else {
      if ( requester === walletName ) {
        Toast( 'You do not host any key of your own' )
        return
      }

      if ( !UNDER_CUSTODY[ requester ] ) {
        this.setState(
          {
            errorMessageHeader: `You do not custody a share with the wallet name ${requester}`,
            errorMessage: 'Request your contact to send the request again with the correct wallet name or help them manually restore by going into Friends and Family > I am the Keeper of > Help Restore',
          },
          () => {
            this.openBottomSheet( BottomSheetKind.ERROR )
          },
        )
      } else {
        if ( !publicKey ) {
          try {
            publicKey = TrustedContactsService.decryptPub( encryptedKey, key )
              .decryptedPub
          } catch ( err ) {
            Alert.alert(
              'Invalid Number/Email',
              'Decryption failed due to invalid input, try again.',
            )
          }
        }
        if ( publicKey ) {
          uploadRequestedShare( recoveryRequest.requester, publicKey )
        }
      }
    }
  };

  handleAccountCardSelection = ( selectedAccount: AccountShell ) => {
    this.props.navigation.navigate( 'AccountDetails', {
      accountShellID: selectedAccount.id,
    } )
  };

  handleBottomSheetPositionChange = ( newIndex: number ) => {
    if ( newIndex === 0 ) {
      this.onBottomSheetClosed()
    }
  };

  openBottomSheet = (
    kind: BottomSheetKind,
    snapIndex: number | null = null,
  ) => {
    this.setState(
      {
        bottomSheetState: BottomSheetState.Open,
        currentBottomSheetKind: kind,
      },
      () => {
        if ( snapIndex == null ) {
          this.bottomSheetRef.current?.expand()
        } else {
          this.bottomSheetRef.current?.snapTo( snapIndex )
        }
      },
    )
  };

  onBottomSheetClosed() {
    this.setState( {
      bottomSheetState: BottomSheetState.Closed,
      currentBottomSheetKind: null,
    } )
  }

  closeBottomSheet = () => {
    this.bottomSheetRef.current?.close()
    this.onBottomSheetClosed()
  };

  onNotificationClicked = async ( value ) => {
    const asyncNotifications = JSON.parse(
      await AsyncStorage.getItem( 'notificationList' ),
    )
    console.log( 'Notification clicked Home>onNotificationClicked' )
    console.log( 'asyncNotifications ', asyncNotifications )
    console.log( 'notification passed ', value )

    const { notificationData } = this.state
    console.log( 'notificationData from state ', notificationData )
    const { navigation } = this.props
    const tempNotificationData = notificationData
    for ( let i = 0; i < tempNotificationData.length; i++ ) {
      const element = tempNotificationData[ i ]
      if ( element.notificationId == value.notificationId ) {
        if (
          asyncNotifications &&
          asyncNotifications.length &&
          asyncNotifications.findIndex(
            ( item ) => item.notificationId == value.notificationId,
          ) > -1
        ) {
          asyncNotifications[
            asyncNotifications.findIndex(
              ( item ) => item.notificationId == value.notificationId,
            )
          ].read = true
        }
        tempNotificationData[ i ].read = true
      }
    }

    await AsyncStorage.setItem(
      'notificationList',
      JSON.stringify( asyncNotifications ),
    )

    this.setState( {
      notificationData: tempNotificationData,
      notificationDataChange: !this.state.notificationDataChange,
    } )

    if ( value.info.includes( 'F&F request accepted by' ) ) {
      navigation.navigate( 'FriendsAndFamily' )
      return
    }

    if ( value.type == releaseNotificationTopic ) {
      RelayServices.fetchReleases( value.info.split( ' ' )[ 1 ] )
        .then( async ( res ) => {
          if ( res.data.releases.length ) {
            const releaseNotes = res.data.releases.length
              ? res.data.releases.find( ( el ) => {
                return el.build === value.info.split( ' ' )[ 1 ]
              } )
              : ''
            navigation.navigate( 'UpdateApp', {
              releaseData: [ releaseNotes ],
              isOpenFromNotificationList: true,
              releaseNumber: value.info.split( ' ' )[ 1 ],
            } )
          }
        } )
        .catch( ( error ) => {
          console.error( error )
        } )
    }
    if ( value.type == 'contact' ) {
      this.closeBottomSheet()
    }
  };

  setupNotificationList = async () => {
    // let asyncNotification = notificationListNew;
    const asyncNotification = JSON.parse(
      await AsyncStorage.getItem( 'notificationList' ),
    )
    let asyncNotificationList = []
    if ( asyncNotification ) {
      asyncNotificationList = []
      for ( let i = 0; i < asyncNotification.length; i++ ) {
        asyncNotificationList.push( asyncNotification[ i ] )
      }
    }
    const tmpList = asyncNotificationList
    const { notificationList } = this.props
    if ( notificationList ) {
      for ( let i = 0; i < notificationList[ 'notifications' ].length; i++ ) {
        const element = notificationList[ 'notifications' ][ i ]
        let readStatus = false
        if ( element.notificationType == releaseNotificationTopic ) {
          const releaseCases = this.props.releaseCasesValue
          // JSON.parse(
          //   await AsyncStorage.getItem('releaseCases'),
          // );
          if ( element.body.split( ' ' )[ 1 ] == releaseCases.build ) {
            if ( releaseCases.remindMeLaterClick ) {
              readStatus = false
            }
            if ( releaseCases.ignoreClick ) {
              readStatus = true
            }
          } else {
            readStatus = true
          }
        }
        if (
          asyncNotificationList.findIndex(
            ( value ) => value.notificationId == element.notificationId,
          ) > -1
        ) {
          const temp =
            asyncNotificationList[
              asyncNotificationList.findIndex(
                ( value ) => value.notificationId == element.notificationId,
              )
            ]
          if ( element.notificationType == releaseNotificationTopic ) {
            readStatus = readStatus
          } else {
            readStatus = temp.read
          }
          const obj = {
            ...temp,
            read: readStatus,
            type: element.notificationType,
            title: element.title,
            info: element.body,
            isMandatory: element.tag == 'mandatory' ? true : false,
            time: timeFormatter(
              moment( new Date() ),
              moment( element.date ).valueOf(),
            ),
            date: new Date( element.date ),
          }
          tmpList[
            tmpList.findIndex(
              ( value ) => value.notificationId == element.notificationId,
            )
          ] = obj
        } else {
          const obj = {
            type: element.notificationType,
            isMandatory: element.tag == 'mandatory' ? true : false,
            read: readStatus,
            title: element.title,
            time: timeFormatter(
              moment( new Date() ),
              moment( element.date ).valueOf(),
            ),
            date: new Date( element.date ),
            info: element.body,
            notificationId: element.notificationId,
          }
          tmpList.push( obj )
        }
      }
      //this.props.notificationsUpdated(tmpList);
      await AsyncStorage.setItem( 'notificationList', JSON.stringify( tmpList ) )
      tmpList.sort( function ( left, right ) {
        return moment.utc( right.date ).unix() - moment.utc( left.date ).unix()
      } )

      this.setState( {
        notificationData: tmpList,
        notificationDataChange: !this.state.notificationDataChange,
      } )
    }
  };

  getBottomSheetSnapPoints(): any[] {
    switch ( this.state.currentBottomSheetKind ) {
        case BottomSheetKind.WYRE_STATUS_INFO:
          return ( this.state.wyreFromDeepLink )
            ? [ 0, '32%' ]
            : Platform.OS == 'ios' ? [ 0, '50%' ] : [ 0, '65%' ]
        case BottomSheetKind.RAMP_STATUS_INFO:
          return ( this.state.rampFromDeepLink )
            ? [ 0, '32%' ]
            : Platform.OS == 'ios' ? [ 0, '50%' ] : [ 0, '65%' ]
        case BottomSheetKind.TAB_BAR_BUY_MENU:
          return Platform.OS == 'ios' ? [ 0, '65%' ] : [ 0, '70%' ]
        case BottomSheetKind.CUSTODIAN_REQUEST:
        case BottomSheetKind.CUSTODIAN_REQUEST_REJECTED:
          return defaultBottomSheetConfigs.snapPoints

        case BottomSheetKind.TRUSTED_CONTACT_REQUEST:
          return [
            -50,
            heightPercentageToDP(
              Platform.OS == 'ios' && DeviceInfo.hasNotch ? 70 : 65,
            ),
            heightPercentageToDP( 95 ),
          ]

        case BottomSheetKind.ERROR:
          return [
            -50,
            heightPercentageToDP(
              Platform.OS == 'ios' && DeviceInfo.hasNotch ? 40 : 35,
            ),
          ]

        case BottomSheetKind.ADD_CONTACT_FROM_ADDRESS_BOOK:
        case BottomSheetKind.NOTIFICATIONS_LIST:
          return [ -50, heightPercentageToDP( 82 ) ]

        default:
          return defaultBottomSheetConfigs.snapPoints
    }
  }

  renderBottomSheetContent() {
    const { UNDER_CUSTODY, navigation } = this.props
    const { custodyRequest } = this.state

    switch ( this.state.currentBottomSheetKind ) {
        case BottomSheetKind.TAB_BAR_BUY_MENU:
          return (
            <>
              <BottomSheetHeader title="Buy Bitcoin" onPress={this.closeBottomSheet} />

              <BuyBitcoinHomeBottomSheet
                onMenuItemSelected={this.handleBuyBitcoinBottomSheetSelection}
              />
            </>
          )

        case BottomSheetKind.WYRE_STATUS_INFO:
          return (
            <>
              <BottomSheetHeader title="" onPress={this.closeBottomSheet} />
              <BottomSheetWyreInfo
                wyreDeepLinkContent={this.state.wyreDeepLinkContent}
                wyreFromBuyMenu={this.state.wyreFromBuyMenu}
                wyreFromDeepLink={this.state.wyreFromDeepLink}
                onClickSetting={() => {
                  this.closeBottomSheet()
                }}
              />
            </>
          )

        case BottomSheetKind.RAMP_STATUS_INFO:
          return (
            <>
              <BottomSheetHeader title="" onPress={this.closeBottomSheet} />
              <BottomSheetRampInfo
                rampDeepLinkContent={this.state.rampDeepLinkContent}
                rampFromBuyMenu={this.state.rampFromBuyMenu}
                rampFromDeepLink={this.state.rampFromDeepLink}
                onClickSetting={() => {
                  this.closeBottomSheet()
                }}
              />
            </>
          )

        case BottomSheetKind.CUSTODIAN_REQUEST:
          return (
            <CustodianRequestModalContents
              userName={custodyRequest.requester}
              onPressAcceptSecret={() => {
                this.closeBottomSheet()

                if ( Date.now() - custodyRequest.uploadedAt > 600000 ) {
                  Alert.alert(
                    'Request expired!',
                    'Please ask the sender to initiate a new request',
                  )
                } else {
                  if ( UNDER_CUSTODY[ custodyRequest.requester ] ) {
                    Alert.alert(
                      'Failed to store',
                      'You cannot custody multiple shares of the same user.',
                    )
                  } else {
                    if ( custodyRequest.isQR ) {
                      downloadMShare( custodyRequest.ek, custodyRequest.otp )
                    } else {
                      navigation.navigate( 'CustodianRequestOTP', {
                        custodyRequest,
                      } )
                    }
                  }
                }
              }}
              onPressRejectSecret={() => {
                this.closeBottomSheet()
                this.openBottomSheet( BottomSheetKind.CUSTODIAN_REQUEST_REJECTED )
              }}
            />
          )

        case BottomSheetKind.CUSTODIAN_REQUEST_REJECTED:
          return (
            <CustodianRequestRejectedModalContents
              onPressViewTrustedContacts={this.closeBottomSheet}
              userName={custodyRequest.requester}
            />
          )

        case BottomSheetKind.TRUSTED_CONTACT_REQUEST:
          const { trustedContactRequest, recoveryRequest } = this.state

          return (
            <TrustedContactRequestContent
              trustedContactRequest={trustedContactRequest}
              recoveryRequest={recoveryRequest}
              onPressAccept={this.onTrustedContactRequestAccepted}
              onPressReject={this.onTrustedContactRejected}
              onPhoneNumberChange={this.onPhoneNumberChange}
              bottomSheetRef={this.bottomSheetRef}
            />
          )

        case BottomSheetKind.NOTIFICATIONS_LIST:
          const { notificationLoading, notificationData } = this.state

          return (
            <NotificationListContent
              notificationLoading={notificationLoading}
              NotificationData={notificationData}
              onNotificationClicked={this.onNotificationClicked}
              onPressBack={this.closeBottomSheet}
            />
          )

        case BottomSheetKind.ADD_CONTACT_FROM_ADDRESS_BOOK:
          const { isLoadContacts, selectedContact } = this.state

          return (
            <AddContactAddressBook
              isLoadContacts={isLoadContacts}
              proceedButtonText={'Confirm & Proceed'}
              onPressContinue={() => {
                if ( selectedContact && selectedContact.length ) {
                  this.closeBottomSheet()

                  navigation.navigate( 'AddContactSendRequest', {
                    SelectedContact: selectedContact,
                  } )
                }
              }}
              onSelectContact={( selectedContact ) => {
                this.setState( {
                  selectedContact,
                } )
              }}
              onPressBack={this.closeBottomSheet}
              onSkipContinue={() => {
                let { skippedContactsCount } = this.props.trustedContacts.tc
                let data
                if ( !skippedContactsCount ) {
                  skippedContactsCount = 1
                  data = {
                    firstName: 'F&F request',
                    lastName: `awaiting ${skippedContactsCount}`,
                    name: `F&F request awaiting ${skippedContactsCount}`,
                  }
                } else {
                  data = {
                    firstName: 'F&F request',
                    lastName: `awaiting ${skippedContactsCount + 1}`,
                    name: `F&F request awaiting ${skippedContactsCount + 1}`,
                  }
                }

                this.closeBottomSheet()

                navigation.navigate( 'AddContactSendRequest', {
                  SelectedContact: [ data ],
                } )
              }}
            />
          )

        case BottomSheetKind.ERROR:
          const { errorMessageHeader, errorMessage } = this.state

          return (
            <ErrorModalContents
              title={errorMessageHeader}
              info={errorMessage}
              onPressProceed={this.closeBottomSheet}
              isBottomImage={true}
              bottomImage={require( '../../assets/images/icons/errorImage.png' )}
            />
          )
        default:
          break
    }
  }

  render() {
    const {
      netBalance,
      notificationData,
      currencyCode,
    } = this.state

    const {
      exchangeRates,
      walletName,
      overallHealth,
    } = this.props

    return (
      <ImageBackground
        source={require( '../../assets/images/home-bg.png' )}
        style={{
          width: '100%', height: '100%', flex: 1
        }}
        imageStyle={{
          resizeMode: 'stretch'
        }}
      >
        <StatusBar backgroundColor={Colors.blue} barStyle="light-content" />
        <View
          style={{
            flex: 3.8,
            paddingTop:
              Platform.OS == 'ios' && DeviceInfo.hasNotch
                ? heightPercentageToDP( '5%' )
                : 0,
          }}
        >
          <HomeHeader
            onPressNotifications={this.onPressNotifications}
            notificationData={notificationData}
            walletName={walletName}
            getCurrencyImageByRegion={getCurrencyImageByRegion}
            netBalance={netBalance}
            exchangeRates={exchangeRates}
            CurrencyCode={currencyCode}
            navigation={this.props.navigation}
            overallHealth={overallHealth}
          />
        </View>

        <HomeAccountCardsList
          containerStyle={styles.accountCardsSectionContainer}
          contentContainerStyle={{
            paddingTop: 36,
            paddingLeft: 14,
          }}
          onAddNewSelected={this.navigateToAddNewAccountScreen}
          onCardSelected={this.handleAccountCardSelection}
        />

        <View
          style={styles.floatingActionButtonContainer}
          pointerEvents="box-none"
        >
          <Button
            raised
            title="Buy"
            icon={
              <Image
                source={require( '../../assets/images/icons/icon_buy.png' )}
                style={{
                  width: widthPercentageToDP( 8 ),
                  height: widthPercentageToDP( 8 ),
                  marginTop: widthPercentageToDP( -3 ),
                  marginBottom: widthPercentageToDP( -3 )
                }}
              />
            }
            buttonStyle={{
              ...ButtonStyles.floatingActionButton,
              borderRadius: 9999,
              paddingHorizontal: widthPercentageToDP( 10 )
            }}
            titleStyle={{
              ...ButtonStyles.floatingActionButtonText,
              marginLeft: 8,
            }}
            onPress={() => this.openBottomSheet( BottomSheetKind.TAB_BAR_BUY_MENU )}
          />
        </View>

        <BottomSheetBackground
          isVisible={this.state.bottomSheetState === BottomSheetState.Open}
          onPress={this.closeBottomSheet}
        />

        <CustomBottomTabs
          isEnabled={this.props.navigation.isFocused()}
          onSelect={this.handleBottomTabSelection}
          tabBarZIndex={
            this.state.currentBottomSheetKind ==
              BottomSheetKind.TAB_BAR_BUY_MENU || null
              ? 1
              : 0
          }
        />

        {this.state.currentBottomSheetKind != null && (
          <BottomSheet
            ref={this.bottomSheetRef}
            snapPoints={this.getBottomSheetSnapPoints()}
            initialSnapIndex={-1}
            animationDuration={defaultBottomSheetConfigs.animationDuration}
            animationEasing={Easing.out( Easing.back( 1 ) )}
            handleComponent={defaultBottomSheetConfigs.handleComponent}
            onChange={this.handleBottomSheetPositionChange}
          >
            <BottomSheetView>{this.renderBottomSheetContent()}</BottomSheetView>
          </BottomSheet>
        )}
      </ImageBackground>
    )
  }
}

const mapStateToProps = ( state ) => {
  return {
    notificationList: state.notifications,
    accountsState: state.accounts,
    currentWyreSubAccount: state.accounts.currentWyreSubAccount,
    currentRampSubAccount: state.accounts.currentRampSubAccount,
    exchangeRates: idx( state, ( _ ) => _.accounts.exchangeRates ),
    walletName:
      idx( state, ( _ ) => _.storage.database.WALLET_SETUP.walletName ) || '',
    UNDER_CUSTODY: idx(
      state,
      ( _ ) => _.storage.database.DECENTRALIZED_BACKUP.UNDER_CUSTODY,
    ),
    s3Service: idx( state, ( _ ) => _.sss.service ),
    overallHealth: idx( state, ( _ ) => _.sss.overallHealth ),
    trustedContacts: idx( state, ( _ ) => _.trustedContacts.service ),
    paymentDetails: idx( state, ( _ ) => _.trustedContacts.paymentDetails ),
    notificationListNew: idx( state, ( _ ) => _.notifications.notificationListNew ),
    currencyCode: idx( state, ( _ ) => _.preferences.currencyCode ),
    fcmTokenValue: idx( state, ( _ ) => _.preferences.fcmTokenValue ),
    secondaryDeviceAddressValue: idx(
      state,
      ( _ ) => _.preferences.secondaryDeviceAddressValue,
    ),
    releaseCasesValue: idx( state, ( _ ) => _.preferences.releaseCasesValue ),
    versionHistory: idx( state, ( _ ) => _.versionHistory.versions ),
  }
}

export default withNavigationFocus(
  connect( mapStateToProps, {
    fetchEphemeralChannel,
    fetchNotifications,
    updateFCMTokens,
    postRecoveryChannelSync,
    downloadMShare,
    approveTrustedContact,
    fetchTrustedChannel,
    uploadRequestedShare,
    autoSyncShells,
    clearWyreCache,
    clearRampCache,
    addNewAccountShell,
    addTransferDetails,
    clearPaymentDetails,
    notificationsUpdated,
    setCurrencyCode,
    updatePreference,
    setFCMToken,
    setSecondaryDeviceAddress,
    setVersion
  } )( Home ),
)

const styles = StyleSheet.create( {
  accountCardsSectionContainer: {
    flex: 7,
    marginTop: 30,
    backgroundColor: Colors.backgroundColor,
    borderTopLeftRadius: 25,
    shadowColor: 'black',
    shadowOpacity: 0.4,
    shadowOffset: {
      width: 2, height: -1
    },
  },

  floatingActionButtonContainer: {
    position: 'absolute',
    zIndex: 0,
    bottom: TAB_BAR_HEIGHT,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignSelf: 'flex-end',
    padding: heightPercentageToDP( 1.5 ),
  },
} )
