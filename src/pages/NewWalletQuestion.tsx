import React, { useState, useEffect, useCallback } from 'react'
import {
  StyleSheet,
  View,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Text,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  TextInput,
  AsyncStorage,
} from 'react-native'
import FontAwesome from 'react-native-vector-icons/FontAwesome'
import Ionicons from 'react-native-vector-icons/Ionicons'
import Fonts from '../common/Fonts'
import Colors from '../common/Colors'
import QuestionList from '../common/QuestionList'
import CommonStyles from '../common/Styles/Styles'
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen'
import Feather from 'react-native-vector-icons/Feather'
import { RFValue } from 'react-native-responsive-fontsize'
import HeaderTitle from '../components/HeaderTitle'
import BottomInfoBox from '../components/BottomInfoBox'

import { useDispatch, useSelector } from 'react-redux'
import { initializeSetup } from '../store/actions/setupAndAuth'
import BottomSheet from 'reanimated-bottom-sheet'
import LoaderModal from '../components/LoaderModal'
import { getTestcoins } from '../store/actions/accounts'
import { TEST_ACCOUNT } from '../common/constants/serviceTypes'

import DeviceInfo from 'react-native-device-info'
import { walletCheckIn } from '../store/actions/trustedContacts'
import { setVersion } from '../store/actions/versionHistory'
import content from '../common/content'

// only admit lowercase letters and digits
const ALLOWED_CHARACTERS_REGEXP = /^[0-9a-z]+$/

function validateAllowedCharacters( answer: string ): boolean {
  return answer == '' || ALLOWED_CHARACTERS_REGEXP.test( answer )
}

