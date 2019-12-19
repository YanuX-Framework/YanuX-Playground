import React, { Component } from 'react'
import { connect } from 'react-redux'
import { setValues, calculate, deleteLastEntry, clear, evaluateExpression } from './store/actions/calculate'
import { initializeAuth, logout } from './store/actions/authenticate'
import { connected } from './store/actions/yanux'

import Authentication from './components/authentication'
import Calculator from './components/calculator'
import Yanux from './components/yanux'

import * as store from './store'
import './App.css'

export class App extends Component {
  componentDidMount() {
    console.log('mounted calculator!');
  }
  render() {
    return (
      <React.Fragment>
        <Yanux.Coordinator {...this.props} />
        <div className="header">
          <Authentication.Login {...this.props} />
        </div>
        <div className="calculator">
          <Calculator.Screen {...this.props} />
          <Calculator.Keypad {...this.props} />
        </div>
      </React.Fragment>
    );
  }
}

const mapStateToProps = state => {
  return {
    loginUrl: store.getLoginUrl(state),
    idToken: store.getIdToken(state),
    authenticationError: store.getAuthenticationError(state),
    isCoordinatorReady: store.isCoordinatorReady(state),
    coordinator: store.getCoordinator(state),
    componentsRuleEngine: store.getComponentsRuleEngine(state),
    expression: store.getExpression(state),
    total: store.getTotal(state)
  }
}

const mapDispatchToProps = dispatch => {
  return {
    initializeAuth: (authCode, codeVerifier) => {
      dispatch(initializeAuth(authCode, codeVerifier))
    },
    logout: () => {
      dispatch(logout())
    },
    connected: (state, proxemics) => {
      dispatch(connected(state, proxemics))
    },
    setValues: (expression, total) => {
      dispatch(setValues(expression, total))
    },
    calculate: buttonKey => {
      dispatch(calculate(buttonKey))
    },
    delete: () => {
      dispatch(deleteLastEntry())
    },
    clear: () => {
      dispatch(clear())
    },
    evaluate: () => {
      dispatch(evaluateExpression())
    },
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(App);