import React, { Component } from 'react'

export default class Login extends Component {
    componentDidMount() {
        this.props.initializeAuth()
    }
    componentDidUpdate() {
        if (this.props.authError.error) {
            alert('Please try to login again.')
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