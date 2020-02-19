import * as types from '../types';
import authenticationConfig from '../../config/authentication'
import CustomError from '../../utils/CustomError'
import extractAuthorizationCode from '../../utils/extractAuthorizationCode'
import extractIdToken from '../../utils/extractIdToken'

export const receivedIdToken = json => {
    return { type: types.SET_ID_TOKEN, json }
}

export const receivedAuthorizationCode = code => {
    return { type: types.SET_AUTHORIZATION_CODE, code }
}

export const logout = (error) => {
    return { type: types.LOGOUT, error }
}

export const readyToConnect = accessToken => {
    return { type: types.READY_TO_CONNECT, accessToken }
}

export const exchangingAuthorizationCode = code => {
    return { type: types.EXCHANGING_AUTHORIZATION_CODE, code }
}

export const exchangedAuthorizationCode = (code, json) => {
    return { type: types.EXCHANGED_AUTHORIZATION_CODE, code, json }
}

export const exchangingRefreshToken = () => {
    return { type: types.EXCHANGING_REFRESH_TOKEN }
}

export const exchangedRefreshToken = (refreshToken, json) => {
    return { type: types.EXCHANGED_REFRESH_TOKEN, refreshToken, json }
}

export const initializeAuth = () => {
    return (dispatch, getState) => {
        const connect = () => {
            const state = getState()
            if (state.authentication.accessToken) {
                dispatch(readyToConnect(state.authentication.accessToken))
            }
        }
        const initializer = async () => {
            let state = getState()
            try {
                const idToken = state.authentication.idToken ? state.authentication.idToken : await extractIdToken(state.authentication.nonce)
                if (idToken) {
                    dispatch(receivedIdToken(idToken))
                    const code = extractAuthorizationCode(state.authentication.state)
                    const codeVerifier = state.authentication.codeVerifier
                    if (!state.authentication.accessToken && code && codeVerifier) {
                        dispatch(exchangingAuthorizationCode(code))
                        const response = await fetch(
                            `${authenticationConfig.oauth2_authentication_server}` +
                            `${authenticationConfig.oauth2_authentication_server_token_endpoint}`, {
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
                        })
                        dispatch(exchangedAuthorizationCode(code, await response.json()))
                        connect()
                    } else { connect() }
                } else { throw new CustomError('NotAuthenticated', 'User not authenticated.') }
            } catch (err) {
                console.log('Something unexpected has happened: ', err)
                dispatch(logout(err))
            }
        }
        initializer()
    }
}