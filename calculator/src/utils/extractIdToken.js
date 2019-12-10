import authenticationConfig from '../config/authentication'
import queryString from 'query-string'
import { KJUR, b64utoutf8 } from 'jsrsasign'

export default async (nonce) => {
    const parameters = queryString.parse(window.location.hash);
    const idToken = parameters.id_token
    if (idToken) {
        //console.log('ID Token', idToken)
        const idTokenSegments = idToken.split(".")
        const header = KJUR.jws.JWS.readSafeJSONString(b64utoutf8(idTokenSegments[0]))
        //console.log('Header', header)
        const payload = KJUR.jws.JWS.readSafeJSONString(b64utoutf8(idTokenSegments[1]))
        //console.log('Payload', payload)
        const publicKey = await (await fetch(
            `${authenticationConfig.oauth2_authentication_server}` +
            `${authenticationConfig.oauth2_authentication_server_public_key_endpoint}`)).text()
        //console.log('Public Key', publicKey)
        if (payload.nonce &&
            nonce === payload.nonce &&
            KJUR.jws.JWS.verifyJWT(idToken, publicKey, { alg: [header.alg] })) {
            localStorage.setItem('id_token', idToken)
            return payload
        }
    }
}