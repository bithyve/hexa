import axios from 'axios'
import config from '../bitcoin/HexaConfig'

const URL = config.FBTC_URL

export const accountSync = ( data ) =>
  axios( {
    method: 'get',
    url: URL + 'account-sync/' + config.WALLET_SLUG + '/' + data.userKey, // wallet_slug/user_key',
  } )

export const getQuote = ( data ) =>
  axios( {
    method: 'post',
    url: URL + 'quote',
    data,
  } )

export const executeOrder = ( data ) =>
  axios( {
    method: 'post',
    url: URL + 'execute',
    data,
  } )
