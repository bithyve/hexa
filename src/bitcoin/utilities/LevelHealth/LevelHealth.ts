import { AxiosResponse } from 'axios';
import * as bip39 from 'bip39';
import crypto from 'crypto';
import secrets from 'secrets.js-grempe';
import config from '../../HexaConfig';
import {
  BuddyStaticNonPMDD,
  EncDynamicNonPMDD,
  MetaShare,
  SocialStaticNonPMDD,
  EncryptedImage,
  WalletImage,
} from '../Interface';

import { BH_AXIOS } from '../../../services/api';
import { generateRandomString } from '../../../common/CommonFunctions';
import moment from 'moment';
const { HEXA_ID } = config;
export default class LevelHealth {
  public static cipherSpec: {
    algorithm: string;
    salt: string;
    iv: Buffer;
    keyLength: number;
  } = config.CIPHER_SPEC;

  public static recoverFromSecrets = (
    decryptedSecrets: string[],
    level?: number
  ): {
    mnemonic: string;
  } => {
    let levelThreshold = level == 2 ? LevelHealth.thresholdLevel1 : level == 3 ? LevelHealth.thresholdLevel2 : LevelHealth.threshold; 
    if (decryptedSecrets.length >= levelThreshold) {
      const secretsArray = [];
      for (const secret of decryptedSecrets) {
        if (LevelHealth.validShare(secret)) {
          secretsArray.push(secret.slice(0, secret.length - 8));
        } else {
          throw new Error(`Invalid checksum, share: ${secret} is corrupt`);
        }
      }

      const recoveredMnemonicHex = secrets.combine(secretsArray);
      return { mnemonic: LevelHealth.hexToString(recoveredMnemonicHex) };
    } else {
      throw new Error(
        `supplied number of shares are less than the threshold (${levelThreshold})`,
      );
    }
  };

