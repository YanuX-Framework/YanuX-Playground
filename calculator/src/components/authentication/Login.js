import './Login.css'
import React, { Component } from 'react'

export default class Login extends Component {
    componentDidMount() {
        this.props.initializeAuth()
    }
    componentDidUpdate() {
        if (this.props.authenticationError) {
            if (this.props.authenticationError.name === 'NotAuthenticated') {
                alert('You are not authenticated. Please login to use the application.')
            } else if (this.props.authenticationError.message) {
                alert(this.props.authenticationError.message)
            } else {
                alert('Something wrong has happened with your authentication. Please try to authenticate again.')
            }
        }
    }
    render() {
        if (this.props.idToken && this.props.idToken.email) {
            return (
                <div className="login">
                    <button type="button" className="header-button" onClick={() => this.props.logout()}>
                        Logout: {this.props.idToken.email}
                    </button>
                </div>
            )
        } else { return (<div className="login"><a className="header-button" href={this.props.loginUrl}>Login</a></div>) }
    }
}