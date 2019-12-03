import Cookies from 'js-cookie'
import base64url from 'base64url'
import randomBytes from 'randombytes'
import shajs from 'sha.js'

import authenticationConfig from '../../config/authentication'
import * as types from '../types';

const codeVerifier = Cookies.get('code_verifier') ? Cookies.get('code_verifier') : base64url(randomBytes(32))
const state = Cookies.get('state') ? Cookies.get('state') : base64url(randomBytes(16))
const code_challenge = base64url.fromBase64(shajs('sha256').update(codeVerifier).digest('base64'))
Cookies.set('code_verifier', codeVerifier)
Cookies.set('state', state)

let initialState = {
    codeVerifier,
    state,
    loginUrl: `${authenticationConfig.oauth2_authentication_server}`+
              `${authenticationConfig.oauth2_authentication_server_authorization_endpoint}?`+
              `client_id=${authenticationConfig.oauth2_client_id}&`+
              `response_type=code&`+
              `redirect_uri=${authenticationConfig.oauth2_redirect_uri}&`+
              `code_challenge=${code_challenge}&`+
              `code_challenge_method=S256&`+
              `state=${state}`,
    user: {}
}

export default (state = initialState, action) => {
    switch (action.type) {
        case types.SET_AUTHORIZATION_CODE:
            state.authorizationCode = action.code
            return state
        default:
            return state
    }
}
