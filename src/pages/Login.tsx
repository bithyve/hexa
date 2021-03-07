import React, { useState, useEffect, useCallback } from 'react'
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  StatusBar,
  AsyncStorage,
  Platform,
  BackHandler
} from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import Ionicons from 'react-native-vector-icons/Ionicons'
import Colors from '../common/Colors'
import Fonts from '../common/Fonts'
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen'
import { RFValue } from 'react-native-responsive-fontsize'
import FontAwesome from 'react-native-vector-icons/FontAwesome'
import { credsAuth } from '../store/actions/setupAndAuth'
import BottomSheet from 'reanimated-bottom-sheet'
import LoaderModal from '../components/LoaderModal'
import JailMonkey from 'jail-monkey'
import DeviceInfo from 'react-native-device-info'
import ErrorModalContents from '../components/ErrorModalContents'
import ModalHeader from '../components/ModalHeader'
import RelayServices from '../bitcoin/services/RelayService'
import { initMigration } from '../store/actions/preferences'
import { clearAccountSyncCache } from '../store/actions/accounts'
import openLink from '../utils/OpenLink'
import content from '../common/content'

const LOADER_MESSAGE_TIME = 2500
const loaderMessages = content.login.loader_messages

const getRandomMessage = () => {
  const randomIndex = Math.floor( Math.random() * 6 )
  return loaderMessages[ randomIndex ]
}

