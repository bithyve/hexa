import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  View,
  Image,
  TouchableOpacity,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  SafeAreaView,
  StatusBar,
  AsyncStorage,
  ImageBackground,
  FlatList,
  CheckBox,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { RFValue } from 'react-native-responsive-fontsize';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import Colors from '../../common/Colors';
import Fonts from '../../common/Fonts';
import BottomSheet from 'reanimated-bottom-sheet';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import BottomInfoBox from '../../components/BottomInfoBox';
import ModalHeader from '../../components/ModalHeader';
import AddContactAddressBook from '../Contacts/AddContactAddressBook';
import SmallHeaderModal from '../../components/SmallHeaderModal';
import DeviceInfo from 'react-native-device-info';
import { nameToInitials } from '../../common/CommonFunctions';
import { AppBottomSheetTouchableWrapper } from '../../components/AppBottomSheetTouchableWrapper';
import SendViaQR from '../../components/SendViaQR';
import SendViaLink from '../../components/SendViaLink';
import Entypo from 'react-native-vector-icons/Entypo';
import {
  TEST_ACCOUNT,
  SECURE_ACCOUNT,
  REGULAR_ACCOUNT,
} from '../../common/constants/serviceTypes';
import BackupStyles from '../ManageBackup/Styles';
import TestAccountHelperModalContents from '../../components/Helper/TestAccountHelperModalContents';
import BitcoinAddressSendSuccess from '../../components/BitcoinAddressSendSuccess';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { fetchAddress } from '../../store/actions/accounts';
import { updateEphemeralChannel } from '../../store/actions/trustedContacts';
import { EphemeralData } from '../../bitcoin/utilities/Interface';
import TrustedContactsService from '../../bitcoin/services/TrustedContactsService';
import config from '../../bitcoin/HexaConfig';

