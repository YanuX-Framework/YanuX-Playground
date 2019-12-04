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
        if (this.props.user.email) {
            return (
                <div className="login">
                    <button type="button" className="link-button" onClick={() => console.log('The link was clicked.')}>
                        Logout: {this.props.user.email}
                    </button>
                </div>
            )
        } else { return (<div className="login"><a href={this.props.loginUrl}>Login</a></div>) }
    }
}