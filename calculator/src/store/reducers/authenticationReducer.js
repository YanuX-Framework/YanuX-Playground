import base64url from 'base64url'
import randomBytes from 'randombytes'
import shajs from 'sha.js'

import authenticationConfig from '../../config/authentication'
import * as types from '../types'

const codeVerifier = sessionStorage.getItem('code_verifier') ? sessionStorage.getItem('code_verifier') : base64url(randomBytes(32))
const state = sessionStorage.getItem('state') ? sessionStorage.getItem('state') : base64url(randomBytes(16))
const code_challenge = base64url.fromBase64(shajs('sha256').update(codeVerifier).digest('base64'))
sessionStorage.setItem('code_verifier', codeVerifier)
sessionStorage.setItem('state', state)

const initialState = {
    codeVerifier,
    state,
    loginUrl: `${authenticationConfig.oauth2_authentication_server}` +
        `${authenticationConfig.oauth2_authentication_server_authorization_endpoint}?` +
        `client_id=${authenticationConfig.oauth2_client_id}&` +
        `response_type=code&` +
        `redirect_uri=${authenticationConfig.oauth2_redirect_uri}&` +
        `code_challenge=${code_challenge}&` +
        `code_challenge_method=S256&` +
        `state=${state}`,
    authTimestamp: localStorage.getItem('auth_timestamp'),
    expiresIn: localStorage.getItem('auth_expires_in'),
    accessToken: localStorage.getItem('access_token'),
    refreshToken: localStorage.getItem('refresh_token'),
    tokenType: localStorage.getItem('token_type'),
    error: null,
    errorDescription: null,
    user: {}
}

export default (state = initialState, action) => {
    switch (action.type) {
        case types.SET_AUTHORIZATION_CODE:
            state.authorizationCode = action.code
            return Object.assign({}, state);
        /*case types.EXCHANGING_REFRESH_TOKEN:
            state.authTimestamp = null
            state.expiresIn = null
            state.accessToken = null
            state.refreshToken = null
            state.tokenType = null
            localStorage.removeItem('auth_timestamp')
            localStorage.removeItem('auth_expires_in')
            localStorage.removeItem('access_token')
            localStorage.removeItem('refresh_token')
            localStorage.removeItem('token_type')
            return Object.assign({}, state);*/
        case types.EXCHANGED_AUTHORIZATION_CODE:
        case types.EXCHANGED_REFRESH_TOKEN:
            //Check if all information needed is available
            if (!action.json.error &&
                action.json.expires_in &&
                action.json.access_token &&
                action.json.refresh_token &&
                action.json.token_type) {
                //Store it into the application state
                state.authTimestamp = Math.floor(Date.now() / 1000);
                state.expiresIn = action.json.expires_in
                state.accessToken = action.json.access_token
                state.refreshToken = action.json.refresh_token
                state.tokenType = action.json.token_type
                //Persist it into Local Storage
                localStorage.setItem('auth_timestamp', state.authTime)
                localStorage.setItem('auth_expires_in', state.expiresIn)
                localStorage.setItem('access_token', state.accessToken)
                localStorage.setItem('refresh_token', state.refreshToken)
                localStorage.setItem('token_type', state.tokenType)
            } else {
                //If there was an error save it for further processing
                state.error = action.json.error
                state.errorDescription = action.json.error_description
            }
            return Object.assign({}, state);
        case types.RECEIVED_USER_INFO:
            state.user = action.json.response.user
            return Object.assign({}, state);
        default:
            return state
    }
}