  public static decryptSecrets = (
    secretsArray: string[],
    answer: string,
  ): {
    decryptedSecrets: string[];
  } => {
    const key = LevelHealth.getDerivedKey(answer);

    const decryptedSecrets: string[] = [];
    for (const secret of secretsArray) {
      const decipher = crypto.createDecipheriv(
        LevelHealth.cipherSpec.algorithm,
        key,
        LevelHealth.cipherSpec.iv,
      );
      let decrypted = decipher.update(secret, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      decryptedSecrets.push(decrypted);
    }
    return { decryptedSecrets };
  };

  public static downloadShare = async (
    encryptedKey: string,
    otp?: string,
  ): Promise<
    | {
        metaShare: MetaShare;
        encryptedDynamicNonPMDD: EncDynamicNonPMDD;
        messageId: string;
      }
    | {
        metaShare: MetaShare;
        messageId: string;
        encryptedDynamicNonPMDD?: undefined;
      }
  > => {
    let key = encryptedKey; // if no OTP is provided the key is non-OTP encrypted and can be used directly
    if (otp) {
      key = LevelHealth.decryptViaOTP(encryptedKey, otp).decryptedData;
    }
    const messageId: string = LevelHealth.getMessageId(
      key,
      config.MSG_ID_LENGTH,
    );
    let res: AxiosResponse;
    try {
      res = await BH_AXIOS.post('downloadShare', {
        HEXA_ID,
        messageId,
      });
    } catch (err) {
      if (err.response) throw new Error(err.response.data.err);
      if (err.code) throw new Error(err.code);
    }

    const { share, encryptedDynamicNonPMDD } = res.data;
    const metaShare = LevelHealth.decryptMetaShare(share, key)
      .decryptedMetaShare;
    return { metaShare, encryptedDynamicNonPMDD, messageId };
  };

  public static downloadSMShare = async (
    encryptedKey: string,
    otp?: string,
  ): Promise<
    | {
        status: number;
        metaShare: MetaShare;
        messageId: string;
      }
    | {
        status: number;
        metaShare: MetaShare;
        messageId: string;
      }
  > => {
    let key = encryptedKey; // if no OTP is provided the key is non-OTP encrypted and can be used directly
    if (otp) {
      key = LevelHealth.decryptViaOTP(encryptedKey, otp).decryptedData;
    }
    const messageId: string = LevelHealth.getMessageId(
      key,
      config.MSG_ID_LENGTH,
    );
    let res: AxiosResponse;
    try {
      res = await BH_AXIOS.post('downloadSecondaryShare', {
        HEXA_ID,
        messageId,
      });
    } catch (err) {
      if (err.response) throw new Error(err.response.data.err);
      if (err.code) throw new Error(err.code);
    }

    const { share } = res.data;
    const metaShare = LevelHealth.decryptMetaShare(share, key)
      .decryptedMetaShare;
    return { status: 200, metaShare, messageId };
  };

  public static downloadDynamicNonPMDD = async (
    walletID: string,
  ): Promise<{
    encryptedDynamicNonPMDD: EncDynamicNonPMDD;
  }> => {
    let res: AxiosResponse;
    try {
      res = await BH_AXIOS.post('downloadDynamicNonPMDD', {
        HEXA_ID,
        walletID,
      });
    } catch (err) {
      if (err.response) throw new Error(err.response.data.err);
      if (err.code) throw new Error(err.code);
    }

    const { encryptedDynamicNonPMDD } = res.data;
    if (encryptedDynamicNonPMDD) {
      return {
        encryptedDynamicNonPMDD,
      };
    } else {
      throw new Error('Unable to download EncDynamicNonPMDD');
    }
  };

  public static validateStorage = (
    decryptedMetaShare: MetaShare,
    existingShares: MetaShare[],
    walletId?: string,
  ): boolean => {
    if (walletId && decryptedMetaShare.meta.walletId === walletId) {
      throw new Error("You're not allowed to be your own contact");
    }

    if (existingShares.length) {
      for (const share of existingShares) {
        if (share.meta.walletId === decryptedMetaShare.meta.walletId) {
          if (
            parseFloat(share.meta.version) >=
            parseFloat(decryptedMetaShare.meta.version)
          ) {
            throw new Error(
              'You cannot store lower share version of the same share',
            );
          }
        }
      }
    }

    return true;
  };

  public static affirmDecryption = async (
    messageId: string,
  ): Promise<{
    deleted: boolean;
  }> => {
    let res: AxiosResponse;

    try {
      res = await BH_AXIOS.post('affirmDecryption', {
        HEXA_ID,
        messageId,
      });
    } catch (err) {
      if (err.response) throw new Error(err.response.data.err);
      if (err.code) throw new Error(err.code);
    }

    return { deleted: res.data.deleted };
  };

  public static encryptMetaShare = (
    metaShare: MetaShare,
    key?: string,
  ): { encryptedMetaShare: string; key: string; messageId: string } => {
    if (!key) {
      key = LevelHealth.generateKey(LevelHealth.cipherSpec.keyLength);
    }
    const messageId: string = LevelHealth.getMessageId(
      key,
      config.MSG_ID_LENGTH,
    );
    const cipher = crypto.createCipheriv(
      LevelHealth.cipherSpec.algorithm,
      key,
      LevelHealth.cipherSpec.iv,
    );
    let encrypted = cipher.update(JSON.stringify(metaShare), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const encryptedMetaShare = encrypted;
    return {
      encryptedMetaShare,
      key,
      messageId,
    };
  };

  public static generateRequestCreds = () => {
    const key = LevelHealth.generateKey(LevelHealth.cipherSpec.keyLength);
    // const { otp, otpEncryptedData } = LevelHealth.encryptViaOTP(key);
    return { key };
  };

  public static uploadRequestedShare = async (
    encryptedKey: string,
    otp?: string,
    metaShare?: MetaShare,
    encryptedDynamicNonPMDD?: EncDynamicNonPMDD,
  ): Promise<{ success: boolean }> => {
    let key = encryptedKey; // if no OTP is provided the key is non-OTP encrypted and can be used directly
    if (otp) {
      key = LevelHealth.decryptViaOTP(encryptedKey, otp).decryptedData;
    }
    const { encryptedMetaShare, messageId } = LevelHealth.encryptMetaShare(
      metaShare,
      key,
    );

    let res: AxiosResponse;
    try {
      res = await BH_AXIOS.post('uploadShare', {
        HEXA_ID,
        share: encryptedMetaShare,
        messageId,
        encryptedDynamicNonPMDD,
      });
    } catch (err) {
      if (err.response) throw new Error(err.response.data.err);
      if (err.code) throw new Error(err.code);
    }

    const { success } = res.data;
    if (!success) {
      throw new Error('Unable to upload share');
    }
    return { success };
  };

  public static downloadAndValidateShare = async (
    encryptedKey: string,
    otp?: string,
    existingShares?: MetaShare[],
    walletId?: string,
  ): Promise<{
    metaShare: MetaShare;
    encryptedDynamicNonPMDD: EncDynamicNonPMDD;
  }> => {
    const {
      metaShare,
      messageId,
      encryptedDynamicNonPMDD,
    } = await LevelHealth.downloadShare(encryptedKey, otp);

    if (LevelHealth.validateStorage(metaShare, existingShares, walletId)) {
      // const { deleted } = await LevelHealth.affirmDecryption(messageId);
      // if (!deleted) {
      //   console.log('Unable to remove the share from the server');
      // }
      return { metaShare, encryptedDynamicNonPMDD };
    }
  };

  public static decryptViaOTP = (
    otpEncryptedData: string,
    otp: string,
  ): {
    decryptedData: any;
  } => {
    const key = LevelHealth.getDerivedKey(otp);
    // const key = crypto.scryptSync(
    //   intermediateKey,
    //   this.cipherSpec.salt,
    //   this.cipherSpec.keyLength,
    // );
    const decipher = crypto.createDecipheriv(
      LevelHealth.cipherSpec.algorithm,
      key,
      LevelHealth.cipherSpec.iv,
    );

    try {
      let decrypted = decipher.update(otpEncryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      const decryptedData = JSON.parse(decrypted);
      return { decryptedData };
    } catch (err) {
      throw new Error(
        'An error occurred while decrypting the data: Invalid OTP/Tampered data',
      );
    }
  };

  public static decryptMetaShare = (
    encryptedMetaShare: string,
    key: any,
  ): {
    decryptedMetaShare: MetaShare;
  } => {
    // const key = crypto.scryptSync(
    //   intermediateKey,
    //   this.cipherSpec.salt,
    //   this.cipherSpec.keyLength,
    // );
    const decipher = crypto.createDecipheriv(
      LevelHealth.cipherSpec.algorithm,
      key,
      LevelHealth.cipherSpec.iv,
    );

    try {
      let decrypted = decipher.update(encryptedMetaShare, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      const decryptedMetaShare: MetaShare = JSON.parse(decrypted);
      const { shareId, encryptedSecret } = decryptedMetaShare;
      const generatedShareId = crypto
        .createHash('sha256')
        .update(JSON.stringify(encryptedSecret))
        .digest('hex');

      if (
        shareId !== generatedShareId &&
        decryptedMetaShare.meta.validator !== 'HEXA'
      ) {
        throw new Error();
      }

      return { decryptedMetaShare };
    } catch (err) {
      throw new Error(
        'An error occurred while decrypting the share: Invalid Key/Tampered Share',
      );
    }
  };

  public static getMessageId = (key: string, length: number): string => {
    const messageId = crypto.createHash('sha256').update(key).digest('hex');
    return messageId.slice(0, length);
  };

  public static recoverMetaShareFromQR = (
    qrData: string[],
  ): { metaShare: MetaShare } => {
    qrData.sort();
    let recoveredQRData: string;
    recoveredQRData = '';
    for (let itr = 0; itr < config.SSS_METASHARE_SPLITS; itr++) {
      const res = qrData[itr].slice(3);
      recoveredQRData = recoveredQRData + res;
    }
    const metaShare = JSON.parse(recoveredQRData);
    return { metaShare };
  };

  public static updateHealth = async (
    shares: [
      {
        walletId: string;
        shareId: string;
        reshareVersion: number;
        updatedAt: number;
        status?: string;
      },
    ],
  ): Promise<{
    updationInfo: Array<{
      walletId: string;
      shareId: string;
      updated: boolean;
      updatedAt?: number;
    }>;
    updationResult: Array<{
      levels: Array<{
        levelInfo: Array<{
          _id: string;
          shareType: string;
          updatedAt: number;
          status: string;
          shareId: string;
          reshareVersion: number;
        }>;
        _id?: string;
        level: number;
      }>
      currentLevel: number;
      walletId: string;
    }>
  }> => {
    let res: AxiosResponse;
    try {
      res = await BH_AXIOS.post('updateSharesHealth2', {
        HEXA_ID,
        toUpdate: shares,
      });
      console.log('updateSharesHealth2 res', res)
    } catch (err) {
      if (err.response) throw new Error(err.response.data.err);
      if (err.code) throw new Error(err.code);
    }
    return res.data;
  };

  public static getShareId = (encryptedSecret: string): string =>
    crypto
      .createHash('sha256')
      .update(JSON.stringify(encryptedSecret))
      .digest('hex');

  public static strechKey = (password: string): string => {
    return crypto
      .pbkdf2Sync(
        password,
        config.HEXA_ID,
        config.KEY_STRETCH_ITERATIONS,
        LevelHealth.cipherSpec.keyLength / 2,
        'sha256',
      )
      .toString('hex');
  };

  public static generateKey = (length: number): string => {
    let result = '';
    const characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for (let itr = 0; itr < length; itr++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  };

  public static encryptViaOTP = (
    data: any,
  ): {
    otpEncryptedData: string;
    otp: string;
  } => {
    const otp: string = LevelHealth.generateOTP(
      parseInt(config.SSS_OTP_LENGTH, 10),
    );
    const key = LevelHealth.getDerivedKey(otp);
    // const key = crypto.scryptSync(
    //   intermediateKey,
    //   this.cipherSpec.salt,
    //   this.cipherSpec.keyLength,
    // );

    const cipher = crypto.createCipheriv(
      LevelHealth.cipherSpec.algorithm,
      key,
      LevelHealth.cipherSpec.iv,
    );
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const encryptedData = encrypted;
    return {
      otpEncryptedData: encryptedData,
      otp,
    };
  };

  public static generateOTP = (otpLength: number): string =>
    LevelHealth.generateRandomString(otpLength);

  public static generateRandomString = (length: number): string => {
    let randomString: string = '';
    const possibleChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    for (let itr = 0; itr < length; itr++) {
      randomString += possibleChars.charAt(
        Math.floor(Math.random() * possibleChars.length),
      );
    }
    return randomString;
  };
  private static threshold: number = config.SSS_THRESHOLD;
  private static thresholdLevel1: number = config.SSS_LEVEL1_THRESHOLD;
  private static thresholdLevel2: number = config.SSS_LEVEL2_THRESHOLD;

  private static hexToString = (hex: string): string => secrets.hex2str(hex);

  private static getDerivedKey = (psuedoKey: string): string => {
    const hashRounds = 1048;
    let key = psuedoKey;
    for (let itr = 0; itr < hashRounds; itr++) {
      const hash = crypto.createHash('sha512');
      key = hash.update(key).digest('hex');
    }
    return key.slice(key.length - LevelHealth.cipherSpec.keyLength);
  };

  private static validShare = (checksumedShare: string): boolean => {
    const extractedChecksum = checksumedShare.slice(checksumedShare.length - 8);
    const recoveredShare = checksumedShare.slice(0, checksumedShare.length - 8);
    const calculatedChecksum = LevelHealth.calculateChecksum(recoveredShare);
    if (calculatedChecksum !== extractedChecksum) {
      return false;
    }
    return true;
  };

  private static calculateChecksum = (share: string): string => {
    let temp = share;
    for (let itr = 0; itr < config.CHECKSUM_ITR; itr++) {
      const hash = crypto.createHash('sha512');
      hash.update(temp);
      temp = hash.digest('hex');
    }

    return temp.slice(0, 8);
  };

  public walletId: string;
  public shareIDs: string[];
  public encryptedSecrets: string[];
  public metaShares: MetaShare[];
  public healthCheckInitialized: boolean;
  public pdfHealth: {};
  public healthCheckStatus: {};
  private mnemonic: string;

  constructor(
    mnemonic: string,
    stateVars?: {
      encryptedSecrets: string[];
      shareIDs: string[];
      metaShares: MetaShare[];
      healthCheckInitialized: boolean;
      walletId: string;
      healthCheckStatus: {};
      pdfHealth: {};
    },
  ) {
    if (bip39.validateMnemonic(mnemonic)) {
      this.mnemonic = mnemonic;
    } else {
      throw new Error('Invalid Mnemonic');
    }
    this.walletId = stateVars
      ? stateVars.walletId
      : crypto
          .createHash('sha256')
          .update(bip39.mnemonicToSeedSync(this.mnemonic))
          .digest('hex');
    this.encryptedSecrets = stateVars ? stateVars.encryptedSecrets : [];
    this.shareIDs = stateVars ? stateVars.shareIDs : [];
    this.metaShares = stateVars ? stateVars.metaShares : [];
    this.healthCheckInitialized = stateVars
      ? stateVars.healthCheckInitialized
      : false;
    this.healthCheckStatus = stateVars ? stateVars.healthCheckStatus : {};
    this.pdfHealth = stateVars ? stateVars.pdfHealth : {};
  }

  public stringToHex = (str: string): string => secrets.str2hex(str);

  public generateMessageID = (): string =>
    LevelHealth.generateRandomString(config.MSG_ID_LENGTH);

  public generateShares = (): {
    shares: string[];
  } => {
    // threshold shares(m) of total shares(n) will enable the recovery of the mnemonic
    const shares = secrets.share(
      this.stringToHex(this.mnemonic),
      config.SSS_TOTAL,
      config.SSS_THRESHOLD,
    );

    for (let itr = 0; itr < shares.length; itr++) {
      const checksum = LevelHealth.calculateChecksum(shares[itr]);
      shares[itr] = shares[itr] + checksum;
    }

    return { shares };
  };

  public generateLevel1Shares = (): {
    shares: string[];
  } => {
    // threshold shares(m) of total shares(n) will enable the recovery of the mnemonic
    const shares = secrets.share(
      this.stringToHex(this.mnemonic),
      config.SSS_LEVEL1_TOTAL,
      config.SSS_LEVEL1_THRESHOLD,
    );

    for (let itr = 0; itr < shares.length; itr++) {
      const checksum = LevelHealth.calculateChecksum(shares[itr]);
      shares[itr] = shares[itr] + checksum;
    }

    return { shares };
  };

  public generateLevel2Shares = (): {
    shares: string[];
  } => {
    // threshold shares(m) of total shares(n) will enable the recovery of the mnemonic
    const shares = secrets.share(
      this.stringToHex(this.mnemonic),
      config.SSS_LEVEL2_TOTAL,
      config.SSS_LEVEL2_THRESHOLD,
    );

    for (let itr = 0; itr < shares.length; itr++) {
      const checksum = LevelHealth.calculateChecksum(shares[itr]);
      shares[itr] = shares[itr] + checksum;
    }

    return { shares };
  };

  public prepareShareUploadables = (
    shareIndex: number,
    contactName: string,
    dynamicNonPMDD?: MetaShare[],
  ): {
    otp: string;
    encryptedKey: string;
    encryptedMetaShare: string;
    messageId: string;
    encryptedDynamicNonPMDD: EncDynamicNonPMDD;
  } => {
    if (!this.metaShares.length) {
      throw new Error('Generate MetaShares prior uploading');
    }

    // let res: AxiosResponse;
    this.metaShares[
      shareIndex
    ].meta.guardian = contactName.toLowerCase().trim();
    const metaShare: MetaShare = this.metaShares[shareIndex];
    const { encryptedMetaShare, key, messageId } = LevelHealth.encryptMetaShare(
      metaShare,
    );

    let encryptedDynamicNonPMDD: EncDynamicNonPMDD;
    if (dynamicNonPMDD) {
      encryptedDynamicNonPMDD = {
        encryptedDynamicNonPMDD: this.encryptDynamicNonPMDD(dynamicNonPMDD)
          .encryptedDynamicNonPMDD,
        updatedAt: Date.now(),
      };
    }

    const { otp, otpEncryptedData } = LevelHealth.encryptViaOTP(key);
    return {
      otp,
      encryptedKey: otpEncryptedData,
      encryptedMetaShare,
      messageId,
      encryptedDynamicNonPMDD,
    };
  };

  public initializeHealth = async (): Promise<{
    success: boolean;
    levelInfo: any[];
  }> => {
    if (this.healthCheckInitialized)
      throw new Error('Health Check is already initialized.');

    let randomIdForSecurityQ = generateRandomString(8);
    let randomIdForCloud = generateRandomString(8);
    let levelInfo = [
      {
        shareType: 'cloud',
        updatedAt: 0,
        status: 'notAccessible',
        shareId: randomIdForCloud,
        reshareVersion: 0,
      },
      {
        shareType: 'securityQuestion',
        updatedAt: moment(new Date()).valueOf(),
        status: 'accessible',
        shareId: randomIdForSecurityQ,
        reshareVersion: 0,
      },
    ];

    let res: AxiosResponse;
    try {
      res = await BH_AXIOS.post('sharesHealthCheckInit2', {
        HEXA_ID,
        walletID: this.walletId,
        levelInfo,
      });
    } catch (err) {
      if (err.response) throw new Error(err.response.data.err);
      if (err.code) throw new Error(err.code);
    }
    if (res.data.initSuccessful) {
      this.healthCheckInitialized = true;
    }
    return {
      success: res.data.initSuccessful,
      levelInfo: levelInfo,
    };
  };

  public checkHealth = async (): Promise<{
    shareGuardianMapping: {
      [index: number]: { shareId: string; updatedAt: number; guardian: string };
    };
  }> => {
    let res: AxiosResponse;

    if (!this.metaShares.length)
      throw new Error('Can not initialize health check; missing MetaShares');

    const metaShares = this.metaShares.slice(0, 3);
    try {
      res = await BH_AXIOS.post('checkSharesHealth2', {
        HEXA_ID,
        walletID: this.walletId,
      });
    } catch (err) {
      if (err.response) throw new Error(err.response.data.err);
      if (err.code) throw new Error(err.code);
    }

    const updates: Array<{ shareId: string; updatedAt: number }> =
      res.data.lastUpdateds;

    const shareGuardianMapping = {};
    for (const { shareId, updatedAt } of updates) {
      for (let index = 0; index < metaShares.length; index++) {
        if (metaShares[index] && metaShares[index].shareId === shareId) {
          this.healthCheckStatus[index] = { shareId, updatedAt };
          shareGuardianMapping[index] = {
            shareId,
            updatedAt,
            guardian: metaShares[index].meta.guardian,
          };
        }
      }
    }

    return {
      shareGuardianMapping,
    };
  };

  public checkHealth2 = async (): Promise<{
    data: {};
  }> => {
    let response = {};
    let res: AxiosResponse;
    const metaShares = this.metaShares.slice(0, 3);
    try {
      res = await BH_AXIOS.post('checkSharesHealth2', {
        HEXA_ID,
        walletID: this.walletId,
      });
      response = res;
      console.log('checkSharesHealth2 result', res);
    } catch (err) {
      if (err.response) throw new Error(err.response.data.err);
      if (err.code) throw new Error(err.code);
      response = err;
    }
    return {
      data: response,
    };
  };

  public updateHealthLevel2 = async (SecurityQuestionHealth, _level): Promise<{
    success: boolean;
    message: string;
  }> => {
    console.log('INIT_LEVEL_TWO LH', SecurityQuestionHealth)
    let levelInfo = [];
    if (this.metaShares.length) {
      levelInfo[0] = {
        shareType: 'cloud',
        updatedAt: 0,
        status: 'notAccessible',
        shareId: this.metaShares[0].shareId,
        reshareVersion: 0,
      };
      levelInfo[1] = SecurityQuestionHealth;
      for (let i = 1; i < this.metaShares.length; i++) {
        const element = this.metaShares[i];
        let shareType = '';
        if (i == 0) shareType = 'cloud';
        if (i == 1) shareType = 'primaryKeeper';
        let obj = {
          shareType: shareType,
          updatedAt: 0,
          status: 'notAccessible',
          shareId: element.shareId,
          reshareVersion: 0,
        };
        levelInfo.push(obj);
      }
      let res: AxiosResponse;
      try {
        res = await BH_AXIOS.post('updateHealthLevel2', {
          HEXA_ID,
          walletID: this.walletId,
          level: _level,
          levelInfo,
        });
        console.log('INIT_LEVEL_TWO axios res', res );
      } catch (err) {
        if (err.response) throw new Error(err.response.data.err);
        if (err.code) throw new Error(err.code);
      }
      return {
        success: res.data.updateSuccessful,
        message: '',
      };
    }
    return {
      success: false,
      message: 'Something went wrong!',
    };
  };

  public generateStaticNonPMDD = (secureAccAssets: {
    secondaryMnemonic: string;
    twoFASecret: string;
    secondaryXpub: string;
    bhXpub: string;
  }) => {
    const {
      secondaryMnemonic,
      twoFASecret,
      secondaryXpub,
      bhXpub,
    } = secureAccAssets;

    const shareIDs = this.shareIDs;

    const socialStaticNonPMDD: SocialStaticNonPMDD = {
      secondaryXpub,
      bhXpub,
      shareIDs,
    };
    const buddyStaticNonPMDD: BuddyStaticNonPMDD = {
      secondaryMnemonic,
      twoFASecret,
      secondaryXpub,
      bhXpub,
      shareIDs,
    };

    return {
      encryptedSocialStaticNonPMDD: this.encryptStaticNonPMDD(
        socialStaticNonPMDD,
      ).encryptedStaticNonPMDD,
      encryptedBuddyStaticNonPMDD: this.encryptStaticNonPMDD(buddyStaticNonPMDD)
        .encryptedStaticNonPMDD,
    };
  };

  public encryptStaticNonPMDD = (
    staticNonPMDD: SocialStaticNonPMDD | BuddyStaticNonPMDD,
  ): {
    encryptedStaticNonPMDD: string;
  } => {
    const key = LevelHealth.getDerivedKey(
      bip39.mnemonicToSeedSync(this.mnemonic).toString('hex'),
    );
    // const key = crypto.scryptSync(
    //   intermediateKey,
    //   LevelHealth.cipherSpec.salt,
    //   LevelHealth.cipherSpec.keyLength,
    // );
    const cipher = crypto.createCipheriv(
      LevelHealth.cipherSpec.algorithm,
      key,
      LevelHealth.cipherSpec.iv,
    );

    let encrypted = cipher.update(JSON.stringify(staticNonPMDD), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return { encryptedStaticNonPMDD: encrypted };
  };

  public decryptStaticNonPMDD = (
    encryptStaticNonPMDD: string,
  ): {
    decryptedStaticNonPMDD;
  } => {
    const key = LevelHealth.getDerivedKey(
      bip39.mnemonicToSeedSync(this.mnemonic).toString('hex'),
    );
    // const key = crypto.scryptSync(
    //   intermediateKey,
    //   LevelHealth.cipherSpec.salt,
    //   LevelHealth.cipherSpec.keyLength,
    // );

    const decipher = crypto.createDecipheriv(
      LevelHealth.cipherSpec.algorithm,
      key,
      LevelHealth.cipherSpec.iv,
    );
    let decrypted = decipher.update(encryptStaticNonPMDD, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    const decryptedStaticNonPMDD = JSON.parse(decrypted);
    return { decryptedStaticNonPMDD };
  };

  public encryptDynamicNonPMDD = (
    dynamicNonPMDD: MetaShare[],
  ): { encryptedDynamicNonPMDD: string } => {
    const key = LevelHealth.getDerivedKey(
      bip39.mnemonicToSeedSync(this.mnemonic).toString('hex'),
    );
    // const key = crypto.scryptSync(
    //   intermediateKey,
    //   LevelHealth.cipherSpec.salt,
    //   LevelHealth.cipherSpec.keyLength,
    // );

    const cipher = crypto.createCipheriv(
      LevelHealth.cipherSpec.algorithm,
      key,
      LevelHealth.cipherSpec.iv,
    );
    let encrypted = cipher.update(
      JSON.stringify(dynamicNonPMDD),
      'utf8',
      'hex',
    );
    encrypted += cipher.final('hex');

    return { encryptedDynamicNonPMDD: encrypted };
  };

  public decryptDynamicNonPMDD = (
    encryptedDynamicNonPMDD: EncDynamicNonPMDD,
  ): {
    decryptedDynamicNonPMDD: MetaShare[];
  } => {
    const key = LevelHealth.getDerivedKey(
      bip39.mnemonicToSeedSync(this.mnemonic).toString('hex'),
    );
    // const key = crypto.scryptSync(
    //   intermediateKey,
    //   LevelHealth.cipherSpec.salt,
    //   LevelHealth.cipherSpec.keyLength,
    // );

    const decipher = crypto.createDecipheriv(
      LevelHealth.cipherSpec.algorithm,
      key,
      LevelHealth.cipherSpec.iv,
    );
    let decrypted = decipher.update(
      encryptedDynamicNonPMDD.encryptedDynamicNonPMDD,
      'hex',
      'utf8',
    );
    decrypted += decipher.final('utf8');

    const decryptedDynamicNonPMDD = JSON.parse(decrypted);
    return { decryptedDynamicNonPMDD };
  };

  public restoreDynamicNonPMDD = (
    dynamicNonPMDDs: EncDynamicNonPMDD[],
  ): {
    decryptedDynamicNonPMDD: MetaShare[];
  } => {
    if (dynamicNonPMDDs.length === 0) {
      throw new Error('No dynamicNonPMDDs supplied');
    }

    const latestDNP = dynamicNonPMDDs
      .sort((dnp1, dnp2) => {
        return dnp1.updatedAt > dnp2.updatedAt
          ? 1
          : dnp2.updatedAt > dnp1.updatedAt
          ? -1
          : 0;
      })
      .pop();

    const { decryptedDynamicNonPMDD } = this.decryptDynamicNonPMDD(latestDNP);
    return { decryptedDynamicNonPMDD };
  };

  public updateDynamicNonPMDD = async (
    dynamicNonPMDD,
  ): Promise<{
    updated: boolean;
  }> => {
    const encryptedDynamicNonPMDD: EncDynamicNonPMDD = {
      updatedAt: Date.now(),
      encryptedDynamicNonPMDD: this.encryptDynamicNonPMDD(dynamicNonPMDD)
        .encryptedDynamicNonPMDD,
    };

    let res: AxiosResponse;
    try {
      res = await BH_AXIOS.post('updateDynamicNonPMDD', {
        HEXA_ID,
        walletID: this.walletId,
        encryptedDynamicNonPMDD,
      });
    } catch (err) {
      if (err.response) throw new Error(err.response.data.err);
      if (err.code) throw new Error(err.code);
    }

    const { updated } = res.data;
    if (updated) {
      return {
        updated,
      };
    } else {
      throw new Error('Unable to update the NonPMDD');
    }
  };

  public createMetaShares = (
    secureAssets: {
      secondaryMnemonic: string;
      twoFASecret: string;
      secondaryXpub: string;
      bhXpub: string;
    },
    tag: string,
    version?: string,
  ): {
    metaShares: MetaShare[];
  } => {
    if (!this.encryptedSecrets.length) {
      throw new Error('Can not create MetaShares; missing encryptedSecrets');
    }

    const {
      encryptedSocialStaticNonPMDD,
      encryptedBuddyStaticNonPMDD,
    } = this.generateStaticNonPMDD(secureAssets);

    const timestamp = new Date().toLocaleString(undefined, {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    let index = 0;
    let metaShare: MetaShare;
    for (const encryptedSecret of this.encryptedSecrets) {
      if (index === 0) {
        metaShare = {
          encryptedSecret,
          shareId: LevelHealth.getShareId(encryptedSecret),
          meta: {
            version: version ? version : '0',
            validator: 'HEXA',
            index,
            walletId: this.walletId,
            tag,
            timestamp,
            reshareVersion: 0,
          },
          encryptedStaticNonPMDD: encryptedBuddyStaticNonPMDD,
        };
      } else {
        metaShare = {
          encryptedSecret,
          shareId: LevelHealth.getShareId(encryptedSecret),
          meta: {
            version: version ? version : '0',
            validator: 'HEXA',
            index,
            walletId: this.walletId,
            tag,
            timestamp,
            reshareVersion: 0,
          },
          encryptedStaticNonPMDD: encryptedSocialStaticNonPMDD,
        };
      }

      this.metaShares.push(metaShare);
      index++;
    }
    if (this.metaShares.length !== config.SSS_LEVEL1_TOTAL) {
      this.metaShares = [];
      throw new Error('Something went wrong while generating metaShares');
    }

    return { metaShares: this.metaShares };
  };

  public createMetaSharesKeeper = (
    secureAssets: {
      secondaryMnemonic: string;
      twoFASecret: string;
      secondaryXpub: string;
      bhXpub: string;
    },
    tag: string,
    version?: string,
    level?: number,
  ): {
    metaShares: MetaShare[];
  } => {
    if (!this.encryptedSecrets.length) {
      throw new Error('Can not create MetaShares; missing encryptedSecrets');
    }

    const {
      encryptedSocialStaticNonPMDD,
      encryptedBuddyStaticNonPMDD,
    } = this.generateStaticNonPMDD(secureAssets);

    const timestamp = new Date().toLocaleString(undefined, {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    let index = 0;
    let metaShareArray = [];
    let metaShare: MetaShare;
    for (const encryptedSecret of this.encryptedSecrets) {
      if (index === 1) {
        metaShare = {
          encryptedSecret,
          shareId: LevelHealth.getShareId(encryptedSecret),
          meta: {
            version: version ? version : '0',
            validator: 'HEXA',
            index,
            walletId: this.walletId,
            tag,
            timestamp,
            reshareVersion: 0,
          },
          encryptedStaticNonPMDD: encryptedBuddyStaticNonPMDD,
        };
      } else {
        metaShare = {
          encryptedSecret,
          shareId: LevelHealth.getShareId(encryptedSecret),
          meta: {
            version: version ? version : '0',
            validator: 'HEXA',
            index,
            walletId: this.walletId,
            tag,
            timestamp,
            reshareVersion: 0,
          },
          encryptedStaticNonPMDD: encryptedSocialStaticNonPMDD,
        };
      }
      metaShareArray.push(metaShare);
      index++;
    }
    this.metaShares = metaShareArray;
    
     if (level == 2 && this.metaShares.length !== config.SSS_LEVEL1_TOTAL) {
      this.metaShares = [];
      throw new Error('Something went wrong while generating metaShares');
    }

    if (level == 3 && this.metaShares.length !== config.SSS_LEVEL2_TOTAL) {
      this.metaShares = [];
      throw new Error('Something went wrong while generating metaShares');
    }

    return { metaShares: this.metaShares };
  };

  public reshareMetaShare = (index: number) => {
    this.metaShares[index].meta.reshareVersion =
    this.metaShares[index].meta.reshareVersion + 1;
    console.log({ resharing: this.metaShares[index] });
    return this.metaShares[index];
  };

  public restoreMetaShares = (
    metaShares: MetaShare[],
  ): {
    restored: Boolean;
  } => {
    if (Object.keys(metaShares).length !== 3) {
      throw new Error('Restoration requires a minimum of 3 metaShares');
    }

    this.metaShares = metaShares;

    // restoring other assets

    // restoring healthCheckInit variable
    this.healthCheckInitialized = true;

    // enriching pdf health variable if restoration is done via Personal Copy
    if (this.metaShares[3]) {
      this.createQR(3);
    }
    if (this.metaShares[4]) {
      this.createQR(4);
    }

    // replenishing shareIDs from any of the available shares
    for (const share of metaShares) {
      if (share) {
        const { decryptedStaticNonPMDD } = this.decryptStaticNonPMDD(
          share.encryptedStaticNonPMDD,
        );
        const { shareIDs } = decryptedStaticNonPMDD;
        this.shareIDs = shareIDs;
        break;
      }
    }

    return { restored: true };
  };

  public createQR = (index: number): { qrData: string[] } => {
    const splits: number = config.SSS_METASHARE_SPLITS;
    const metaString = JSON.stringify(this.metaShares[index]);
    const slice = Math.trunc(metaString.length / splits);
    const qrData: string[] = [];

    let start = 0;
    let end = slice;
    for (let itr = 0; itr < splits; itr++) {
      if (itr !== splits - 1) {
        qrData[itr] = metaString.slice(start, end);
      } else {
        qrData[itr] = metaString.slice(start);
      }
      start = end;
      end = end + slice;
      if (index === 3) {
        qrData[itr] = 'e0' + (itr + 1) + qrData[itr];
      } else if (index === 4) {
        qrData[itr] = 'c0' + (itr + 1) + qrData[itr];
      }
      if (itr === 0) {
        this.pdfHealth = {
          ...this.pdfHealth,
          [index]: {
            shareId: this.metaShares[index].shareId,
            qrData: qrData[itr],
          },
        };
      }
    }
    return { qrData };
  };

  public encryptSecrets = (
    secretsToEncrypt: string[],
    answer: string,
  ): {
    encryptedSecrets: string[];
  } => {
    const key = LevelHealth.getDerivedKey(answer);
    const shareIDs = [];
    const encryptedSecretsTmp = [];
    for (const secret of secretsToEncrypt) {
      const cipher = crypto.createCipheriv(
        LevelHealth.cipherSpec.algorithm,
        key,
        LevelHealth.cipherSpec.iv,
      );
      let encrypted = cipher.update(secret, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      encryptedSecretsTmp.push(encrypted);
      shareIDs.push(LevelHealth.getShareId(encrypted));
    }
    this.encryptedSecrets = encryptedSecretsTmp;
    this.shareIDs = shareIDs; // preserving just the online(relay-transmitted) shareIDs
    return { encryptedSecrets: this.encryptedSecrets };
  };

  public encryptWI = (
    walletImage: WalletImage,
  ): { encryptedImage: EncryptedImage } => {
    // encrypts Wallet Image
    const encKey = LevelHealth.getDerivedKey(
      bip39.mnemonicToSeedSync(this.mnemonic).toString('hex'),
    );

    const encryptedImage = {};
    for (const key of Object.keys(walletImage)) {
      const cipher = crypto.createCipheriv(
        LevelHealth.cipherSpec.algorithm,
        encKey,
        LevelHealth.cipherSpec.iv,
      ); // needs to be re-created per decryption

      let encrypted = cipher.update(
        JSON.stringify(walletImage[key]),
        'utf8',
        'hex',
      );
      encrypted += cipher.final('hex');

      encryptedImage[key] = encrypted;
    }

    return { encryptedImage };
  };

  public decryptWI = (
    encryptedImage: EncryptedImage,
  ): {
    walletImage: WalletImage;
  } => {
    const decKey = LevelHealth.getDerivedKey(
      bip39.mnemonicToSeedSync(this.mnemonic).toString('hex'),
    );

    const walletImage = {};
    for (const key of Object.keys(encryptedImage)) {
      const decipher = crypto.createDecipheriv(
        LevelHealth.cipherSpec.algorithm,
        decKey,
        LevelHealth.cipherSpec.iv,
      ); // needs to be re-created per decryption

      let decrypted = decipher.update(encryptedImage[key], 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      walletImage[key] = JSON.parse(decrypted);
    }

    return { walletImage };
  };

  public updateWalletImage = async (
    walletImage: WalletImage,
  ): Promise<{
    updated: Boolean;
  }> => {
    try {
      let res: AxiosResponse;
      try {
        const { encryptedImage } = this.encryptWI(walletImage);

        res = await BH_AXIOS.post('updateWalletImage', {
          HEXA_ID,
          walletID: this.walletId,
          encryptedImage,
        });
      } catch (err) {
        if (err.response) throw new Error(err.response.data.err);
        if (err.code) throw new Error(err.code);
      }
      const { updated } = res.data;
      if (!updated) throw new Error();

      return { updated };
    } catch (err) {
      throw new Error('Failed to update Wallet Image');
    }
  };

  public fetchWalletImage = async (): Promise<{
    walletImage: WalletImage;
  }> => {
    try {
      let res: AxiosResponse;
      try {
        res = await BH_AXIOS.post('fetchWalletImage', {
          HEXA_ID,
          walletID: this.walletId,
        });
      } catch (err) {
        if (err.response) throw new Error(err.response.data.err);
        if (err.code) throw new Error(err.code);
      }
      const { encryptedImage } = res.data;
      if (!encryptedImage) throw new Error();

      const { walletImage } = this.decryptWI(encryptedImage);
      console.log({ walletImage });
      return { walletImage };
    } catch (err) {
      throw new Error('Failed to fetch Wallet Image');
    }
  };

  public updateGuardianInMetaShare = async (
    shareId: string,
     name: string,
  ) : Promise<{
   data: MetaShare[];
  }> => {
    for (let i = 0; i < this.metaShares.length; i++) {
      const element = this.metaShares[i];
      console.log('updateGuardianInMetaShare Guardian name', name)
      if(element.shareId == shareId){
        console.log('updateGuardianInMetaShare element.shareId inside if', shareId);
        this.metaShares[i].meta.guardian = name.toLowerCase().trim();
      }
    }
    console.log('updateGuardianInMetaShare outside for', this.metaShares);
    return {data: this.metaShares};
  }
}