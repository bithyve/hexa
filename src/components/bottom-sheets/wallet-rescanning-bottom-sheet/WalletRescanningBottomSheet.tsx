import React, { useEffect, useMemo } from 'react'
import { View, Text, StyleSheet, ImageBackground, Image, ActivityIndicator } from 'react-native'
import { useDispatch } from 'react-redux'
import Colors from '../../../common/Colors'
import SyncStatus from '../../../common/data/enums/SyncStatus'
import AccountShell from '../../../common/data/models/AccountShell'
import BottomSheetStyles from '../../../common/Styles/BottomSheetStyles'
import ListStyles from '../../../common/Styles/ListStyles'
import ButtonStyles from '../../../common/Styles/ButtonStyles'
import usePrimarySubAccountForShell from '../../../utils/hooks/account-utils/UsePrimarySubAccountForShell'
import { TouchableOpacity } from '@gorhom/bottom-sheet'
import { refreshAccountShell } from '../../../store/actions/accounts'
import { heightPercentageToDP } from 'react-native-responsive-screen'
import { RescannedTransactionData } from '../../../store/reducers/wallet-rescanning'
import useWalletRescanningState from '../../../utils/hooks/state-selectors/wallet-rescanning/UseWalletRescanningState'
import sampleRescannedTransactionDetails from '../account-shell-rescanning-bottom-sheet/sample-rescanned-transaction-details'
import TransactionsFoundDuringRescanList from '../account-shell-rescanning-bottom-sheet/TransactionsFoundDuringRescanList'
import useSyncStatusForAccountShellID from '../../../utils/hooks/account-utils/UseSyncStatusForAccountShellID'

export type Props = {
  onDismiss: () => void;
  onTransactionDataSelected: ( transactionData: RescannedTransactionData ) => void;
};

type ProgressTextProps = {
  accountShell: AccountShell;
}

const ScanningProgressText: React.FC<ProgressTextProps> = ( { accountShell, }: ProgressTextProps ) => {
  const dispatch = useDispatch()
  const primarySubAccount = usePrimarySubAccountForShell( accountShell )

  const displayedTitle = useMemo( () => {
    return primarySubAccount.customDisplayName ?? primarySubAccount.defaultTitle
  }, [ primarySubAccount ] )

  const syncStatus = useSyncStatusForAccountShellID( accountShell.id )

  useEffect( () => {
    dispatch( refreshAccountShell( accountShell, {
      autoSync: false,
      hardRefresh: true,
    } ) )
  }, [] )

  return (
    <View style={{
      flexDirection: 'row'
    }}>
      {syncStatus == SyncStatus.IN_PROGRESS && (
        <>
          <Text style={ListStyles.infoHeaderSubtitleText}>Scanning account named </Text>
          <Text style={{
            color: Colors.blue,
            fontStyle: 'italic',
            fontWeight: '600'
          }}>
            {displayedTitle}
          </Text>
        </>
      ) || syncStatus == SyncStatus.COMPLETED && (
        <Text style={ListStyles.infoHeaderSubtitleText}>All accounts scanned</Text>
      )}
    </View>
  )
}

const WalletRescanningBottomSheet: React.FC<Props> = ( {
  onDismiss,
  onTransactionDataSelected,
}: Props ) => {

  // const foundTransactions = useFoundTransactionsFromReScan()
  const foundTransactions: RescannedTransactionData[] = sampleRescannedTransactionDetails
  const walletRescanningState = useWalletRescanningState()

  return (
    <View style={styles.rootContainer}>
      <View style={styles.backgroundImageContainer}>
        <Image
          source={require( '../../../assets/images/loader.gif' )}
          style={{
            width: 103,
            height: 128,
          }}
        />
      </View>

      <View style={styles.mainContentContainer}>
        <Text style={BottomSheetStyles.confirmationMessageHeading}>
          Scanning your Account
        </Text>

        <Text style={{
          ...ListStyles.infoHeaderSubtitleText, marginBottom: 18
        }}>
          Re-scanning your account may take some time
        </Text>

        {walletRescanningState.isScanInProgress && (
          <ActivityIndicator
            style={{
              marginBottom: 18
            }}
            size="large"
            color={Colors.blue}
          />
        )}

        <ScanningProgressText accountShell={walletRescanningState.accountShellBeingScanned} />

        {walletRescanningState.hasScanSucceeded && (
          <>
            <View style={styles.sectionDivider} />
            <Text style={ListStyles.listItemTitle}>Transactions Found</Text>

            <TransactionsFoundDuringRescanList
              containerStyle={{
                marginTop: 18,
                maxHeight: heightPercentageToDP( 30 ),
              }}
              transactionsDetailItems={foundTransactions}
              onTransactionDataSelected={onTransactionDataSelected}
            />

            <View style={{
              marginTop: 'auto'
            }} />

            <View style={styles.footerSectionContainer}>
              {/* <Text style={HeadingStyles.sectionSubHeadingText}>Did you find the transactions you were looking for?</Text>
              <Text style={HeadingStyles.sectionSubHeadingText}>If you didn't, we recommend doing a full re-scan</Text> */}

              <View style={styles.actionButtonContainer}>
                <TouchableOpacity
                  onPress={onDismiss}
                  style={ButtonStyles.primaryActionButton}
                >
                  <Text style={ButtonStyles.actionButtonText}>OK</Text>
                </TouchableOpacity>

                {/* <TouchableOpacity
              onPress={handleFullRescanButtonPress}
              style={ButtonStyles.primaryActionButton}
            >
              <Text style={ButtonStyles.actionButtonText}>Full Rescan</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleBackButtonPress}
              style={{
                ...ButtonStyles.primaryActionButton,
                marginRight: 8,
                backgroundColor: 'transparent',
              }}
            >
              <Text style={{
                ...ButtonStyles.actionButtonText,
                color: Colors.blue,
              }}>Back</Text>
            </TouchableOpacity> */}
              </View>
            </View>
          </>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create( {
  rootContainer: {
    flex: 1,
    backgroundColor: Colors.white,
  },

  backgroundImageContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },

  mainContentContainer: {
    padding: 30,
    paddingBottom: 40,
    flex: 1,
  },

  footerSectionContainer: {
    marginTop: 'auto',
  },

  sectionDivider: {
    marginVertical: 18,
  },

  actionButtonContainer: {
    marginTop: 24,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
} )

export default WalletRescanningBottomSheet