export default function NewWalletQuestion( props ) {
  const [ message, setMessage ] = useState( content.wallet_setup.setup_messages[ 0 ].heading )
  const [ subTextMessage, setSubTextMessage ] = useState(
    content.wallet_setup.setup_messages[ 0 ].text
  )
  const [ Elevation, setElevation ] = useState( 10 )
  const [ isLoaderStart, setIsLoaderStart ] = useState( false )
  const [ dropdownBoxOpenClose, setDropdownBoxOpenClose ] = useState( false )
  const [ dropdownBoxList ] = useState( QuestionList )
  const [ dropdownBoxValue, setDropdownBoxValue ] = useState( {
    id: '',
    question: '',
  } )
  const [ answerInputStyle, setAnswerInputStyle ] = useState( styles.inputBox )
  const [ confirmInputStyle, setConfirmAnswerInputStyle ] = useState(
    styles.inputBox,
  )
  const [ confirmAnswer, setConfirmAnswer ] = useState( '' )
  const [ answer, setAnswer ] = useState( '' )
  const [ answerMasked, setAnswerMasked ] = useState( '' )
  const [ confirmAnswerMasked, setConfirmAnswerMasked ] = useState( '' )
  const [ hideShowConfirmAnswer, setHideShowConfirmAnswer ] = useState( true )
  const [ hideShowAnswer, setHdeShowAnswer ] = useState( true )
  const dispatch = useDispatch()
  const walletName = props.navigation.getParam( 'walletName' )
  const [ answerError, setAnswerError ] = useState( '' )
  const [ tempAns, setTempAns ] = useState( '' )
  const [ isEditable, setIsEditable ] = useState( true )
  const [ isDisabled, setIsDisabled ] = useState( false )
  const { isInitialized } = useSelector( ( state ) => state.setupAndAuth )
  const [ loaderBottomSheet ] = useState( React.createRef() )
  const [ confirmAnswerTextInput ] = useState( React.createRef() )
  const [ visibleButton, setVisibleButton ] = useState( false )
  const accounts = useSelector( ( state ) => state.accounts )
  const testAccService = accounts[ TEST_ACCOUNT ].service

  useEffect( () => {
    ( async () => {
      if ( testAccService ) {
        const { balances } = testAccService.hdWallet
        const netBalance = testAccService
          ? balances.balance + balances.unconfirmedBalance
          : 0
        if ( !netBalance ) {
          dispatch( getTestcoins( TEST_ACCOUNT ) )
        }
      }
    } )()
  }, [ testAccService ] )

  useEffect( () => {
    ( async () => {
      if ( isLoaderStart ) {
        const security = {
          question: dropdownBoxValue.question,
          answer,
        }
        dispatch( initializeSetup( walletName, security ) )
        dispatch( setVersion( 'Current' ) )
        const current = Date.now()
        await AsyncStorage.setItem(
          'SecurityAnsTimestamp',
          JSON.stringify( current ),
        )
        const securityQuestionHistory = {
          created: current,
        }
        await AsyncStorage.setItem(
          'securityQuestionHistory',
          JSON.stringify( securityQuestionHistory ),
        )
      }
    } )()
  }, [ isLoaderStart ] )

  useEffect( () => {
    if (
      isInitialized
      // exchangeRates &&
      // balances.testBalance &&
      // transactions.length > 0
    ) {
      ( loaderBottomSheet as any ).current.snapTo( 0 )
      // dispatch(accountsSynched(true)); // to switch the color of the amount on the account tiles at home
      dispatch( walletCheckIn() ) // fetches exchange rates
      props.navigation.navigate( 'HomeNav' )
    }
  }, [ isInitialized ] )


  const handleSubmit = () => {
    setConfirmAnswer( tempAns )

    if ( answer && confirmAnswer && confirmAnswer != answer ) {
      setAnswerError( content.wallet_setup.answers_dont )
    } else if (
      validateAllowedCharacters( answer ) == false ||
      validateAllowedCharacters( tempAns ) == false
    ) {
      setAnswerError( content.wallet_setup.answers_validation )
    } else {
      setTimeout( () => {
        setAnswerError( '' )
      }, 2 )
    }
  }


  useEffect( () => {
    if ( answer.trim() == confirmAnswer.trim() && answer && confirmAnswer && answerError.length == 0 ) {
      setVisibleButton( true )
    } else {
      setVisibleButton( false )

      if ( answer && confirmAnswer && confirmAnswer != answer ) {
        setAnswerError( content.wallet_setup.answers_dont )
      } else if (
        validateAllowedCharacters( answer ) == false ||
        validateAllowedCharacters( confirmAnswer ) == false
      ) {
        setAnswerError( content.wallet_setup.answers_validation )
      }
    }
  }, [ confirmAnswer ] )


  const setButtonVisible = () => {
    return (
      <TouchableOpacity
        onPress={() => {
          ( loaderBottomSheet as any ).current.snapTo( 1 )
          seLoaderMessages()
          setTimeout( () => {
            setElevation( 0 )
          }, 0.2 )
          setTimeout( () => {
            setIsLoaderStart( true )
            setIsEditable( false )
            setIsDisabled( true )
          }, 2 )
        }}
        style={{
          ...styles.buttonView, elevation: Elevation
        }}
      >
        {/* {!loading.initializing ? ( */}
        <Text style={styles.buttonText}>{content.button.confirm}</Text>
        {/* ) : (
          <ActivityIndicator size="small" />
        )} */}
      </TouchableOpacity>
    )
  }

  const seLoaderMessages = () => {
    setTimeout( () => {
      setMessage( content.wallet_setup.setup_messages[ 1 ].heading )
      setSubTextMessage( content.wallet_setup.setup_messages[ 1 ].text )
      setTimeout( () => {
        setMessage( content.wallet_setup.setup_messages[ 2 ].heading )
        setSubTextMessage( content.wallet_setup.setup_messages[ 2 ].text )
        setTimeout( () => {
          setMessage( content.wallet_setup.setup_messages[ 3 ].heading )
          setSubTextMessage( content.wallet_setup.setup_messages[ 3 ].text )
        }, 3000 )
      }, 3000 )
    }, 3000 )
  }

  const renderLoaderModalContent = useCallback( () => {
    return <LoaderModal headerText={message} messageText={subTextMessage} />
  }, [ message, subTextMessage ] )

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

  return (
    <View style={{
      flex: 1
    }}>
      <StatusBar backgroundColor={Colors.white} barStyle="dark-content" />
      <SafeAreaView style={{
        flex: 0
      }} />
      <KeyboardAvoidingView
        style={{
          flex: 1,
        }}
        behavior={Platform.OS == 'ios' ? 'padding' : ''}
        enabled
      >
        <ScrollView>
          <View style={{
            flex: 1
          }}>
            <View style={CommonStyles.headerContainer}>
              <TouchableOpacity
                style={CommonStyles.headerLeftIconContainer}
                onPress={() => {
                  props.navigation.navigate( 'WalletInitialization' )
                }}
              >
                <View style={CommonStyles.headerLeftIconInnerContainer}>
                  <FontAwesome
                    name="long-arrow-left"
                    color={Colors.blue}
                    size={17}
                  />
                </View>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              activeOpacity={10}
              style={{
                flex: 1
              }}
              onPress={() => {
                setDropdownBoxOpenClose( false )
                Keyboard.dismiss()
              }}
              disabled={isDisabled}
            >
              <HeaderTitle
                firstLineTitle={content.wallet_setup.new}
                secondLineTitle={''}
                infoTextNormal={content.wallet_setup.setup}
                infoTextBold={content.wallet_setup.secret_question}
                infoTextNormal1={`\n${content.wallet_setup.remember}`}
              />

              <TouchableOpacity
                activeOpacity={10}
                style={
                  dropdownBoxOpenClose
                    ? styles.dropdownBoxOpened
                    : styles.dropdownBox
                }
                onPress={() => {
                  setDropdownBoxOpenClose( !dropdownBoxOpenClose )
                }}
                disabled={isDisabled}
              >
                <Text style={styles.dropdownBoxText}>
                  {dropdownBoxValue.question
                    ? dropdownBoxValue.question
                    : content.wallet_setup.select_question}
                </Text>
                <Ionicons
                  style={{
                    marginLeft: 'auto'
                  }}
                  name={
                    dropdownBoxOpenClose ? 'ios-arrow-up' : 'ios-arrow-down'
                  }
                  size={20}
                  color={Colors.textColorGrey}
                />
              </TouchableOpacity>

              {dropdownBoxOpenClose ? (
                <View style={styles.dropdownBoxModal}>
                  <ScrollView
                    nestedScrollEnabled={true}
                    style={{
                      height: hp( '40%' )
                    }}
                  >
                    {dropdownBoxList.map( ( value, index ) => (
                      <TouchableOpacity
                        onPress={() => {
                          setTimeout( () => {
                            setDropdownBoxValue( value )
                            setDropdownBoxOpenClose( false )
                          }, 70 )
                        }}
                        style={{
                          ...styles.dropdownBoxModalElementView,
                          borderTopLeftRadius: index == 0 ? 10 : 0,
                          borderTopRightRadius: index == 0 ? 10 : 0,
                          borderBottomLeftRadius:
                            index == dropdownBoxList.length - 1 ? 10 : 0,
                          borderBottomRightRadius:
                            index == dropdownBoxList.length - 1 ? 10 : 0,
                          paddingTop: index == 0 ? 5 : 0,
                          backgroundColor: dropdownBoxValue
                            ? dropdownBoxValue.id == value.id
                              ? Colors.lightBlue
                              : Colors.white
                            : Colors.white,
                        }}
                      >
                        <Text
                          style={{
                            color:
                              dropdownBoxValue.id == value.id
                                ? Colors.blue
                                : Colors.black,
                            fontFamily: Fonts.FiraSansRegular,
                            fontSize: RFValue( 12 ),
                          }}
                        >
                          {value.question}
                        </Text>
                      </TouchableOpacity>
                    ) )}
                  </ScrollView>
                </View>
              ) : null}
              {dropdownBoxValue.id ? (
                <View style={{
                  marginTop: 15
                }}>
                  <View
                    style={{
                      ...answerInputStyle,
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingRight: 15,
                      borderColor: answerError ? Colors.red : Colors.borderColor,
                    }}
                  >
                    <TextInput
                      style={styles.modalInputBox}
                      placeholder={content.wallet_setup.enter_answer}
                      placeholderTextColor={Colors.borderColor}
                      value={hideShowAnswer ? answerMasked : answer}
                      autoCompleteType="off"
                      textContentType="none"
                      returnKeyType="next"
                      autoCorrect={false}
                      editable={isEditable}
                      autoCapitalize="none"
                      onSubmitEditing={() =>
                        ( confirmAnswerTextInput as any ).current.focus()
                      }
                      keyboardType={
                        Platform.OS == 'ios'
                          ? 'ascii-capable'
                          : 'visible-password'
                      }
                      onChangeText={( text ) => {
                        setAnswer( text )
                        setAnswerMasked( text )
                      }}
                      onFocus={() => {
                        setDropdownBoxOpenClose( false )
                        setAnswerInputStyle( styles.inputBoxFocused )
                        if ( answer.length > 0 ) {
                          setAnswer( '' )
                          setAnswerMasked( '' )
                        }
                      }}
                      onBlur={() => {
                        setAnswerInputStyle( styles.inputBox )
                        setDropdownBoxOpenClose( false )
                        let temp = ''
                        for ( let i = 0; i < answer.length; i++ ) {
                          temp += '*'
                        }
                        setAnswerMasked( temp )
                        handleSubmit()
                      }}
                    />
                    {answer ? (
                      <TouchableWithoutFeedback
                        onPress={() => {
                          setHdeShowAnswer( !hideShowAnswer )
                        }}
                      >
                        <Feather
                          style={{
                            marginLeft: 'auto', padding: 10
                          }}
                          size={15}
                          color={Colors.blue}
                          name={hideShowAnswer ? 'eye-off' : 'eye'}
                        />
                      </TouchableWithoutFeedback>
                    ) : null}
                  </View>
                  <View
                    style={{
                      ...confirmInputStyle,
                      marginBottom: 15,
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingRight: 15,
                      marginTop: 15,
                      borderColor: answerError ? Colors.red : Colors.borderColor,
                    }}
                  >
                    <TextInput
                      style={styles.modalInputBox}
                      ref={confirmAnswerTextInput}
                      placeholder={content.wallet_setup.confirm_answer}
                      placeholderTextColor={Colors.borderColor}
                      value={
                        hideShowConfirmAnswer ? confirmAnswerMasked : tempAns
                      }
                      keyboardType={
                        Platform.OS == 'ios'
                          ? 'ascii-capable'
                          : 'visible-password'
                      }
                      returnKeyType="done"
                      returnKeyLabel="Done"
                      autoCompleteType="off"
                      autoCorrect={false}
                      editable={isEditable}
                      autoCapitalize="none"
                      onChangeText={( text ) => {
                        setTempAns( text )
                        setConfirmAnswerMasked( text )
                      }}
                      onSubmitEditing={handleSubmit}
                      onFocus={() => {
                        setDropdownBoxOpenClose( false )
                        setConfirmAnswerInputStyle( styles.inputBoxFocused )
                        if ( tempAns.length > 0 ) {
                          setTempAns( '' )
                          setAnswerError( '' )
                          setConfirmAnswer( '' )
                          setConfirmAnswerMasked( '' )
                        }
                      }}
                      onBlur={() => {
                        setConfirmAnswerInputStyle( styles.inputBox )
                        setDropdownBoxOpenClose( false )
                        let temp = ''
                        for ( let i = 0; i < tempAns.length; i++ ) {
                          temp += '*'
                        }
                        setConfirmAnswerMasked( temp )
                        handleSubmit()
                      }}
                    />
                    {confirmAnswer ? (
                      <TouchableWithoutFeedback
                        onPress={() => {
                          setHideShowConfirmAnswer( !hideShowConfirmAnswer )
                          setDropdownBoxOpenClose( false )
                        }}
                      >
                        <Feather
                          style={{
                            marginLeft: 'auto', padding: 10
                          }}
                          size={15}
                          color={Colors.blue}
                          name={hideShowConfirmAnswer ? 'eye-off' : 'eye'}
                        />
                      </TouchableWithoutFeedback>
                    ) : null}
                  </View>

                  {answerError.length == 0 && (
                    <Text style={styles.helpText}>{content.wallet_setup.answers_validation}</Text>
                  )}
                </View>
              ) : (
                <View style={{
                  marginTop: 15
                }} />
              )}
              <View
                style={{
                  marginLeft: 20,
                  marginRight: 20,
                  flexDirection: 'row',
                }}
              >
                <Text
                  style={{
                    color: Colors.red,
                    fontFamily: Fonts.FiraSansMediumItalic,
                    fontSize: RFValue( 10 ),
                    marginLeft: 'auto',
                  }}
                >
                  {answerError}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flexDirection: 'row',
                marginLeft: 25,
                marginRight: 25,
                paddingBottom: 10,
                paddingTop: 10,
              }}
              onPress={() =>
                props.navigation.navigate( 'NewOwnQuestions', {
                  walletName,
                } )
              }
            >
              <Text
                style={{
                  fontFamily: Fonts.FiraSansMediumItalic,
                  fontWeight: 'bold',
                  fontStyle: 'italic',
                  fontSize: RFValue( 12 ),
                  color: Colors.blue,
                }}
                onPress={() =>
                  props.navigation.navigate( 'NewOwnQuestions', {
                    walletName,
                  } )
                }
              >
                {content.wallet_setup.choose_own_question}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <View style={{
        ...styles.bottomButtonView,
      }}>
        {(
          answer.trim() == confirmAnswer.trim() &&
            confirmAnswer.trim() &&
            answer.trim() && answerError.length == 0
        ) && (
          setButtonVisible()
        ) || null}
        <View style={styles.statusIndicatorView}>
          <View style={styles.statusIndicatorInactiveView} />
          <View style={styles.statusIndicatorActiveView} />
        </View>
      </View>

      {!visibleButton ? (
        <View
          style={{
            marginBottom:
                Platform.OS == 'ios' && DeviceInfo.hasNotch ? hp( '1%' ) : 0,
          }}
        >
          <BottomInfoBox
            title={content.wallet_setup.answer_encrypt}
            infoText={content.wallet_setup.extremely_important}
            italicText={content.wallet_setup.know_and_remember}          />
        </View>
      ) : null}
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
  )
}

