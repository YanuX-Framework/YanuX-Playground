import Cookies from 'js-cookie'
import base64url from 'base64url';
import randomBytes from 'randombytes'
import shajs from 'sha.js';


const code_verifier = Cookies.get('code_verifier') ? Cookies.get('code_verifier') : base64url(randomBytes(32))
const state = Cookies.get('state') ? Cookies.get('state') : base64url(randomBytes(16))
const code_challenge = base64url.fromBase64(shajs('sha256').update(code_verifier).digest('base64'))
document.cookie = Cookies.set('code_verifier', code_verifier);
document.cookie = Cookies.set('state', state);

let initialState = {
    code_verifier,
    state,
    loginUrl: `http://${window.location.hostname}:3001/oauth2/authorize?client_id=yanux-calculator&response_type=code&redirect_uri=${window.location.href}&code_challenge=${code_challenge}&code_challenge_method=S256`
}

export default (state = initialState, action) => {
    switch (action.type) {
        default:
            return state
    }
}
