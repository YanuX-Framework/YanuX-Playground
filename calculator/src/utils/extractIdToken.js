import authenticationConfig from '../config/authentication'
import queryString from 'query-string'
import { KEYUTIL, KJUR, b64utoutf8 } from 'jsrsasign'

export default async (nonce) => {
    const parameters = queryString.parse(window.location.hash);
    const idToken = parameters.id_token
    if (idToken) {
        const idTokenSegments = idToken.split(".")
        const header = KJUR.jws.JWS.readSafeJSONString(b64utoutf8(idTokenSegments[0]))
        const payload = KJUR.jws.JWS.readSafeJSONString(b64utoutf8(idTokenSegments[1]))
        if (header.jku && header.jku.startsWith(authenticationConfig.oauth2_authentication_server) && header.kid) {
            try {
                const json = await (await fetch(header.jku)).json()
                const key = (json.keys || []).find(k => header.kid === k.kid)
                if (key && payload.nonce && nonce === payload.nonce &&
                    KJUR.jws.JWS.verifyJWT(idToken, KEYUTIL.getKey(key), { alg: [header.alg], gracePeriod: 1 * 60 * 60 })) {
                    localStorage.setItem('id_token', idToken)
                    console.log('Payload:', payload);
                    return payload
                }
            } catch (e) { throw new Error('Could not extract the ID Token.') }
        }
        return false;
    }
}