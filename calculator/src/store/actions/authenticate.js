import * as types from '../types';
import authenticationConfig from '../../config/authentication'

export const receivedAuthorizationCode = code => {
    return { type: types.SET_AUTHORIZATION_CODE, code }
}

export const exchangingAuthorizationCode = code => {
    return { type: types.EXCHANGING_AUTHORIZATION_CODE, code }
}

export const exchangedAuthorizationCode = (code, json) => {
    return { type: types.EXCHANGING_AUTHORIZATION_CODE, code, json }
}

export const exchangeAuthorizationCode = (code, codeVerifier) => {
    return dispatch => {
        dispatch(exchangingAuthorizationCode(code))
        return fetch(`${authenticationConfig.oauth2_authentication_server}${authenticationConfig.oauth2_authentication_server_token_endpoint}`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                grant_type: 'authorization_code',
                client_id: authenticationConfig.oauth2_client_id,
                code: code,
                code_verifier: codeVerifier,
                redirect_uri: authenticationConfig.oauth2_redirect_uri
            })
        }).then(response => response.json(), error => console.log('An error occurred.', error))
            .then(json => dispatch(exchangedAuthorizationCode(code, json)))
    }
}