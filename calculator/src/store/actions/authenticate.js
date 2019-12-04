import * as types from '../types';
import authenticationConfig from '../../config/authentication'
import authorizationCode from '../../utils/authorizationCode'

export const receivedAuthorizationCode = code => {
    return { type: types.SET_AUTHORIZATION_CODE, code }
}

export const exchangingAuthorizationCode = code => {
    return { type: types.EXCHANGING_AUTHORIZATION_CODE, code }
}

export const exchangedAuthorizationCode = (code, json) => {
    return { type: types.EXCHANGED_AUTHORIZATION_CODE, code, json }
}

export const exchangingRefreshToken = refreshToken => {
    return { type: types.EXCHANGING_REFRESH_TOKEN }
}

export const exchangedRefreshToken = (refreshToken, json) => {
    return { type: types.EXCHANGED_REFRESH_TOKEN, refreshToken, json }
}

export const requestUserInfo = () => {
    return { type: types.REQUEST_USER_INFO }
}

export const receivedUserInfo = json => {
    return { type: types.RECEIVED_USER_INFO, json }
}

const refreshToken = async refreshToken => {
    const response = await fetch(
        `${authenticationConfig.oauth2_authentication_server}` +
        `${authenticationConfig.oauth2_authentication_server_token_endpoint}`, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            grant_type: 'refresh_token',
            client_id: authenticationConfig.oauth2_client_id,
            refresh_token: refreshToken,
        })
    })
    return response.json()
}

export const initializeAuth = () => {
    return (dispatch, getState) => {
        const initializer = async () => {
            let state = getState()
            const code = authorizationCode(state.authentication.state)
            const codeVerifier = state.authentication.codeVerifier
            try {
                if (!state.authentication.accessToken) {
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
                }
                dispatch(requestUserInfo())
                state = getState()
                const response = await fetch(
                    `${authenticationConfig.oauth2_authentication_server}` +
                    `${authenticationConfig.oauth2_authentication_server_verify_token_endpoint}`, {
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': state.authentication.tokenType + ' ' + state.authentication.accessToken
                    }
                })
                if (response.status === 200) {
                    //TODO: Implement OpenID Connect on YanuX Auth instead of this proprietary endpoint!
                    dispatch(receivedUserInfo(await response.json()))
                } else if (state.authentication.refreshToken) {
                    dispatch(exchangingRefreshToken(state.authentication.refreshToken))
                    dispatch(exchangedRefreshToken(state.authentication.refreshToken, await refreshToken(state.authentication.refreshToken)))
                    initializer()
                }
            } catch (err) {
                console.log('Something unexpected has happened: ', err)
            }
        }
        initializer()
    }
}