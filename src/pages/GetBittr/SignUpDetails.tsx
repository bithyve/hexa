import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  Text,
  TouchableOpacity,
  Platform,
  SafeAreaView,
  TextInput,
  Keyboard,
  ScrollView,
  Linking,
  AsyncStorage,
  ActivityIndicator,
} from 'react-native';
import Colors from '../../common/Colors';
import Fonts from '../../common/Fonts';
import BottomSheet from 'reanimated-bottom-sheet';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { RFValue } from 'react-native-responsive-fontsize';
import DeviceInfo from 'react-native-device-info';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Octicons from 'react-native-vector-icons/Octicons';
import BottomInfoBox from '../../components/BottomInfoBox';
import ModalHeader from '../../components/ModalHeader';
import ErrorModalContents from '../../components/ErrorModalContents';
import VerificationSuccessModalContents from './VerificationSuccessModalContents';
import InstructionsModalContents from './InstructionsModalContents';
import { useDispatch, useSelector } from 'react-redux';
import { createCustomer, sendEmailRequest, sendSmsRequest, verifyEmailRequest, sentEmailRequest, verifiedEmail, sentSmsRequest, ClearUserRequest } from '../../store/actions/bittr';
import { validateEmail } from '../../common/CommonFunctions';
import OtpModalContents from './OtpModalContents';
import { REGULAR_ACCOUNT, SECURE_ACCOUNT, TEST_ACCOUNT } from '../../common/constants/serviceTypes';
import { fetchDerivativeAccXpub } from '../../store/actions/accounts';

