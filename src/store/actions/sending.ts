import { Action } from 'redux'
import SubAccountDescribing from '../../common/data/models/SubAccountInfo/Interfaces'
import { RecipientDescribing } from '../../common/data/models/interfaces/RecipientDescribing'
import AccountShell from '../../common/data/models/AccountShell'
import { Satoshis } from '../../common/data/typealiases/UnitAliases'

export const SOURCE_ACCOUNT_SELECTED_FOR_SENDING = 'SOURCE_ACCOUNT_SELECTED_FOR_SENDING'
export const ADD_RECIPIENT_FOR_SENDING = 'ADD_RECIPIENT_FOR_SENDING'
export const RECIPIENT_SELECTED_FOR_AMOUNT_SETTING = 'RECIPIENT_SELECTED_FOR_AMOUNT_SETTING'
export const SET_BALANCE_FOR_SENDING_RECIPIENT = 'SET_BALANCE_FOR_SENDING_RECIPIENT'
export const EXECUTE_SENDING = 'EXECUTE_SENDING'
export const SENDING_FAILED = 'SENDING_FAILED'
export const SENDING_SUCCEEDED = 'SENDING_SUCCEEDED'
export const SENDING_COMPLETED = 'SENDING_COMPLETED'
export const CALCULATE_SEND_MAX_FEE = 'CALCULATE_SEND_MAX_FEE'
export const SEND_MAX_FEE_CALCULATED = 'SEND_MAX_FEE_CALCULATED'


export interface SourceAccountSelectedForSendingAction extends Action {
  type: typeof SOURCE_ACCOUNT_SELECTED_FOR_SENDING;
  payload: AccountShell;
}

export const sourceAccountSelectedForSending = (
  payload: AccountShell
): SourceAccountSelectedForSendingAction => {
  return {
    type: SOURCE_ACCOUNT_SELECTED_FOR_SENDING,
    payload,
  }
}


export interface AddRecipientForSendingAction extends Action {
  type: typeof ADD_RECIPIENT_FOR_SENDING;
  payload: RecipientDescribing;
}

export const addRecipientForSending = (
  payload: RecipientDescribing
): AddRecipientForSendingAction => {
  return {
    type: ADD_RECIPIENT_FOR_SENDING,
    payload,
  }
}

export interface RecipientSelectedForAmountSettingAction extends Action {
  type: typeof RECIPIENT_SELECTED_FOR_AMOUNT_SETTING;
  payload: RecipientDescribing;
}

export const recipientSelectedForAmountSetting = (
  payload: RecipientDescribing
): RecipientSelectedForAmountSettingAction => {
  return {
    type: RECIPIENT_SELECTED_FOR_AMOUNT_SETTING,
    payload,
  }
}

export interface ExecuteSendingAction extends Action {
  type: typeof EXECUTE_SENDING;
}

export const executeSending = (): ExecuteSendingAction => {
  return {
    type: EXECUTE_SENDING,
  }
}


export interface SendingFailureAction extends Action {
  type: typeof SENDING_FAILED;
}

export const sendingFailed = (): SendingFailureAction => {
  return {
    type: SENDING_FAILED,
  }
}


export interface SendingSuccessAction extends Action {
  type: typeof SENDING_SUCCEEDED;
}

export const sendingSucceeded = (): SendingSuccessAction => {
  return {
    type: SENDING_SUCCEEDED,
  }
}

export interface SendingCompletionAction extends Action {
  type: typeof SENDING_COMPLETED;
}

export const sendingCompleted = (): SendingCompletionAction => {
  return {
    type: SENDING_COMPLETED,
  }
}


export interface CalculateSendMaxFeeAction extends Action {
  type: typeof CALCULATE_SEND_MAX_FEE;
  payload: {
    numberOfRecipients: number;
    accountShellID: string;
    feePerByte: Satoshis;
  };
}

export const calculateSendMaxFee = (
  payload: {
    numberOfRecipients: number;
    accountShellID: string;
    feePerByte: Satoshis;
  },
): CalculateSendMaxFeeAction => {
  return {
    type: CALCULATE_SEND_MAX_FEE,
    payload,
  }
}

export interface SendMaxFeeCalculatedAction extends Action {
  type: typeof SEND_MAX_FEE_CALCULATED;
  payload: Satoshis;
}

export const sendMaxFeeCalculated = (
  payload: Satoshis,
): SendMaxFeeCalculatedAction => {
  return {
    type: SEND_MAX_FEE_CALCULATED,
    payload,
  }
}