const styles = StyleSheet.create( {
  dropdownBox: {
    flexDirection: 'row',
    borderColor: Colors.borderColor,
    borderWidth: 0.5,
    borderRadius: 10,
    marginTop: 30,
    height: 50,
    marginLeft: 20,
    marginRight: 20,
    paddingLeft: 15,
    paddingRight: 15,
    alignItems: 'center',
  },
  dropdownBoxOpened: {
    flexDirection: 'row',
    borderColor: Colors.borderColor,
    borderWidth: 0.5,
    borderRadius: 10,
    marginTop: 30,
    height: 50,
    marginLeft: 20,
    marginRight: 20,
    paddingLeft: 15,
    paddingRight: 15,
    elevation: 10,
    shadowColor: Colors.borderColor,
    shadowOpacity: 10,
    shadowOffset: {
      width: 2, height: 2
    },
    backgroundColor: Colors.white,
    alignItems: 'center',
  },
  buttonView: {
    height: wp( '13%' ),
    width: wp( '35%' ),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    shadowColor: Colors.shadowBlue,
    shadowOpacity: 1,
    shadowOffset: {
      width: 15, height: 15
    },
    backgroundColor: Colors.blue,
  },
  buttonText: {
    color: Colors.white,
    fontSize: RFValue( 13 ),
    fontFamily: Fonts.FiraSansMedium,
  },
  bottomButtonView: {
    flexDirection: 'row',
    paddingLeft: 30,
    paddingRight: 30,
    paddingBottom: 40,
    alignItems: 'center',
  },
  bottomButtonView1: {
    flexDirection: 'row',
    marginTop: 5,
    alignItems: 'center',
  },
  statusIndicatorView: {
    flexDirection: 'row',
    marginLeft: 'auto',
  },
  statusIndicatorActiveView: {
    height: 5,
    width: 25,
    backgroundColor: Colors.blue,
    borderRadius: 10,
    marginLeft: 5,
  },
  statusIndicatorInactiveView: {
    width: 5,
    backgroundColor: Colors.lightBlue,
    borderRadius: 10,
    marginLeft: 5,
  },
  inputBox: {
    borderWidth: 0.5,
    borderRadius: 10,
    marginLeft: 20,
    marginRight: 20,
  },
  inputBoxFocused: {
    borderWidth: 0.5,
    borderRadius: 10,
    marginLeft: 20,
    marginRight: 20,
    elevation: 10,
    shadowColor: Colors.borderColor,
    shadowOpacity: 10,
    shadowOffset: {
      width: 2, height: 2
    },
    backgroundColor: Colors.white,
  },
  modalInputBox: {
    flex: 1,
    height: 50,
    fontSize: RFValue( 13 ),
    color: Colors.textColorGrey,
    fontFamily: Fonts.FiraSansRegular,
    paddingLeft: 15,
  },
  dropdownBoxText: {
    color: Colors.textColorGrey,
    fontFamily: Fonts.FiraSansRegular,
    fontSize: RFValue( 13 ),
    marginRight: 15,
  },
  dropdownBoxModal: {
    borderRadius: 10,
    margin: 15,
    height: 'auto',
    elevation: 10,
    shadowColor: Colors.shadowBlue,
    shadowOpacity: 10,
    shadowOffset: {
      width: 0, height: 10
    },
    backgroundColor: Colors.white,
  },
  dropdownBoxModalElementView: {
    height: 55,
    justifyContent: 'center',
    paddingLeft: 15,
    paddingRight: 15,
  },

  helpText: {
    fontSize: RFValue( 12 ),
    color: Colors.textColorGrey,
    paddingHorizontal: 24,
  }
} )
