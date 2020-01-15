import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  AsyncStorage,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Fonts from '../../common/Fonts';
import BackupStyles from './Styles';
import Colors from '../../common/Colors';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { RFValue } from 'react-native-responsive-fontsize';
import ContactList from '../../components/ContactList';
import { uploadEncMShare } from '../../store/actions/sss';
import { useDispatch, useSelector } from 'react-redux';
import CommunicationModeModalContents from '../../components/CommunicationModeModalContents';
import DeviceInfo from 'react-native-device-info';
import { getIconByStatus } from './utils';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

const TrustedContacts = props => {
  const [selectedStatus, setSelectedStatus] = useState('error'); // for preserving health of this entity
  const [contacts, setContacts] = useState([]);
  const [communicationModeBottomSheet, setCommunicationMode] = useState(
    React.createRef(),
  );
  const index = props.index;

  function selectedContactsList( list ) {
    if ( list.length > 0 ) setContacts( [ ...list ] );
  }

  const onPressContinue = () =>{
    props.onPressContinue(contacts, index);
  }

  return (
    <View style={{
      height: "100%",
      backgroundColor: Colors.white,
      borderTopLeftRadius: 10,
      borderTopRightRadius: 10,
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderTopWidth: 1,
      borderColor: Colors.borderColor,
      alignSelf: "center",
      width: "100%"
    }}>
      <View style={{ ...BackupStyles.modalHeaderTitleView, marginLeft: 10, marginRight: 10, marginTop: 20, }}>
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity onPress={() => { props.onPressBack(); }} style={{ height: 30, width: 30, }} >
            <FontAwesome
              name="long-arrow-left"
              color={Colors.blue}
              size={17}
            />
          </TouchableOpacity>
          <View style={{ alignSelf: "center", flex: 1, justifyContent: "center" }}>
            <Text style={BackupStyles.modalHeaderTitleText}>Trusted Contact</Text>
            <Text style={BackupStyles.modalHeaderInfoText}>
              Never backed up
                    </Text>
          </View>
        </View>
        <Image style={BackupStyles.cardIconImage} source={getIconByStatus(selectedStatus)} />
      </View>
      <View style={ { flex: 1 } }>
        <Text
          style={ {
            marginLeft: 30,
            color: Colors.textColorGrey,
            fontFamily: Fonts.FiraSansRegular,
            fontSize: RFValue( 12 ),
            marginTop: 5,
          } }
        >
          Select two contacts to { ' ' }
          <Text
            style={ {
              fontFamily: Fonts.FiraSansMediumItalic,
              fontWeight: 'bold',
            } }
          >
            send Recovery Secrets
          </Text>
        </Text>
        <ContactList
          style={{}}
          onPressContinue={onPressContinue}
          onSelectContact={selectedContactsList}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create( {
  modalHeaderContainer: {
    paddingTop: 20,
  },
  modalHeaderHandle: {
    width: 30,
    height: 5,
    backgroundColor: Colors.borderColor,
    borderRadius: 10,
    alignSelf: 'center',
    marginTop: 7,
    marginBottom: 7,
  },
} );

export default TrustedContacts;
