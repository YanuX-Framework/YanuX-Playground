import React, { Component } from 'react'
import { connect } from 'react-redux'
import { setValues, calculate, deleteLastEntry, clear, evaluateExpression } from './store/actions/calculate'
import { initializeAuth, logout } from './store/actions/authenticate'
import { connected, resourcesRetrieved, configureComponents, instanceComponentsDistributed } from './store/actions/yanux'

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
        <div className="fillscreen">
          <div className="header">
            <Authentication.Login {...this.props} />
          </div>
          <div className="calculator">
            <Calculator.Screen {...this.props} />
            <Calculator.Keypad {...this.props} />
          </div>
          <div className="info">
            &#x2193; Scroll down to manage resources and devices &#x2193;
          </div>
        </div>
        <Yanux.Coordinator {...this.props} />
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
    subscribedResourceId: store.getSubscribedResourceId(state),
    resources: store.getResources(state),
    componentsRuleEngine: store.getComponentsRuleEngine(state),
    componentsConfig: store.getComponentsConfig(state),
    instancesComponentsDistribution: store.getInstancesComponentsDistribution(state),
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
    resourcesRetrieved: resources => {
      dispatch(resourcesRetrieved(resources))
    },
    configureComponents: config => {
      dispatch(configureComponents(config))
    },
    instanceComponentsDistributed: config => {
      dispatch(instanceComponentsDistributed(config))
    },
    setValues: (expression, total) => {
      dispatch(setValues(expression || '', total || 0))
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