export default function SignUpDetails(props) {
  const [isIncorrectOtp, setIsIncorrectOtp] = useState(false);
  const [otp, setOtp] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [EmailToken, setEmailToken] = useState('');
  const [ErrorBottomSheet, setErrorBottomSheet] = useState(React.createRef());
  const [SmsErrorBottomSheet, setSmsErrorBottomSheet] = useState(
    React.createRef(),
  );
  const [
    VerificationSuccessBottomSheet,
    setVerificationSuccessBottomSheet,
  ] = useState(React.createRef());
  const [InstructionsBottomSheet, setInstructionsBottomSheet] = useState(
    React.createRef(),
  );
  const bitcoinAddress = props.navigation.state.params
    ? props.navigation.state.params.address
    : '';
  const selectedAccount = props.navigation.state.params
    ? props.navigation.state.params.selectedAccount
    : '';
  const EmailTokenNavigate = props.navigation.state.params
    ? props.navigation.state.params.EmailToken
    : '';
  const [OTPBottomSheet, setOTPBottomSheet] = useState(React.createRef());
  const [errorMessageHeader, setErrorMessageHeader] = useState('');
  const [errorProceedButton, setErrorProceedButton] = useState('');
  const [errorIgnoreButton, setErrorIgnoreButton] = useState('');
  const [isIgnoreButton, setIsIgnoreButton] = useState(false);
  const [buttonDisable, setButtonDisable] = useState(true);
  const [isEmailValid, setIsEmailValid] = useState(true);
  const [passcode, setPasscode] = useState([]);
  const dataGetBittr = useSelector(state => state.bittr);
  const [getBittrXpub, setGetBittrXpub] = useState("");
  const userDetails = useSelector(state => state.bittr.userDetails);
  const emailVerifiedDetails = useSelector(
    state => state.bittr.emailVerifiedDetails,
  );
  const smsSentDetails = useSelector(state => state.bittr.smsSentDetails);
  const emailSentDetails = useSelector(state => state.bittr.emailSentDetails);

  const loading = useSelector(state => state.bittr.loading);
  const dispatch = useDispatch();
  const [serviceType, setServiceType] = useState(
    props.navigation.state.params
      ? props.navigation.state.params.selectedAccount.type
      : TEST_ACCOUNT,
  );
  const service = useSelector(state => state.accounts[serviceType].service);
  console.log("service.hdWallet", service.hdWallet);
  const derivativeAccountType = 'GET_BITTR';
  let accountNumber = 0;
  const { derivativeAccount } = service.hdWallet;

  useEffect(() => {
    Linking.addEventListener('url', handleDeepLink);
  }, []);


  useEffect(() => {
    if(service){
    if (serviceType === REGULAR_ACCOUNT) {
      if (derivativeAccount && !derivativeAccount[derivativeAccountType][accountNumber])
        dispatch(fetchDerivativeAccXpub(derivativeAccountType,accountNumber));
      else
      {
        console.log({
          getBittrXpub:
            derivativeAccount[derivativeAccountType][accountNumber].xpub,
        });
        setGetBittrXpub(derivativeAccount[derivativeAccountType][accountNumber].xpub);
      }
        
    }
  }
  }, [service]);

  const handleDeepLink = useCallback(async event => {
    const EmailToken1 = event.url.substr(event.url.lastIndexOf('/') + 1);
    await AsyncStorage.setItem(
      'emailToken',
      EmailToken1 ? EmailToken1 : EmailTokenNavigate,
    );
    setTimeout(() => {
      setEmailToken(EmailToken1 ? EmailToken1 : EmailTokenNavigate);
    }, 2);
    let data = {
      token: EmailToken1 ? EmailToken1 : EmailTokenNavigate,
    };
    dispatch(verifyEmailRequest(data));
  }, []);

  useEffect(() => {
    (async () => {
      if (
        !dataGetBittr.emailVerified &&
        emailVerifiedDetails &&
        !emailVerifiedDetails.success
      ) {
        setTimeout(() => {
          setErrorMessageHeader(`Verification link\nhas expired`);
          setErrorMessage(
            'The Verification link has expired,\nplease start over again',
          );
          setErrorProceedButton('Try Again');
          setIsIgnoreButton(true);
          setErrorIgnoreButton('Back');
        }, 2);
        (ErrorBottomSheet as any).current.snapTo(1);
      } else {
        if (
          dataGetBittr.emailVerified &&
          emailVerifiedDetails &&
          emailVerifiedDetails.success
        ) {
          let mobileNumber = await AsyncStorage.getItem('MobileNo');
          let contactData = {
            phone: mobileNumber,
            country_code: '91',
          };
          dispatch(sendSmsRequest(contactData));
          dispatch(verifiedEmail());
        }
      }
    })();
  }, [dataGetBittr.emailVerified, emailVerifiedDetails]);

  useEffect(() => {
    if (smsSentDetails && !smsSentDetails.success) {
      (SmsErrorBottomSheet as any).current.snapTo(1);
    } else {
      if (dataGetBittr.smsSent && smsSentDetails && smsSentDetails.success) {
        setTimeout(() => {
        (OTPBottomSheet as any).current.snapTo(1);
      }, 2);
       // (SmsErrorBottomSheet as any).current.snapTo(0);
        dispatch(sentSmsRequest());
      } else {
        (SmsErrorBottomSheet as any).current.snapTo(0);
      }
    }
  }, [dataGetBittr.smsSent, smsSentDetails]);

  useEffect(() => {
    if (
      dataGetBittr.emailSent &&
      emailSentDetails &&
      emailSentDetails.success
    ) {
      setTimeout(() => {
        setErrorMessageHeader(`Verification link sent`);
        setErrorMessage(
          'We have sent you a verification link, you will need to verify your details to proceed\n\nPlease check your email',
        );
        setErrorProceedButton('Start Over');
      }, 2);
      (ErrorBottomSheet as any).current.snapTo(1);
      dispatch(sentEmailRequest());
    }
  }, [dataGetBittr.emailSent, emailSentDetails]);

  const renderErrorModalContent = useCallback(() => {
    return (
      <ErrorModalContents
        modalRef={ErrorBottomSheet}
        title={errorMessageHeader}
        info={errorMessage}
        note={emailAddress}
        noteNextLine={mobileNumber}
        proceedButtonText={errorProceedButton}
        headerTextColor={Colors.black1}
        buttonTextColor={Colors.buttonText}
        buttonColor={Colors.yellow}
        buttonShadowColor={Colors.shadowYellow}
        onPressProceed={() => {
          if (ErrorBottomSheet.current)
            (ErrorBottomSheet as any).current.snapTo(0);
        }}
        isIgnoreButton={isIgnoreButton}
        cancelButtonText={errorIgnoreButton}
        onPressIgnore={() => {
          if (ErrorBottomSheet.current)
            (ErrorBottomSheet as any).current.snapTo(0);
        }}
        isBottomImage={true}
        bottomImage={require('../../assets/images/icons/errorImage.png')}
      />
    );
  }, [
    emailAddress,
    mobileNumber,
    errorMessage,
    errorMessageHeader,
    errorProceedButton,
    errorIgnoreButton,
    isIgnoreButton,
  ]);

  useEffect(() => {
    if (emailAddress && mobileNumber) setButtonDisable(false);
  }, [emailAddress, mobileNumber]);

  const renderErrorModalHeader = useCallback(() => {
    return (
      <ModalHeader
        onPressHeader={() => {
          (ErrorBottomSheet as any).current.snapTo(0);
        }}
      />
    );
  }, []);

  const renderSmsErrorModalContent = useCallback(() => {
    return (
      <ErrorModalContents
        modalRef={SmsErrorBottomSheet}
        title={`Unable to generate sms validation code`}
        proceedButtonText={'Try Again'}
        headerTextColor={Colors.black1}
        buttonTextColor={Colors.buttonText}
        buttonColor={Colors.yellow}
        buttonShadowColor={Colors.shadowYellow}
        onPressProceed={() => {
          if (SmsErrorBottomSheet.current)
            (SmsErrorBottomSheet as any).current.snapTo(0);
        }}
        isIgnoreButton={true}
        cancelButtonText={'Back'}
        onPressIgnore={() => {
          if (SmsErrorBottomSheet.current)
            (SmsErrorBottomSheet as any).current.snapTo(0);
        }}
        isBottomImage={true}
        bottomImage={require('../../assets/images/icons/errorImage.png')}
      />
    );
  }, []);

  const renderSmsErrorModalHeader = useCallback(() => {
    return (
      <ModalHeader
        onPressHeader={() => {
          (SmsErrorBottomSheet as any).current.snapTo(0);
        }}
      />
    );
  }, []);

  const renderVerificationSuccessContent = useCallback(() => {
    return (
      <VerificationSuccessModalContents
        modalRef={VerificationSuccessBottomSheet}
        title={`Email Address and\nphone number verified`}
        info={
          'Please proceed to find instructions and\nall necessary details to save bitcoins\n\n'
        }
        note={emailAddress}
        noteNextLine={mobileNumber}
        proceedButtonText={'Continue'}
        onPressProceed={() => onPressProceed()}
        isIgnoreButton={false}
        isBottomImage={true}
        bottomImage={require('../../assets/images/icons/illustration.png')}
      />
    );
  }, []);

  const onPressProceed = async () => {
    let emailAddress = await AsyncStorage.getItem('emailAddress');
    let emailToken = await AsyncStorage.getItem('emailToken');
    let mobileNumber = await AsyncStorage.getItem('MobileNo');
    let data = {
      phone: mobileNumber,
      country_code: '1',
      verification_code: otp,
      email: emailAddress,
      bitcoin_address: bitcoinAddress,
      email_token: emailToken,
      initial_address_type: 'simple',
      category: 'hexa',
      ...(selectedAccount.type==REGULAR_ACCOUNT && {
        xpub_key: getBittrXpub,
        xpub_addr_type: 'auto', 
        xpub_path:' m/0/x'
      })
    };
    dispatch(createCustomer(data));
  };

  useEffect( ()=>{
    (async()=>{
      if( userDetails ){
        let getBittrAccounts = JSON.parse(await AsyncStorage.getItem("getBittrAccounts"));
        let obj = {
          getBitrrAccounts: [userDetails],
          accountType: selectedAccount.type
        }
        if(!getBittrAccounts){
          getBittrAccounts = [];
          getBittrAccounts.push(obj)
        }
        else{
          let index = getBittrAccounts.findIndex((value)=>value.accountType==selectedAccount.type);
          if(index==-1){
            getBittrAccounts.push(obj);
          }
          else{
            let GBAccounts = getBittrAccounts[index].getBitrrAccounts;
            GBAccounts.push(userDetails);
            getBittrAccounts[index].getBitrrAccounts = GBAccounts;
          }
        }
        await AsyncStorage.setItem("getBittrAccounts", JSON.stringify(getBittrAccounts));
        setTimeout(() => {
          VerificationSuccessBottomSheet.current.snapTo(0);
          InstructionsBottomSheet.current.snapTo(1);
        }, 2);
        dispatch(ClearUserRequest());
      }
      else{
      }
    })();
  }, [userDetails]);

  const renderVerificationSuccessHeader = useCallback(() => {
    return (
      <ModalHeader
        onPressHeader={() => {
          (VerificationSuccessBottomSheet as any).current.snapTo(0);
        }}
      />
    );
  }, []);

  const renderInstructionsModalContent = useCallback(() => {
    return (
      <InstructionsModalContents
        modalRef={InstructionsBottomSheet}
        title={`Instructions and\ndetails for transfer`}
        info={
          'Please proceed to find instructions and\nall necessary details to save bitcoins\n\n'
        }
        subInfo={
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor'
        }
        proceedButtonText={'Help'}
        bulletPoints={[
          'aliqua. Ut faucibus pulvinar elementum',
          'neque volutpat. Leo integer malesuada nunc',
          'Purus faucibus ornare suspendisse sed nisi',
          'Et ligula ullamcorper malesuada proin',
        ]}
        onPressProceed={() => {props.navigation.pop(2)}}
      />
    );
  }, []);

  const renderInstructionsModalHeader = useCallback(() => {
    return (
      <ModalHeader
        onPressHeader={() => {
          (InstructionsBottomSheet as any).current.snapTo(0);
        }}
      />
    );
  }, []);

  const renderConfirmOTPModalContent = useCallback(() => {
    return (
      <OtpModalContents
        isIncorrectOtp={isIncorrectOtp}
        onOtpDone={(otpValue)=>{
          setTimeout(() => {
            setOtp(otpValue);
          }, 2);
        }}
        modalRef={OTPBottomSheet}
        onPressConfirm={()=>{
          OTPBottomSheet.current.snapTo(0);
          VerificationSuccessBottomSheet.current.snapTo(1);
        }}
      />
    );
  }, [isIncorrectOtp, otp]);

  const renderConfirmOTPModalHeader = useCallback(() => {
    return (
      <ModalHeader
        onPressHeader={() => {
          (OTPBottomSheet as any).current.snapTo(0);
        }}
      />
    );
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.backgroundColor1 }}>
      <StatusBar
        backgroundColor={Colors.backgroundColor1}
        barStyle="dark-content"
      />
      <SafeAreaView
        style={{ flex: 0, backgroundColor: Colors.backgroundColor1 }}
      />
      <View style={styles.modalContainer}>
        <View style={styles.modalHeaderTitleView}>
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity
              onPress={() => props.navigation.goBack()}
              style={{ height: 30, width: 30, justifyContent: 'center' }}
            >
              <FontAwesome
                name="long-arrow-left"
                color={Colors.black1}
                size={17}
              />
            </TouchableOpacity>
            <View style={{ flex: 1, marginRight: 10, marginBottom: 10 }}>
              <Text style={styles.modalHeaderTitleText}>{'Get Bittr'}</Text>
              <Text
                style={{
                  ...styles.modalHeaderSmallTitleText,
                  marginBottom: 10,
                }}
              >
                Lorem ipsum dolor sit amet consectetur adipisicing elit.
              </Text>
            </View>
          </View>
        </View>
        <View
          style={{
            flex: 1,
            marginTop: 10,
            marginLeft: 25,
            marginBottom: 20,
            marginRight: 20,
          }}
        >
          <View style={{ ...styles.textBoxView }}>
            <TextInput
              style={{
                ...styles.textBox,
                paddingRight: 10,
                marginTop: 10,
                marginBottom: 10,
              }}
              autoCapitalize="none"
              returnKeyLabel="Done"
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
              keyboardType={
                Platform.OS == 'ios' ? 'ascii-capable' : 'visible-password'
              }
              placeholder={'Enter email address'}
              value={emailAddress}
              onChangeText={value => {
                setEmailAddress(value);
              }}
              placeholderTextColor={Colors.borderColor}
            />
          </View>
          {!isEmailValid ? (
            <View style={{ marginLeft: 'auto' }}>
              <Text style={styles.errorText}>Enter valid email address</Text>
            </View>
          ) : null}
          <View style={{ ...styles.textBoxView }}>
            <TextInput
              style={{
                ...styles.textBox,
                paddingRight: 20,
                marginTop: 10,
                marginBottom: 10,
              }}
              autoCapitalize="none"
              returnKeyLabel="Done"
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
              keyboardType={'numeric'}
              placeholder={'Enter phone number'}
              value={mobileNumber}
              onChangeText={value => {
                setMobileNumber(value);
              }}
              placeholderTextColor={Colors.borderColor}
            />
          </View>
        </View>
      </View>
      <View style={{ marginTop: 'auto', marginBottom: hp('4%') }}>
        <BottomInfoBox
          backgroundColor={Colors.white}
          titleColor={Colors.black1}
          title={'Note'}
          infoText={
            'Lorem ipsum dolor sit amet consectetur adipisicing elit Lorem ipsum dolor'
          }
        />

        <View
          style={{
            alignItems: 'center',
            flexDirection: 'row',
            marginLeft: wp('8%'),
          }}
        >
          <TouchableOpacity
            onPress={async () => {
              if (validateEmail(emailAddress)) {
                setTimeout(() => {
                  setIsEmailValid(true);
                  setButtonDisable(true);
                }, 2);
                await AsyncStorage.setItem('emailAddress', emailAddress);
                await AsyncStorage.setItem('MobileNo', mobileNumber);
                let formData = {
                  email: emailAddress,
                  language: 'en',
                  bitcoin_address: bitcoinAddress,
                  category: 'hexa',
                };

                dispatch(sendEmailRequest(formData));
              } else {
                setTimeout(() => {
                  setIsEmailValid(false);
                  setButtonDisable(false);
                }, 2);
              }
            }}
            disabled={buttonDisable}
            style={{
              height: wp('13%'),
              width: wp('40%'),
              backgroundColor: Colors.yellow,
              justifyContent: 'center',
              alignItems: 'center',
              borderRadius: 8,
              elevation: 10,
              shadowColor: Colors.shadowYellow,
              shadowOpacity: 1,
              shadowOffset: { width: 15, height: 15 },
            }}
          >
            {loading ? <ActivityIndicator size="small" /> : <Text>SignUp</Text>}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              props.navigation.goBack();
            }}
            style={{
              width: wp('20%'),
              height: wp('13%'),
              justifyContent: 'center',
              alignItems: 'center',
              marginLeft: 10,
            }}
          >
            <Text>Back</Text>
          </TouchableOpacity>
        </View>
      </View>
      <BottomSheet
        enabledInnerScrolling={true}
        ref={ErrorBottomSheet}
        snapPoints={[
          -50,
          Platform.OS == 'ios' && DeviceInfo.hasNotch() ? hp('40%') : hp('45%'),
        ]}
        renderContent={renderErrorModalContent}
        renderHeader={renderErrorModalHeader}
      />

      <BottomSheet
        enabledInnerScrolling={true}
        ref={SmsErrorBottomSheet}
        snapPoints={[
          -50,
          Platform.OS == 'ios' && DeviceInfo.hasNotch() ? hp('30%') : hp('35%'),
        ]}
        renderContent={renderSmsErrorModalContent}
        renderHeader={renderSmsErrorModalHeader}
      />

      <BottomSheet
        enabledInnerScrolling={true}
        ref={ErrorBottomSheet}
        snapPoints={[
          -50,
          Platform.OS == 'ios' && DeviceInfo.hasNotch() ? hp('45%') : hp('50%'),
        ]}
        renderContent={renderErrorModalContent}
        renderHeader={renderErrorModalHeader}
      />
      <BottomSheet
        enabledInnerScrolling={true}
        ref={VerificationSuccessBottomSheet}
        snapPoints={[
          -50,
          Platform.OS == 'ios' && DeviceInfo.hasNotch() ? hp('35%') : hp('45%'),
        ]}
        renderContent={renderVerificationSuccessContent}
        renderHeader={renderVerificationSuccessHeader}
      />
      <BottomSheet
        enabledInnerScrolling={true}
        ref={InstructionsBottomSheet}
        snapPoints={[
          -50,
          Platform.OS == 'ios' && DeviceInfo.hasNotch() ? hp('55%') : hp('60%'),
        ]}
        renderContent={renderInstructionsModalContent}
        renderHeader={renderInstructionsModalHeader}
      />
      <BottomSheet
        enabledInnerScrolling={true}
        ref={OTPBottomSheet}
        snapPoints={[
          -50,
          Platform.OS == 'ios' && DeviceInfo.hasNotch() ? hp('50%') : hp('55%'),
          Platform.OS == 'ios' && DeviceInfo.hasNotch() ? hp('75%') : hp('80%'),
        ]}
        renderContent={renderConfirmOTPModalContent}
        renderHeader={renderConfirmOTPModalHeader}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  modalHeaderTitleView: {
    borderBottomWidth: 1,
    borderColor: Colors.borderColor,
    alignItems: 'center',
    flexDirection: 'row',
    marginLeft: 10,
    marginRight: 10,
    marginBottom: 10,
    marginTop: hp('5%'),
  },
  modalHeaderTitleText: {
    color: Colors.black1,
    fontSize: RFValue(18),
    fontFamily: Fonts.FiraSansRegular,
  },
  textBox: {
    flex: 1,
    paddingLeft: 20,
    color: Colors.textColorGrey,
    fontFamily: Fonts.FiraSansMedium,
    fontSize: RFValue(13),
  },
  textBoxView: {
    flexDirection: 'row',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    height: 50,
    marginTop: hp('1%'),
    marginBottom: hp('1%'),
  },
  modalContainer: {
    height: '100%',
    backgroundColor: Colors.backgroundColor1,
    width: '100%',
  },
  modalHeaderSmallTitleText: {
    color: Colors.textColorGrey,
    fontSize: RFValue(13),
    fontFamily: Fonts.FiraSansRegular,
  },
  errorText: {
    fontFamily: Fonts.FiraSansMediumItalic,
    color: Colors.red,
    fontSize: RFValue(11),
    fontStyle: 'italic',
  },
});
