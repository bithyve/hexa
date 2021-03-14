import React, { useState } from 'react'
import {
  View,
  Image,
  TouchableOpacity,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform
} from 'react-native'
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp
} from 'react-native-responsive-screen'
import Colors from '../common/Colors'
import QuestionList from '../common/QuestionList'
import Fonts from '../common/Fonts'
import { RFValue } from 'react-native-responsive-fontsize'
import FontAwesome from 'react-native-vector-icons/FontAwesome'
import BottomInfoBox from '../components/BottomInfoBox'
// import Fontisto from "react-native-vector-icons/Fontisto";
import Ionicons from 'react-native-vector-icons/Ionicons'
import DeviceInfo from 'react-native-device-info'

export default function FastBitcoinCalculationModalContents( props ) {
  const [ dropdownBoxOpenClose, setDropdownBoxOpenClose ] = useState( false )
  const [ dropdownBoxValue, setDropdownBoxValue ] = useState( {
    id: '',
    question: ''
  } )
  const [ VoucherCodeRef, setVoucherCodeRef ] = useState( React.createRef() )
  const [ BitcoinAddressRef, setBitcoinAddressRef ] = useState( React.createRef() )
  const [ dropdownBoxList ] = useState( QuestionList )
  const [ VoucherCode, setVoucherCode ] = useState( '' )
  const [ BitcoinAddress, setBitcoinAddress ] = useState( '' )

  return (
    <View style={styles.modalContainer}>
      <View style={styles.modalHeaderTitleView}>
        <View style={{
          flexDirection: 'row'
        }}>
          <TouchableOpacity
            onPress={() => props.onPressBack()}
            style={{
              height: 30, width: 30
            }}
          >
            <FontAwesome name="long-arrow-left" color={Colors.blue} size={17} />
          </TouchableOpacity>
          <View>
            <Text style={styles.modalHeaderTitleText}>{props.pageTitle}</Text>
            <Text style={styles.modalHeaderInfoText}>
              {props.pageInfo}
              {props.pageInfoNextLine ? '\n' + props.pageInfoNextLine : null}
            </Text>
          </View>
        </View>
      </View>
      <KeyboardAvoidingView
        style={{
          flex: 1
        }}
        behavior={Platform.OS == 'ios' ? 'padding' : ''}
        enabled
      >
        <ScrollView
          style={{
            paddingLeft: 30,
            paddingRight: 30
          }}
        >
          <View style={styles.textBoxView}>
            <View style={styles.amountInputImage}>
              <Ionicons name={'hashtag'} size={20} color={'#C6C6C6'} />
            </View>
            <TextInput
              ref={refs => setVoucherCodeRef( refs )}
              style={{
                ...styles.textBox, paddingLeft: 10
              }}
              placeholder={'Enter Voucher Code'}
              placeholderTextColor={Colors.borderColor}
              onFocus={() => {
                props.modalRef.current.snapTo( 2 )
              }}
              onBlur={() => {
                if ( !BitcoinAddressRef.isFocused() ) {
                  props.modalRef.current.snapTo( 1 )
                }
              }}
              value={VoucherCode}
              onChangeText={text => setVoucherCode( text )}
            />
          </View>

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
          >
            <Text
              style={{
                ...styles.dropdownBoxText,
                color: dropdownBoxValue.question
                  ? Colors.textColorGrey
                  : Colors.borderColor
              }}
            >
              {dropdownBoxValue.question
                ? dropdownBoxValue.question
                : 'Select bitcoin delivery'}
            </Text>
            <Ionicons
              style={{
                marginLeft: 'auto'
              }}
              name={dropdownBoxOpenClose ? 'ios-arrow-up' : 'ios-arrow-down'}
              size={15}
              color={Colors.borderColor}
            />
          </TouchableOpacity>
          <View style={{
            position: 'relative', height: '100%'
          }}>
            {dropdownBoxOpenClose && (
              <View style={styles.dropdownBoxModal}>
                <ScrollView>
                  {dropdownBoxList.map( ( value, index ) => (
                    <TouchableOpacity
                      onPress={() => {
                        setDropdownBoxValue( value )
                        setDropdownBoxOpenClose( false )
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
                        backgroundColor:
                          dropdownBoxValue.id == value.id
                            ? Colors.lightBlue
                            : Colors.white
                      }}
                    >
                      <Text
                        style={{
                          color:
                            dropdownBoxValue.id == value.id
                              ? Colors.blue
                              : Colors.black,
                          fontFamily: Fonts.FiraSansRegular,
                          fontSize: RFValue( 12 )
                        }}
                      >
                        {value.question}
                      </Text>
                    </TouchableOpacity>
                  ) )}
                </ScrollView>
              </View>
            )}
            <View style={{
              ...styles.textBoxView, marginTop: hp( '3%' )
            }}>
              <View style={styles.amountInputImage}>
                <Image
                  style={styles.textBoxImage}
                  source={require( '../assets/images/icons/icon_bitcoin_gray.png' )}
                />
              </View>
              <TextInput
                ref={refs => setBitcoinAddressRef( refs )}
                style={{
                  ...styles.textBox, paddingLeft: 10
                }}
                placeholder={'Enter Bitcoin Address'}
                placeholderTextColor={Colors.borderColor}
                autoCapitalize="none"
                onFocus={() => {
                  props.modalRef.current.snapTo( 2 )
                }}
                onBlur={() => {
                  if ( !VoucherCodeRef.isFocused() ) {
                    props.modalRef.current.snapTo( 1 )
                  }
                }}
                value={BitcoinAddress}
                onChangeText={text => setBitcoinAddress( text )}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <View style={{
        marginBottom: 20, marginTop: 'auto'
      }}>
        <BottomInfoBox title={props.noteTitle} infoText={props.noteInfo} />
        <TouchableOpacity
          style={{
            marginLeft: 20,
            marginRight: 20,
            backgroundColor: Colors.blue,
            width: wp( '35%' ),
            height: wp( '13%' ),
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 10
          }}
        >
          <Text
            style={{
              color: Colors.white,
              fontSize: RFValue( 13 ),
              fontFamily: Fonts.FiraSansMedium
            }}
          >
            {props.proceedButtonText}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}
const styles = StyleSheet.create( {
  modalContainer: {
    height: '100%',
    backgroundColor: Colors.white,
    alignSelf: 'center',
    width: '100%'
  },
  modalHeaderTitleView: {
    borderBottomWidth: 1,
    borderColor: Colors.borderColor,
    alignItems: 'center',
    flexDirection: 'row',
    paddingRight: 10,
    paddingBottom: hp( '3%' ),
    paddingTop: hp( '2%' ),
    marginLeft: 20,
    marginRight: 20,
    marginBottom: 15
  },
  modalHeaderTitleText: {
    color: Colors.blue,
    fontSize: RFValue( 18 ),
    fontFamily: Fonts.FiraSansMedium
  },
  modalHeaderInfoText: {
    color: Colors.textColorGrey,
    fontSize: RFValue( 11 ),
    fontFamily: Fonts.FiraSansRegular,
    marginTop: hp( '0.7%' )
  },
  textBoxView: {
    flexDirection: 'row',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    height: DeviceInfo.hasNotch() ? hp( '7%' ) : hp( '8%' ),
    marginTop: hp( '1%' ),
    marginBottom: hp( '1%' )
  },
  amountInputImage: {
    width: 40,
    height: DeviceInfo.hasNotch() ? hp( '7%' ) : hp( '8%' ),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.borderColor,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10
  },
  textBox: {
    flex: 1,
    paddingLeft: 20,
    color: Colors.textColorGrey,
    fontFamily: Fonts.FiraSansMedium,
    fontSize: RFValue( 13 )
  },
  textBoxImage: {
    width: wp( '6%' ),
    height: wp( '6%' ),
    resizeMode: 'contain'
  },
  dropdownBoxText: {
    fontFamily: Fonts.FiraSansRegular,
    fontSize: RFValue( 13 )
  },
  dropdownBoxModal: {
    borderRadius: 10,
    borderColor: Colors.borderColor,
    borderWidth: 0.5,
    marginTop: hp( '2%' ),
    width: '100%',
    height: '90%',
    elevation: 10,
    shadowColor: Colors.shadowBlue,
    shadowOpacity: 10,
    shadowOffset: {
      width: 0, height: 10
    },
    backgroundColor: Colors.white,
    position: 'absolute',
    zIndex: 9999,
    overflow: 'hidden'
  },
  dropdownBoxModalElementView: {
    height: 55,
    justifyContent: 'center',
    paddingLeft: 15,
    paddingRight: 15
  },
  dropdownBox: {
    marginTop: hp( '2%' ),
    flexDirection: 'row',
    borderColor: Colors.borderColor,
    borderWidth: 0.5,
    borderRadius: 10,
    height: DeviceInfo.hasNotch() ? hp( '7%' ) : hp( '8%' ),
    paddingLeft: 15,
    paddingRight: 15,
    alignItems: 'center',
    backgroundColor: Colors.white
  },
  dropdownBoxOpened: {
    marginTop: hp( '2%' ),
    flexDirection: 'row',
    borderColor: Colors.borderColor,
    borderWidth: 0.5,
    borderRadius: 10,
    height: DeviceInfo.hasNotch() ? hp( '7%' ) : hp( '8%' ),
    paddingLeft: 15,
    paddingRight: 15,
    elevation: 10,
    shadowColor: Colors.borderColor,
    shadowOpacity: 10,
    shadowOffset: {
      width: 2, height: 2
    },
    backgroundColor: Colors.white,
    alignItems: 'center'
  }
} )