export default function Login( props ) {

  const initialMessage = getRandomMessage()
  const [ message ] = useState( initialMessage.heading )
  const [ subTextMessage1 ] = useState( initialMessage.text )
  const [ subTextMessage2 ] = useState( initialMessage.subText )
  const [ passcode, setPasscode ] = useState( '' )
  const [ Elevation, setElevation ] = useState( 10 )
  const [ JailBrokenTitle, setJailBrokenTitle ] = useState( '' )
  const [ JailBrokenInfo, setJailBrokenInfo ] = useState( '' )
  const [ passcodeFlag ] = useState( true )
  const [ checkAuth, setCheckAuth ] = useState( false )
  const [ loaderBottomSheet ] = useState(
    React.createRef<BottomSheet>(),
  )
  const [ ErrorBottomSheet ] = useState(
    React.createRef<BottomSheet>(),
  )
  const releaseCasesValue = useSelector(
    ( state ) => state.preferences.releaseCasesValue,
  )

  const [ isDisabledProceed, setIsDisabledProceed ] = useState( false )

  const onPressNumber = useCallback(
    ( text ) => {
      let tmpPasscode = passcode
      if ( passcode.length < 4 ) {
        if ( text != 'x' ) {
          tmpPasscode += text
          setPasscode( tmpPasscode )
        }
      }
      if ( passcode && text == 'x' ) {
        setPasscode( passcode.slice( 0, -1 ) )
        setCheckAuth( false )
      }
    },
    [ passcode ],
  )

  const hardwareBackPressCustom = useCallback( () => {
    return true
  }, [] )

  useEffect( () => {
    BackHandler.addEventListener( 'hardwareBackPress', hardwareBackPressCustom )
    return () => {
      BackHandler.removeEventListener( 'hardwareBackPress', hardwareBackPressCustom )
    }
  }, [] )

  useEffect( () => {
    if ( passcode.length == 4 ) {
      setIsDisabledProceed( false )
    }
  }, [ passcode ] )

  const dispatch = useDispatch()

  // This will reset the sync status for all shells
  useEffect( ()=>{
    dispatch( clearAccountSyncCache() )
  }, [] )

  const { isAuthenticated, authenticationFailed } = useSelector(
    ( state ) => state.setupAndAuth,
  )

  useEffect( () => {
    if ( JailMonkey.isJailBroken() ) {
      ErrorBottomSheet.current.snapTo( 1 )
      setTimeout( () => {
        setJailBrokenTitle(
          Platform.OS == 'ios'
            ? 'Your device is Jail Broken'
            : 'Your device is Rooted',
        )
        setJailBrokenInfo(
          Platform.OS == 'ios'
            ? 'You are using a jailbroken device hence in built security features of the app as well as the phone will not work as intended. We recommend you use a non jailbroken device with the latest iOS updates installed to ensure the security of your app data'
            : 'You are using a rooted device hence in built security features of the app as well as the phone will not work as intended. We recommend you use a non rooted device with the latest Android updates installed to ensure the security of your app data'
        )
        setElevation( 0 )
      }, 2 )
    }
    DeviceInfo.isPinOrFingerprintSet().then( ( isPinOrFingerprintSet ) => {
      if ( !isPinOrFingerprintSet ) {
        ErrorBottomSheet.current.snapTo( 1 )
        setTimeout( () => {
          setJailBrokenTitle(
            'Your phone does not have any secure entry like Pin or Biometric',
          )
          setJailBrokenInfo(
            'This may be a security risk to your funds on Hexa',
          )
          setElevation( 0 )
        }, 2 )
      }
    } )

    RelayServices.fetchReleases( DeviceInfo.getBuildNumber() )
      .then( async ( res ) => {
        // console.log('Release note', res.data.releases);
        const releaseCases = releaseCasesValue
        // JSON.parse(
        //   await AsyncStorage.getItem('releaseCases'),
        // );
        if (
          res.data.releases.length &&
          res.data.releases[ 0 ].build > DeviceInfo.getBuildNumber()
        ) {
          if (
            releaseCases &&
            releaseCases.build == res.data.releases[ 0 ].build &&
            releaseCases.ignoreClick
          )
            return
          props.navigation.navigate( 'UpdateApp', {
            releaseData: res.data.releases,
          } )
        }
        return
      } )
      .catch( ( error ) => {
        console.error( error )
      } )
  }, [] )


  const custodyRequest = props.navigation.getParam( 'custodyRequest' )
  const recoveryRequest = props.navigation.getParam( 'recoveryRequest' )
  const trustedContactRequest = props.navigation.getParam(
    'trustedContactRequest',
  )
  const userKey = props.navigation.getParam( 'userKey' )
  const isMigrated = useSelector( ( state ) => state.preferences.isMigrated )

  useEffect( () => {
    if ( isAuthenticated ) {
      // migrate async keys
      if ( !isMigrated ) {
        dispatch( initMigration() )
      }
      AsyncStorage.getItem( 'walletExists' ).then( ( exists ) => {
        if ( exists ) {
          setTimeout( () => {
            if ( loaderBottomSheet.current ) {
              loaderBottomSheet.current.snapTo( 0 )
            }
            props.navigation.navigate( 'Home', {
              custodyRequest,
              recoveryRequest,
              trustedContactRequest,
              userKey,
            } )
          }, LOADER_MESSAGE_TIME )
        } else {
          props.navigation.replace( 'WalletInitialization' )
        }
      } )
    }
  }, [ isAuthenticated ] )

  const handleLoaderMessages = ( passcode ) => {
    setTimeout( () => {
      dispatch( credsAuth( passcode ) )
    }, 2 )
  }

  const renderLoaderModalContent = useCallback( () => {
    return (
      <LoaderModal
        headerText={message}
        messageText={subTextMessage1}
        messageText2={subTextMessage2}
        showGif={false}
      />
    )
  }, [ message, subTextMessage1, subTextMessage2 ] )

  const renderLoaderModalHeader = () => {
    return (
      <View
        style={{
          marginTop: 'auto',
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          height: hp( '75%' ),
          zIndex: 9999,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      />
    )
  }

  const checkPasscode = () => {
    if ( checkAuth ) {
      setTimeout( () => {
        loaderBottomSheet.current.snapTo( 0 )
      }, 2 )

      return (
        <View style={{
          marginLeft: 'auto'
        }}>
          <Text style={styles.errorText}>Incorrect passcode, try again!</Text>
        </View>
      )
    }
  }

  useEffect( () => {
    if ( authenticationFailed ) {
      setCheckAuth( true )
      checkPasscode()
      setPasscode( '' )
    } else {
      setCheckAuth( false )
    }
  }, [ authenticationFailed ] )

  const renderErrorModalContent = useCallback( () => {
    return (
      <ErrorModalContents
        modalRef={ErrorBottomSheet}
        title={JailBrokenTitle}
        info={JailBrokenInfo}
        proceedButtonText={'Ok'}
        onPressProceed={() => {
          ErrorBottomSheet.current.snapTo( 0 )
        }}
        isBottomImage={true}
        bottomImage={require( '../assets/images/icons/errorImage.png' )}
      />
    )
  }, [ JailBrokenTitle ] )

  const renderErrorModalHeader = useCallback( () => {
    return (
      <ModalHeader
        onPressHeader={() => {
          ErrorBottomSheet.current.snapTo( 0 )
        }}
      />
    )
  }, [] )

  return (
    <View style={{
      flex: 1
    }}>
      <StatusBar />
      <View style={{
        flex: 1
      }}>
        <View style={{
        }}>
          <Text style={styles.headerTitleText}>{content.login.welcome}</Text>
          <View>
            <Text style={styles.headerInfoText}>
              {content.login.enter_your}{' '}
              <Text style={styles.boldItalicText}>{content.login.passcode}</Text>
            </Text>
            <View style={{
              alignSelf: 'baseline'
            }}>
              <View style={styles.passcodeTextInputView}>
                <View
                  style={[
                    passcode.length == 0 && passcodeFlag == true
                      ? styles.textBoxActive
                      : styles.textBoxStyles,
                  ]}
                >
                  <Text
                    style={[
                      passcode.length == 0 && passcodeFlag == true
                        ? styles.textFocused
                        : styles.textStyles,
                    ]}
                  >
                    {passcode.length >= 1 ? (
                      <Text
                        style={{
                          fontSize: RFValue( 10 ),
                          textAlignVertical: 'center',
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                      >
                        <FontAwesome
                          size={10}
                          name={'circle'}
                          color={Colors.black}
                        />
                      </Text>
                    ) : passcode.length == 0 && passcodeFlag == true ? (
                      <Text style={styles.passcodeTextInputText}>{'|'}</Text>
                    ) : (
                      ''
                    )}
                  </Text>
                </View>
                <View
                  style={[
                    passcode.length == 1
                      ? styles.textBoxActive
                      : styles.textBoxStyles,
                  ]}
                >
                  <Text
                    style={[
                      passcode.length == 1
                        ? styles.textFocused
                        : styles.textStyles,
                    ]}
                  >
                    {passcode.length >= 2 ? (
                      <Text style={{
                        fontSize: RFValue( 10 )
                      }}>
                        <FontAwesome
                          size={10}
                          name={'circle'}
                          color={Colors.black}
                        />
                      </Text>
                    ) : passcode.length == 1 ? (
                      <Text style={styles.passcodeTextInputText}>{'|'}</Text>
                    ) : (
                      ''
                    )}
                  </Text>
                </View>
                <View
                  style={[
                    passcode.length == 2
                      ? styles.textBoxActive
                      : styles.textBoxStyles,
                  ]}
                >
                  <Text
                    style={[
                      passcode.length == 2
                        ? styles.textFocused
                        : styles.textStyles,
                    ]}
                  >
                    {passcode.length >= 3 ? (
                      <Text style={{
                        fontSize: RFValue( 10 )
                      }}>
                        <FontAwesome
                          size={10}
                          name={'circle'}
                          color={Colors.black}
                        />
                      </Text>
                    ) : passcode.length == 2 ? (
                      <Text style={styles.passcodeTextInputText}>{'|'}</Text>
                    ) : (
                      ''
                    )}
                  </Text>
                </View>
                <View
                  style={[
                    passcode.length == 3
                      ? styles.textBoxActive
                      : styles.textBoxStyles,
                  ]}
                >
                  <Text
                    style={[
                      passcode.length == 3
                        ? styles.textFocused
                        : styles.textStyles,
                    ]}
                  >
                    {passcode.length >= 4 ? (
                      <Text style={{
                        fontSize: RFValue( 10 )
                      }}>
                        <FontAwesome
                          size={10}
                          name={'circle'}
                          color={Colors.black}
                        />
                      </Text>
                    ) : passcode.length == 3 ? (
                      <Text style={styles.passcodeTextInputText}>{'|'}</Text>
                    ) : (
                      ''
                    )}
                  </Text>
                </View>
              </View>
              {checkPasscode()}
            </View>
          </View>

          {passcode.length == 4 ? (
            <View>
              <TouchableOpacity
                disabled={isDisabledProceed}
                onPress={() => {
                  setCheckAuth( false )
                  setTimeout( () => {
                    setIsDisabledProceed( true )
                    setElevation( 0 )
                  }, 2 )
                  setTimeout( () => loaderBottomSheet.current?.snapTo( 1 ), 2 )
                  handleLoaderMessages( passcode )
                }}
                style={{
                  ...styles.proceedButtonView,
                  elevation: Elevation,
                  backgroundColor: isDisabledProceed
                    ? Colors.lightBlue
                    : Colors.blue,
                }}
              >
                <Text style={styles.proceedButtonText}>Proceed</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>

        <View style={{
          marginTop: 'auto', marginBottom: 20
        }}>
          <View style={styles.keyPadRow}>
            <TouchableOpacity
              onPress={() => onPressNumber( '1' )}
              style={styles.keyPadElementTouchable}
            >
              <Text
                style={styles.keyPadElementText}
                onPress={() => onPressNumber( '1' )}
              >
                1
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onPressNumber( '2' )}
              style={styles.keyPadElementTouchable}
            >
              <Text
                style={styles.keyPadElementText}
                onPress={() => onPressNumber( '2' )}
              >
                2
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onPressNumber( '3' )}
              style={styles.keyPadElementTouchable}
            >
              <Text
                style={styles.keyPadElementText}
                onPress={() => onPressNumber( '3' )}
              >
                3
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.keyPadRow}>
            <TouchableOpacity
              onPress={() => onPressNumber( '4' )}
              style={styles.keyPadElementTouchable}
            >
              <Text
                style={styles.keyPadElementText}
                onPress={() => onPressNumber( '4' )}
              >
                4
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onPressNumber( '5' )}
              style={styles.keyPadElementTouchable}
            >
              <Text
                style={styles.keyPadElementText}
                onPress={() => onPressNumber( '5' )}
              >
                5
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onPressNumber( '6' )}
              style={styles.keyPadElementTouchable}
            >
              <Text
                style={styles.keyPadElementText}
                onPress={() => onPressNumber( '6' )}
              >
                6
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.keyPadRow}>
            <TouchableOpacity
              onPress={() => onPressNumber( '7' )}
              style={styles.keyPadElementTouchable}
            >
              <Text
                style={styles.keyPadElementText}
                onPress={() => onPressNumber( '7' )}
              >
                7
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onPressNumber( '8' )}
              style={styles.keyPadElementTouchable}
            >
              <Text
                style={styles.keyPadElementText}
                onPress={() => onPressNumber( '8' )}
              >
                8
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onPressNumber( '9' )}
              style={styles.keyPadElementTouchable}
            >
              <Text
                style={styles.keyPadElementText}
                onPress={() => onPressNumber( '9' )}
              >
                9
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.keyPadRow}>
            <View style={styles.keyPadElementTouchable}>
              <Text style={{
                flex: 1, padding: 15
              }}></Text>
            </View>
            <TouchableOpacity
              onPress={() => onPressNumber( '0' )}
              style={styles.keyPadElementTouchable}
            >
              <Text
                style={styles.keyPadElementText}
                onPress={() => onPressNumber( '0' )}
              >
                0
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onPressNumber( 'x' )}
              style={styles.keyPadElementTouchable}
            >
              <Text
                style={styles.keyPadElementText}
                onPress={() => onPressNumber( 'x' )}
              >
                <Ionicons name="ios-backspace" size={30} color={Colors.blue} />
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <BottomSheet
          onCloseEnd={() => { }}
          enabledGestureInteraction={false}
          enabledInnerScrolling={true}
          ref={loaderBottomSheet}
          snapPoints={[ -50, hp( '100%' ) ]}
          renderContent={renderLoaderModalContent}
          renderHeader={renderLoaderModalHeader}
        />
      </View>
      <BottomSheet
        onCloseEnd={() => {
          setElevation( 10 )
        }}
        onOpenEnd={() => {
          setElevation( 0 )
        }}
        enabledInnerScrolling={true}
        ref={ErrorBottomSheet}
        snapPoints={[
          -50,
          Platform.OS == 'ios' && DeviceInfo.hasNotch() ? hp( '25%' ) : hp( '30%' ),
        ]}
        renderContent={renderErrorModalContent}
        renderHeader={renderErrorModalHeader}
      />
    </View>
  )
}

