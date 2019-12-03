import React, { Component } from 'react'
import authorizationCode from '../../utils/authorizationCode'

export default class Login extends Component {
    componentDidMount() {
        const authCode = authorizationCode(this.props.authState)
        if (authCode) { this.props.exchangeAuthorizationCode(authCode, this.props.codeVerifier) }
    }
    render() {
        if (this.props.user.id) {
            return (
                <div className="login">
                    <button type="button" className="link-button" onClick={() => console.log('The link was clicked.')}>
                        Logout: {this.props.user.id}
                    </button>
                </div>
            )
        } else { return (<div className="login"><a href={this.props.loginUrl}>Login</a></div>) }
    }
}