export default function Receive(props) {
  const [
    BitcoinAddressSendSuccessBottomSheet,
    setBitcoinAddressSendSuccessBottomSheet,
  ] = useState(React.createRef());
  const [
    SecureReceiveWarningBottomSheet,
    setSecureReceiveWarningBottomSheet,
  ] = useState(React.createRef());
  const [ReceiveHelperBottomSheet, setReceiveHelperBottomSheet] = useState(
    React.createRef(),
  );
  const [
    AddContactAddressBookBookBottomSheet,
    setAddContactAddressBookBottomSheet,
  ] = useState(React.createRef());
  const [amount, setAmount] = useState('');
  const [showContacts, setShowContacts] = useState(false);
  const [LoadContacts, setLoadContacts] = useState(false);
  const [selectedContact, setSelectedContact] = useState(Object);
  const [AsTrustedContact, setAsTrustedContact] = useState(false);
  const [isReceiveHelperDone, setIsReceiveHelperDone] = useState(true);
  const [serviceType, setServiceType] = useState(
    props.navigation.getParam('serviceType')
      ? props.navigation.getParam('serviceType')
      : '',
  );
  const [dropdownBoxOpenClose, setDropdownBoxOpenClose] = useState(false);

  const [SendViaLinkBottomSheet, setSendViaLinkBottomSheet] = useState(
    React.createRef(),
  );

  const [SendViaQRBottomSheet, setSendViaQRBottomSheet] = useState(
    React.createRef(),
  );
  const getServiceType = props.navigation.state.params.getServiceType
    ? props.navigation.state.params.getServiceType
    : null;
  function isEmpty(obj) {
    return Object.keys(obj).every((k) => !Object.keys(obj[k]).length);
  }

  const [dropdownBoxList, setDropdownBoxList] = useState([
    {
      id: '1',
      account_name: 'Test Account',
      type: TEST_ACCOUNT,
    },
    {
      id: '2',
      account_name: 'Checking Account',
      type: REGULAR_ACCOUNT,
    },
    {
      id: '3',
      account_name: 'Saving Account',
      type: SECURE_ACCOUNT,
    },
  ]);

  const dispatch = useDispatch();
  const [receiveLink, setReceiveLink] = useState('');
  const [receiveQR, setReceiveQR] = useState('');
  const { loading, service } = useSelector(
    (state) => state.accounts[serviceType],
  );

  const WALLET_SETUP = useSelector(
    (state) => state.storage.database.WALLET_SETUP,
  );
  const trustedContacts: TrustedContactsService = useSelector(
    (state) => state.trustedContacts.service,
  );

  useEffect(() => {
    if (!AsTrustedContact) {
      const { receivingAddress } =
        serviceType === SECURE_ACCOUNT
          ? service.secureHDWallet
          : service.hdWallet;

      if (receivingAddress) {
        let receiveAt = receivingAddress;
        if (amount) {
          receiveAt = service.getPaymentURI(receiveAt, {
            amount: parseInt(amount),
          }).paymentURI;
        }
        setReceiveLink(receiveAt);
        setReceiveQR(receiveAt);
      }
    }
  }, [service, amount, AsTrustedContact]);

  useEffect(() => {
    if (AsTrustedContact) {
      setTimeout(() => {
        setReceiveLink('');
        setReceiveQR('');
      }, 200);
      (AddContactAddressBookBookBottomSheet as any).current.snapTo(1);
    }
  }, [AsTrustedContact]);

  useEffect(() => {
    dispatch(fetchAddress(serviceType));
  }, []);

  useEffect(() => {
    if (!AsTrustedContact) return;
    if (!selectedContact || !selectedContact.firstName) {
      console.log('Err: Contact missing');
      return;
    }

    const contactName = `${selectedContact.firstName} ${
      selectedContact.lastName ? selectedContact.lastName : ''
    }`.toLowerCase();
    const trustedContact = trustedContacts.tc.trustedContacts[contactName];

    if (trustedContact) {
      const publicKey =
        trustedContacts.tc.trustedContacts[contactName].publicKey;
      const requester = WALLET_SETUP.walletName;

      if (!receiveLink) {
        if (
          selectedContact.phoneNumbers &&
          selectedContact.phoneNumbers.length
        ) {
          const phoneNumber = selectedContact.phoneNumbers[0].number;
          console.log({ phoneNumber });
          const number = phoneNumber.replace(/[^0-9]/g, ''); // removing non-numeric characters
          const numHintType = 'num';
          const numHint = number.slice(number.length - 3);
          const numberEncPubKey = TrustedContactsService.encryptPub(
            publicKey,
            number,
          ).encryptedPub;
          const numberDL =
            `https://hexawallet.io/${config.APP_STAGE}/ptc` +
            `/${requester}` +
            `/${numberEncPubKey}` +
            `/${numHintType}` +
            `/${numHint}`;
          console.log({ numberDL });
          setReceiveLink(numberDL);
        } else if (selectedContact.emails && selectedContact.emails.length) {
          const email = selectedContact.emails[0].email;
          const emailInitials: string = email.split('@')[0];
          const emailHintType = 'eml';
          const emailHint = emailInitials.slice(emailInitials.length - 3);
          const emailEncPubKey = TrustedContactsService.encryptPub(
            publicKey,
            emailInitials,
          ).encryptedPub;
          const emailDL =
            `https://hexawallet.io/${config.APP_STAGE}/ptc` +
            `/${requester}` +
            `/${emailEncPubKey}` +
            `/${emailHintType}` +
            `/${emailHint}`;
          console.log({ emailDL });
          setReceiveLink(emailDL);
        } else {
          Alert.alert(
            'Invalid Contact',
            'Cannot add a contact without phone-num/email as a trusted entity',
          );
          return;
        }
        updateTrustedContactsInfo(selectedContact); // Contact initialized to become TC
      }

      if (!receiveQR) {
        setReceiveQR(
          JSON.stringify({
            requester: WALLET_SETUP.walletName,
            publicKey,
            type: 'paymentTrustedContactQR',
          }),
        );
      }
    }
  }, [
    selectedContact,
    trustedContacts,
    AsTrustedContact,
    receiveLink,
    receiveQR,
  ]);

  const updateTrustedContactsInfo = async (contact) => {
    let trustedContactsInfo: any = await AsyncStorage.getItem(
      'TrustedContactsInfo',
    );
    console.log({ trustedContactsInfo });

    if (trustedContactsInfo) {
      trustedContactsInfo = JSON.parse(trustedContactsInfo);
      if (
        trustedContactsInfo.findIndex((value) => {
          if (value && value.id) return value.id == contact.id;
        }) == -1
      ) {
        trustedContactsInfo.push(contact);
        // Toast('Trusted Contact added successfully');
      } else {
        // Toast('Trusted Contact already exists');
      }
    } else {
      trustedContactsInfo = [];
      trustedContactsInfo[3] = contact; // initial 3 reserved for Guardians
    }
    console.log({ trustedContactsInfo });
    await AsyncStorage.setItem(
      'TrustedContactsInfo',
      JSON.stringify(trustedContactsInfo),
    );
  };

  const createTrustedContact = useCallback(() => {
    if (!AsTrustedContact) return;

    if (selectedContact && selectedContact.firstName) {
      const contactName = `${selectedContact.firstName} ${
        selectedContact.lastName ? selectedContact.lastName : ''
      }`.toLowerCase();
      const trustedContact = trustedContacts.tc.trustedContacts[contactName];

      const { receivingAddress } =
        serviceType === SECURE_ACCOUNT
          ? service.secureHDWallet
          : service.hdWallet;

      let paymentURI;
      if (amount) {
        paymentURI = service.getPaymentURI(receivingAddress, {
          amount: parseInt(amount),
        }).paymentURI;
      }

      if (!trustedContact) {
        (async () => {
          const walletID = await AsyncStorage.getItem('walletID');
          const FCM = await AsyncStorage.getItem('fcmToken');

          const data: EphemeralData = {
            walletID,
            FCM,
            paymentDetails: {
              address: receivingAddress,
              paymentURI,
            },
          };
          dispatch(updateEphemeralChannel(contactName, data));
        })();
      } else if (
        !trustedContact.symmetricKey &&
        trustedContact.ephemeralChannel
      ) {
        if (
          trustedContact.ephemeralChannel.data[0].paymentDetails &&
          trustedContact.ephemeralChannel.data[0].paymentDetails.address ===
            receivingAddress &&
          trustedContact.ephemeralChannel.data[0].paymentDetails.paymentURI ===
            paymentURI
        )
          return;
        const data: EphemeralData = {
          paymentDetails: {
            address: receivingAddress,
            paymentURI,
          },
        };
        dispatch(updateEphemeralChannel(contactName, data));
      }
    }
  }, [
    selectedContact,
    trustedContacts,
    AsTrustedContact,
    amount,
    serviceType,
    service,
  ]);

  const checkNShowHelperModal = async () => {
    let isReceiveHelperDone1 = await AsyncStorage.getItem(
      'isReceiveHelperDone',
    );
    // console.log(
    //   'isReceiveHelperDone1',
    //   isReceiveHelperDone,
    //   isReceiveHelperDone1,
    // );
    if (!isReceiveHelperDone1 && serviceType == TEST_ACCOUNT) {
      await AsyncStorage.setItem('isReceiveHelperDone', 'true');
      setTimeout(() => {
        setIsReceiveHelperDone(true);
      }, 10);
      setTimeout(() => {
        if (ReceiveHelperBottomSheet.current)
          (ReceiveHelperBottomSheet as any).current.snapTo(1);
      }, 1000);
    } else {
      setTimeout(() => {
        setIsReceiveHelperDone(false);
      }, 10);
    }
  };

  useEffect(() => {
    checkNShowHelperModal();
    (async () => {
      if (serviceType === SECURE_ACCOUNT) {
        if (!(await AsyncStorage.getItem('savingsWarning'))) {
          // TODO: integrate w/ any of the PDF's health (if it's good then we don't require the warning modal)
          if (SecureReceiveWarningBottomSheet.current)
            (SecureReceiveWarningBottomSheet as any).current.snapTo(1);
          await AsyncStorage.setItem('savingsWarning', 'true');
        }
      }
    })();
  }, []);

  const renderAddContactAddressBookHeader = () => {
    return (
      <SmallHeaderModal
        borderColor={Colors.white}
        backgroundColor={Colors.white}
        onPressHeader={() => {
          (AddContactAddressBookBookBottomSheet as any).current.snapTo(0);
        }}
      />
    );
  };

  const renderAddContactAddressBookContents = () => {
    return (
      <AddContactAddressBook
        modalTitle="Select a Contact"
        modalRef={AddContactAddressBookBookBottomSheet}
        proceedButtonText={'Confirm & Proceed'}
        onPressContinue={(selectedContacts) => {
          setTimeout(() => {
            setSelectedContact(selectedContacts[0]);
          }, 2);
          (AddContactAddressBookBookBottomSheet as any).current.snapTo(0);
        }}
        onPressBack={() => {
          (AddContactAddressBookBookBottomSheet as any).current.snapTo(0);
        }}
      />
    );
  };

  const renderSendViaLinkContents = useCallback(() => {
    return (
      <SendViaLink
      headerText={'Recieve via Link'}
        contactText={'Adding to Friends and Family:'}
        amountCurrency={serviceType == TEST_ACCOUNT ? 't-sats' : 'sats'}
        contact={!isEmpty(selectedContact) ? selectedContact : null}
        info={'Send the link below with your contact. It will share your bitcoins address and a way for the person to accept your request.'}
        amount={amount === '' ? null : amount}
        link={receiveLink}
        serviceType={serviceType}
        onPressBack={() => {
          if (SendViaLinkBottomSheet.current)
            (SendViaLinkBottomSheet as any).current.snapTo(0);
        }}
        onPressDone={() => {
          (SendViaLinkBottomSheet as any).current.snapTo(0);
        }}
      />
    );
  }, [selectedContact, receiveLink, amount, serviceType]);

  const renderSendViaLinkHeader = useCallback(() => {
    return (
      <ModalHeader
        onPressHeader={() => {
          if (SendViaLinkBottomSheet.current)
            (SendViaLinkBottomSheet as any).current.snapTo(0);
        }}
      />
    );
  }, []);

  const renderSendViaQRContents = useCallback(() => {
    //console.log(amount);
    return (
      <SendViaQR
        headerText={'Recieve via QR'}
        contactText={'Adding to Friends and Family:'}
        contact={!isEmpty(selectedContact) ? selectedContact : null}
        amount={amount === '' ? null : amount}
        QR={receiveQR}
        serviceType={serviceType}
        amountCurrency={serviceType == TEST_ACCOUNT ? 't-sats' : 'sats'}
        contactEmail={''}
        onPressBack={() => {
          if (SendViaQRBottomSheet.current)
            (SendViaQRBottomSheet as any).current.snapTo(0);
        }}
        onPressDone={() => {
          (SendViaQRBottomSheet as any).current.snapTo(0);
        }}
      />
    );
  }, [selectedContact, receiveQR, amount, serviceType]);

  const renderSendViaQRHeader = useCallback(() => {
    return (
      <ModalHeader
        onPressHeader={() => {
          if (SendViaQRBottomSheet.current)
            (SendViaQRBottomSheet as any).current.snapTo(0);
        }}
      />
    );
  }, []);

  const renderBitcoinAddressSendSuccessContents = useCallback(() => {
    return (
      <BitcoinAddressSendSuccess
        contact={!isEmpty(selectedContact) ? selectedContact : null}
        onPressSkip={() => {
          if (BitcoinAddressSendSuccessBottomSheet.current)
            (BitcoinAddressSendSuccessBottomSheet as any).current.snapTo(0);
        }}
        onPressAssociateContacts={() => {
          if (BitcoinAddressSendSuccessBottomSheet.current)
            (BitcoinAddressSendSuccessBottomSheet as any).current.snapTo(0);
        }}
      />
    );
  }, [selectedContact]);

  const renderBitcoinAddressSendSuccessHeader = useCallback(() => {
    return (
      <ModalHeader
        onPressHeader={() => {
          if (BitcoinAddressSendSuccessBottomSheet.current)
            (BitcoinAddressSendSuccessBottomSheet as any).current.snapTo(0);
        }}
      />
    );
  }, []);

  const renderReceiveHelperContents = useCallback(() => {
    return (
      <TestAccountHelperModalContents
        topButtonText={'Receiving Bitcoins'}
        image={require('../../assets/images/icons/receive.png')}
        helperInfo={
          'For receiving bitcoins, you need to give an address to the sender. Mostly in form of a QR code. This is pretty much like an email address but your app generates a new one for you every time you want to do a transaction\n\nThe sender will scan this address or copy a long sequence of letters and numbers to send you the bitcoins or sats (a very small fraction of a bitcoin)\n\nNote that if you want to receive bitcoins/ sats from “Friends and Family”, the app does all this for you and you don’t need to send a new address every time'
        }
        continueButtonText={'Ok, got it'}
        onPressContinue={() => {
          if (props.navigation.getParam('serviceType') == TEST_ACCOUNT) {
            if (ReceiveHelperBottomSheet.current)
              (ReceiveHelperBottomSheet as any).current.snapTo(0);
            props.navigation.navigate('ReceivingAddress', {
              serviceType,
              getServiceType,
            });
          }
        }}
      />
    );
  }, [serviceType]);

  const renderReceiveHelperHeader = () => {
    return (
      <SmallHeaderModal
        borderColor={Colors.blue}
        backgroundColor={Colors.blue}
        onPressHeader={() => {
          //console.log('isReceiveHelperDone', isReceiveHelperDone);
          if (isReceiveHelperDone) {
            if (ReceiveHelperBottomSheet.current)
              (ReceiveHelperBottomSheet as any).current.snapTo(1);
            setTimeout(() => {
              setIsReceiveHelperDone(false);
            }, 10);
          } else {
            if (ReceiveHelperBottomSheet.current)
              (ReceiveHelperBottomSheet as any).current.snapTo(0);
          }
        }}
      />
    );
  };

  const renderSecureReceiveWarningContents = useCallback(() => {
    return (
      <View style={styles.modalContainer}>
        <ScrollView>
          <View
            style={{
              height: '100%',
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: hp('2%'),
            }}
          >
            <BottomInfoBox
              title={'Note'}
              infoText={
                "Please ensure that you have 2FA setted up (preferably on your keeper device), you'll require the 2FA token in order to send bitcoins from the savings account."
              }
            />

            <View
              style={{
                paddingLeft: 20,
                paddingRight: 20,
                flexDirection: 'row',
                marginTop: hp('1%'),
                marginBottom: hp('1%'),
              }}
            >
              <AppBottomSheetTouchableWrapper
                onPress={() => {
                  if (SecureReceiveWarningBottomSheet.current)
                    (SecureReceiveWarningBottomSheet as any).current.snapTo(0);
                }}
                style={{
                  ...styles.confirmButtonView,
                  backgroundColor: Colors.blue,
                  elevation: 10,
                  shadowColor: Colors.shadowBlue,
                  shadowOpacity: 1,
                  marginRight: 5,
                  shadowOffset: { width: 15, height: 15 },
                }}
              >
                <Text
                  style={{
                    color: Colors.white,
                    fontSize: RFValue(13),
                    fontFamily: Fonts.FiraSansRegular,
                  }}
                >
                  Ok, I understand
                </Text>
              </AppBottomSheetTouchableWrapper>
              <AppBottomSheetTouchableWrapper
                onPress={() => props.navigation.replace('ManageBackup')}
                style={{
                  ...styles.confirmButtonView,
                  width: wp('30%'),
                  marginLeft: 5,
                }}
              >
                <Text
                  style={{
                    color: Colors.blue,
                    fontSize: RFValue(13),
                    fontFamily: Fonts.FiraSansRegular,
                  }}
                >
                  Manage Backup
                </Text>
              </AppBottomSheetTouchableWrapper>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }, [serviceType]);

  const renderSecureReceiveWarningHeader = useCallback(() => {
    return (
      <SmallHeaderModal
        borderColor={Colors.borderColor}
        backgroundColor={Colors.white}
        onPressHeader={() => {
          if (SecureReceiveWarningBottomSheet.current)
            (SecureReceiveWarningBottomSheet as any).current.snapTo(0);
        }}
      />
    );
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 0 }} />
      <StatusBar backgroundColor={Colors.white} barStyle="dark-content" />
      <TouchableWithoutFeedback
        onPress={() => {
          if (ReceiveHelperBottomSheet.current)
            (ReceiveHelperBottomSheet as any).current.snapTo(0);
        }}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS == 'ios' ? 'padding' : ''}
          enabled
        >
          <View style={BackupStyles.modalContainer}>
            <View style={BackupStyles.modalHeaderTitleView}>
              <View
                style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
              >
                <TouchableOpacity
                  onPress={() => {
                    if (getServiceType) {
                      getServiceType(serviceType);
                    }
                    props.navigation.goBack();
                  }}
                  style={{ height: 30, width: 30, justifyContent: 'center' }}
                >
                  <FontAwesome
                    name="long-arrow-left"
                    color={Colors.blue}
                    size={17}
                  />
                </TouchableOpacity>
                <Text style={BackupStyles.modalHeaderTitleText}>
                  Receiving Address
                </Text>
                {serviceType == TEST_ACCOUNT ? (
                  <Text
                    onPress={() => {
                      AsyncStorage.setItem('isReceiveHelperDone', 'true');
                      if (ReceiveHelperBottomSheet.current)
                        (ReceiveHelperBottomSheet as any).current.snapTo(1);
                    }}
                    style={{
                      color: Colors.textColorGrey,
                      fontSize: RFValue(12),
                      marginLeft: 'auto',
                    }}
                  >
                    Know more
                  </Text>
                ) : null}
              </View>
            </View>
            <ScrollView>
              <View style={{ flex: 1, paddingLeft: 20, paddingRight: 20 }}>
                <View style={styles.textBoxView}>
                  <View style={styles.amountInputImage}>
                    <Image
                      style={styles.textBoxImage}
                      source={require('../../assets/images/icons/icon_bitcoin_gray.png')}
                    />
                  </View>
                  <TextInput
                    style={{ ...styles.textBox, paddingLeft: 10 }}
                    placeholder={'Enter Amount in sats'}
                    value={amount}
                    returnKeyLabel="Done"
                    returnKeyType="done"
                    keyboardType={'numeric'}
                    onChangeText={(value) => setAmount(value)}
                    placeholderTextColor={Colors.borderColor}
                  />
                </View>

                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    paddingLeft: 20,
                    paddingRight: 20,
                    marginTop: 30,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                  activeOpacity={10}
                  onPress={() => {
                    setDropdownBoxOpenClose(!dropdownBoxOpenClose);
                  }}
                >
                  <Text
                    style={{
                      color: Colors.textColorGrey,
                      fontSize: RFValue(12),
                      fontFamily: Fonts.FiraSansRegular,
                      textAlign: 'center',
                    }}
                  >
                    Receiving To:
                    <Text style={styles.boldItalicText}>
                      {serviceType == TEST_ACCOUNT
                        ? '  Test Account'
                        : serviceType == REGULAR_ACCOUNT
                        ? '  Checking Account'
                        : '  Saving Account'}
                    </Text>
                  </Text>
                  <Ionicons
                    style={{ marginRight: 10, marginLeft: 10 }}
                    name={
                      dropdownBoxOpenClose ? 'ios-arrow-up' : 'ios-arrow-down'
                    }
                    size={20}
                    color={Colors.blue}
                  />
                </TouchableOpacity>
                <View style={{ position: 'relative' }}>
                  {dropdownBoxOpenClose && (
                    <View style={styles.dropdownBoxModal}>
                      <ScrollView>
                        {dropdownBoxList.map((value, index) => (
                          <TouchableOpacity
                            onPress={() => {
                              setTimeout(() => {
                                console.log('setServiceType', value.type);
                                setServiceType(value.type);
                                setDropdownBoxOpenClose(false);
                              }, 2);
                            }}
                            style={{
                              ...styles.dropdownBoxModalElementView,
                              backgroundColor:
                                serviceType == value.type
                                  ? Colors.lightBlue
                                  : Colors.white,
                            }}
                          >
                            <Text
                              style={{
                                color:
                                  serviceType == value.type
                                    ? Colors.blue
                                    : Colors.black,
                                fontFamily: Fonts.FiraSansRegular,
                                fontSize: RFValue(12),
                              }}
                            >
                              {value.account_name}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}

                  <TouchableOpacity
                    activeOpacity={10}
                    onPress={() => {
                      setAsTrustedContact(!AsTrustedContact);
                    }}
                    style={{
                      flexDirection: 'row',
                      borderRadius: 8,
                      backgroundColor: Colors.backgroundColor1,
                      alignItems: 'center',
                      paddingLeft: 20,
                      paddingRight: 20,
                      marginTop: 30,
                      height: wp('13%'),
                    }}
                  >
                    <Text
                      style={{
                        color: Colors.textColorGrey,
                        fontSize: RFValue(12),
                        fontFamily: Fonts.FiraSansRegular,
                      }}
                    >
                      Add sender as Trusted Contact
                    </Text>
                    <View
                      style={{
                        width: wp('7%'),
                        height: wp('7%'),
                        borderRadius: 7,
                        backgroundColor: Colors.white,
                        borderColor: Colors.borderColor,
                        borderWidth: 1,
                        marginLeft: 'auto',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {AsTrustedContact && (
                        <Entypo
                          name="check"
                          size={RFValue(17)}
                          color={Colors.green}
                        />
                      )}
                    </View>
                  </TouchableOpacity>
                  {!isEmpty(selectedContact) && (
                    <View style={styles.contactProfileView}>
                      <View
                        style={{ flexDirection: 'row', alignItems: 'center' }}
                      >
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            flex: 1,
                            backgroundColor: Colors.backgroundColor1,
                            height: 90,
                            borderRadius: 10,
                          }}
                        >
                          {selectedContact && selectedContact.imageAvailable ? (
                            <View
                              style={{
                                marginLeft: 15,
                                marginRight: 15,
                                alignItems: 'center',
                                justifyContent: 'center',
                                shadowOpacity: 1,
                                shadowOffset: { width: 2, height: 2 },
                              }}
                            >
                              <Image
                                source={
                                  selectedContact && selectedContact.image
                                }
                                style={{ ...styles.contactProfileImage }}
                              />
                            </View>
                          ) : (
                            <View
                              style={{
                                marginLeft: 15,
                                marginRight: 15,
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: Colors.backgroundColor,
                                width: 70,
                                height: 70,
                                borderRadius: 70 / 2,
                                shadowColor: Colors.shadowBlue,
                                shadowOpacity: 1,
                                shadowOffset: { width: 2, height: 2 },
                              }}
                            >
                              <Text
                                style={{
                                  textAlign: 'center',
                                  fontSize: RFValue(20),
                                  lineHeight: RFValue(20), //... One for top and one for bottom alignment
                                }}
                              >
                                {nameToInitials(
                                  selectedContact &&
                                    selectedContact.firstName &&
                                    selectedContact.lastName
                                    ? selectedContact.firstName +
                                        ' ' +
                                        selectedContact.lastName
                                    : selectedContact &&
                                      selectedContact.firstName &&
                                      !selectedContact.lastName
                                    ? selectedContact.firstName
                                    : selectedContact &&
                                      !selectedContact.firstName &&
                                      selectedContact.lastName
                                    ? selectedContact.lastName
                                    : '',
                                )}
                              </Text>
                            </View>
                          )}
                          <View>
                            <Text
                              style={{
                                color: Colors.textColorGrey,
                                fontFamily: Fonts.FiraSansRegular,
                                fontSize: RFValue(11),
                                marginLeft: 5,
                                paddingTop: 5,
                                paddingBottom: 3,
                              }}
                            >
                              Adding as a Trusted Contact:
                            </Text>
                            <Text style={styles.contactNameText}>
                              {selectedContact &&
                              selectedContact.firstName &&
                              selectedContact.lastName
                                ? selectedContact.firstName +
                                  ' ' +
                                  selectedContact.lastName
                                : selectedContact &&
                                  selectedContact.firstName &&
                                  !selectedContact.lastName
                                ? selectedContact.firstName
                                : selectedContact &&
                                  !selectedContact.firstName &&
                                  selectedContact.lastName
                                ? selectedContact.lastName
                                : ''}
                            </Text>
                            {selectedContact &&
                            selectedContact.phoneNumbers &&
                            selectedContact.phoneNumbers.length ? (
                              <Text
                                style={{
                                  color: Colors.textColorGrey,
                                  fontFamily: Fonts.FiraSansRegular,
                                  fontSize: RFValue(10),
                                  marginLeft: 5,
                                  paddingTop: 3,
                                }}
                              >
                                {selectedContact.phoneNumbers[0].digits}
                              </Text>
                            ) : selectedContact &&
                              selectedContact.emails &&
                              selectedContact.emails.length ? (
                              <Text
                                style={{
                                  color: Colors.textColorGrey,
                                  fontFamily: Fonts.FiraSansRegular,
                                  fontSize: RFValue(10),
                                  marginLeft: 5,
                                  paddingTop: 3,
                                  paddingBottom: 5,
                                }}
                              >
                                {selectedContact &&
                                  selectedContact.emails[0].email}
                              </Text>
                            ) : null}
                          </View>
                        </View>
                      </View>
                    </View>
                  )}
                </View>
              </View>
            </ScrollView>
            <View
              style={{
                marginTop: 'auto',
                marginBottom: hp('3%'),
                paddingTop: 10,
              }}
            >
              <View style={{ marginBottom: hp('1%') }}>
                <BottomInfoBox
                  backgroundColor={Colors.backgroundColor1}
                  title={'Note'}
                  infoText={
                    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna'
                  }
                />
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  backgroundColor: Colors.blue,
                  height: 60,
                  borderRadius: 10,
                  marginLeft: 25,
                  marginRight: 25,
                  justifyContent: 'space-evenly',
                  alignItems: 'center',
                  shadowColor: Colors.shadowBlue,
                  shadowOpacity: 1,
                  shadowOffset: { width: 15, height: 15 },
                }}
              >
                <AppBottomSheetTouchableWrapper
                  onPress={() => {
                    if (AsTrustedContact) {
                      createTrustedContact();
                    }
                    if (SendViaLinkBottomSheet.current)
                      (SendViaLinkBottomSheet as any).current.snapTo(1);
                  }}
                  style={styles.buttonInnerView}
                >
                  <Image
                    source={require('../../assets/images/icons/openlink.png')}
                    style={styles.buttonImage}
                  />
                  <Text style={styles.buttonText}>Via Link</Text>
                </AppBottomSheetTouchableWrapper>
                <View
                  style={{
                    width: 1,
                    height: 30,
                    backgroundColor: Colors.white,
                  }}
                />
                <AppBottomSheetTouchableWrapper
                  style={styles.buttonInnerView}
                  onPress={() => {
                    if (AsTrustedContact) {
                      createTrustedContact();
                    }
                    if (SendViaQRBottomSheet.current)
                      (SendViaQRBottomSheet as any).current.snapTo(1);
                  }}
                >
                  <Image
                    source={require('../../assets/images/icons/qr-code.png')}
                    style={styles.buttonImage}
                  />
                  <Text style={styles.buttonText}>Via QR</Text>
                </AppBottomSheetTouchableWrapper>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
      <BottomSheet
        enabledInnerScrolling={true}
        ref={ReceiveHelperBottomSheet as any}
        snapPoints={[
          -50,
          Platform.OS == 'ios' && DeviceInfo.hasNotch() ? hp('37%') : hp('42%'),
        ]}
        renderContent={renderReceiveHelperContents}
        renderHeader={renderReceiveHelperHeader}
      />
      <BottomSheet
        enabledInnerScrolling={true}
        ref={AddContactAddressBookBookBottomSheet as any}
        snapPoints={[
          -50,
          Platform.OS == 'ios' && DeviceInfo.hasNotch() ? hp('82%') : hp('82%'),
        ]}
        renderContent={renderAddContactAddressBookContents}
        renderHeader={renderAddContactAddressBookHeader}
      />
      <BottomSheet
        enabledInnerScrolling={true}
        ref={SendViaLinkBottomSheet as any}
        snapPoints={[
          -50,
          Platform.OS == 'ios' && DeviceInfo.hasNotch() ? hp('83%') : hp('85%'),
        ]}
        renderContent={renderSendViaLinkContents}
        renderHeader={renderSendViaLinkHeader}
      />
      <BottomSheet
        enabledInnerScrolling={true}
        ref={SendViaQRBottomSheet as any}
        snapPoints={[
          -50,
          Platform.OS == 'ios' && DeviceInfo.hasNotch() ? hp('83%') : hp('85%'),
        ]}
        renderContent={renderSendViaQRContents}
        renderHeader={renderSendViaQRHeader}
      />
      <BottomSheet
        enabledInnerScrolling={true}
        ref={SecureReceiveWarningBottomSheet as any}
        snapPoints={[
          -50,
          Platform.OS == 'ios' && DeviceInfo.hasNotch() ? hp('35%') : hp('40%'),
        ]}
        renderContent={renderSecureReceiveWarningContents}
        renderHeader={renderSecureReceiveWarningHeader}
      />
      <BottomSheet
        enabledInnerScrolling={true}
        ref={BitcoinAddressSendSuccessBottomSheet as any}
        snapPoints={[
          -50,
          Platform.OS == 'ios' && DeviceInfo.hasNotch() ? hp('60%') : hp('65%'),
        ]}
        renderContent={renderBitcoinAddressSendSuccessContents}
        renderHeader={renderBitcoinAddressSendSuccessHeader}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  modalContentContainer: {
    height: '100%',
    backgroundColor: Colors.white,
  },
  modalContainer: {
    height: '100%',
    backgroundColor: Colors.white,
    alignSelf: 'center',
    width: '100%',
    paddingBottom: hp('2%'),
    elevation: 10,
    shadowOpacity: 10,
    shadowOffset: { width: 0, height: 2 },
  },
  boldItalicText: {
    fontFamily: Fonts.FiraSansMediumItalic,
    fontStyle: 'italic',
    color: Colors.blue,
  },
  modalHeaderContainer: {
    backgroundColor: Colors.white,
    marginTop: 'auto',
    flex: 1,
    height: Platform.OS == 'ios' ? 45 : 40,
    borderTopLeftRadius: 10,
    borderLeftColor: Colors.borderColor,
    borderLeftWidth: 1,
    borderTopRightRadius: 10,
    borderRightColor: Colors.borderColor,
    borderRightWidth: 1,
    borderTopColor: Colors.borderColor,
    borderTopWidth: 1,
    zIndex: 9999,
  },
  modalHeaderHandle: {
    width: 50,
    height: 5,
    backgroundColor: Colors.borderColor,
    borderRadius: 10,
    alignSelf: 'center',
    marginTop: 7,
  },
  modalHeaderTitleText: {
    color: Colors.blue,
    fontSize: RFValue(18),
    fontFamily: Fonts.FiraSansRegular,
    marginLeft: 15,
  },
  modalHeaderTitleView: {
    borderBottomWidth: 1,
    borderColor: Colors.borderColor,
    alignItems: 'center',
    flexDirection: 'row',
    paddingRight: 10,
    paddingBottom: hp('1.5%'),
    paddingTop: hp('1%'),
    marginLeft: 10,
    marginRight: 10,
    marginBottom: hp('1.5%'),
  },
  textBoxView: {
    flexDirection: 'row',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    height: 50,
    marginTop: hp('5%'),
    marginBottom: hp('1%'),
  },
  textBoxImage: {
    width: wp('6%'),
    height: wp('6%'),
    resizeMode: 'contain',
  },
  amountInputImage: {
    width: 40,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.borderColor,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },
  textBox: {
    flex: 1,
    paddingLeft: 20,
    color: Colors.textColorGrey,
    fontFamily: Fonts.FiraSansMedium,
    fontSize: RFValue(13),
  },
  contactProfileView: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: hp('2%'),
  },
  contactProfileImage: {
    width: 70,
    height: 70,
    resizeMode: 'cover',
    borderRadius: 70 / 2,
  },
  contactNameText: {
    color: Colors.black,
    fontSize: RFValue(20),
    fontFamily: Fonts.FiraSansRegular,
    marginLeft: 5,
  },
  contactIconImage: {
    width: 20,
    height: 20,
    resizeMode: 'cover',
  },
  buttonInnerView: {
    flexDirection: 'row',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    width: wp('30%'),
  },
  buttonImage: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
    tintColor: Colors.white,
  },
  buttonText: {
    color: Colors.white,
    fontSize: RFValue(12),
    fontFamily: Fonts.FiraSansRegular,
    marginLeft: 10,
  },
  confirmButtonView: {
    width: wp('40%'),
    height: wp('13%'),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  dropdownBox: {
    marginTop: hp('1%'),
    marginBottom: hp('1%'),
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 10,
    borderColor: Colors.borderColor,
    height: 50,
    paddingLeft: 15,
    paddingRight: 15,
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  dropdownBoxOpened: {
    marginTop: hp('1%'),
    marginBottom: hp('1%'),
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 10,
    borderColor: Colors.borderColor,
    height: 50,
    paddingLeft: 15,
    paddingRight: 15,
    elevation: 10,
    shadowColor: Colors.borderColor,
    shadowOpacity: 10,
    shadowOffset: { width: 2, height: 2 },
    backgroundColor: Colors.white,
    alignItems: 'center',
  },
  dropdownBoxText: {
    fontFamily: Fonts.FiraSansRegular,
    fontSize: RFValue(13),
  },
  dropdownBoxModal: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    marginTop: hp('1%'),
    width: wp('90%'),
    height: hp('18%'),
    elevation: 10,
    shadowColor: Colors.shadowBlue,
    shadowOpacity: 10,
    shadowOffset: { width: 0, height: 10 },
    backgroundColor: Colors.white,
    position: 'absolute',
    zIndex: 9999,
    overflow: 'hidden',
  },
  dropdownBoxModalElementView: {
    height: 50,
    alignItems: 'center',
    flexDirection: 'row',
    paddingLeft: 15,
  },
});