const styles = StyleSheet.create( {
  textBoxStyles: {
    borderWidth: 0.5,
    height: wp( '13%' ),
    width: wp( '13%' ),
    borderRadius: 7,
    marginLeft: 20,
    borderColor: Colors.borderColor,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  textBoxActive: {
    height: wp( '13%' ),
    width: wp( '13%' ),
    borderRadius: 7,
    marginLeft: 20,
    elevation: 10,
    shadowColor: Colors.borderColor,
    shadowOpacity: 1,
    shadowOffset: {
      width: 0, height: 3
    },
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  textStyles: {
    color: Colors.black,
    fontSize: RFValue( 13 ),
    textAlign: 'center',
    lineHeight: 18,
  },
  textFocused: {
    color: Colors.black,
    fontSize: RFValue( 13 ),
    textAlign: 'center',
    lineHeight: 18,
  },
  keyPadRow: {
    flexDirection: 'row',
    height: hp( '8%' ),
  },
  keyPadElementTouchable: {
    flex: 1,
    height: hp( '8%' ),
    fontSize: RFValue( 18 ),
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyPadElementText: {
    color: Colors.blue,
    fontSize: RFValue( 25 ),
    fontFamily: Fonts.FiraSansRegular,
    fontStyle: 'normal',
  },
  proceedButtonView: {
    marginLeft: 20,
    marginTop: hp( '6%' ),
    height: wp( '13%' ),
    width: wp( '30%' ),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    shadowColor: Colors.shadowBlue,
    shadowOpacity: 1,
    shadowOffset: {
      width: 15, height: 15
    },
  },
  proceedButtonText: {
    color: Colors.white,
    fontSize: RFValue( 13 ),
    fontFamily: Fonts.FiraSansMedium,
  },
  boldItalicText: {
    fontFamily: Fonts.FiraSansMediumItalic,
    fontWeight: 'bold',
    fontStyle: 'italic',
  },
  errorText: {
    fontFamily: Fonts.FiraSansMediumItalic,
    color: Colors.red,
    fontSize: RFValue( 11 ),
    fontStyle: 'italic',
  },
  headerTitleText: {
    color: Colors.blue,
    fontSize: RFValue( 25 ),
    marginLeft: 20,
    marginTop: hp( '10%' ),
    fontFamily: Fonts.FiraSansRegular,
  },
  headerInfoText: {
    color: Colors.textColorGrey,
    fontSize: RFValue( 12 ),
    marginLeft: 20,
    fontFamily: Fonts.FiraSansRegular,
  },
  passcodeTextInputText: {
    color: Colors.blue,
    fontWeight: 'bold',
    fontSize: RFValue( 13 ),
  },
  passcodeTextInputView: {
    flexDirection: 'row',
    marginTop: hp( '4.5%' ),
    marginBottom: hp( '1.5%' ),
    width: 'auto',
  },
} )
