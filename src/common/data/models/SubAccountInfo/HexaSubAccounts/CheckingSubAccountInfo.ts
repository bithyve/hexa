import { v4 as uuid } from 'uuid'
import {
  Balances,
  TransactionDetails,
} from '../../../../../bitcoin/utilities/Interface'
import AccountVisibility from '../../../enums/AccountVisibility'
import SourceAccountKind from '../../../enums/SourceAccountKind'
import SubAccountKind from '../../../enums/SubAccountKind'
import UTXOCompatibilityGroup from '../../../enums/UTXOCompatibilityGroup'
import {
  HexaSubAccountDescribing,
  SubAccountDescribingConstructorProps,
} from '../Interfaces'

type ConstructorProps = SubAccountDescribingConstructorProps & {};

export default class CheckingSubAccountInfo
implements HexaSubAccountDescribing {
  id: string;
  accountShellID: string | null;
  instanceNumber: number;

  kind: SubAccountKind = SubAccountKind.REGULAR_ACCOUNT;
  sourceKind: SourceAccountKind = SourceAccountKind.REGULAR_ACCOUNT;
  balances: Balances;
  visibility: AccountVisibility;
  isTFAEnabled = false;

  defaultTitle: string;
  defaultDescription = 'Fast and easy';
  customDisplayName: string | null;
  customDescription: string | null;

  transactions: TransactionDetails[];
  utxoCompatibilityGroup: UTXOCompatibilityGroup =
    UTXOCompatibilityGroup.SINGLE_SIG_PUBLIC;

  constructor({
    id = uuid(),
    accountShellID = null,
    instanceNumber = null,
    defaultTitle = 'Checking Account',
    balances = {
      confirmed: 0, unconfirmed: 0 
    },
    customDisplayName = null,
    customDescription = null,
    visibility = AccountVisibility.DEFAULT,
    transactions = [],
  }: ConstructorProps) {
    this.id = id
    this.accountShellID = accountShellID
    this.instanceNumber = instanceNumber
    this.defaultTitle = defaultTitle
    this.balances = balances
    this.customDisplayName = customDisplayName
    this.customDescription = customDescription
    this.visibility = visibility
    this.transactions = transactions
  }
}
