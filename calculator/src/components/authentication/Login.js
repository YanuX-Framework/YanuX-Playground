import React, { Component } from 'react';

export default class Login extends Component {
    render() {
        return (
            <div className="login">
                <a href={this.props.loginUrl}>Login</a>
            </div>
        )
    }
}