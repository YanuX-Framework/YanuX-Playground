import React, { Component } from 'react'
import { connect } from 'react-redux'
import { calculate, deleteLastEntry, clear, evaluateExpression } from './store/actions/calculate'
import Authentication from './components/authentication'
import Calculator from './components/calculator'
import * as stateStore from './store'
import './App.css'

export class App extends Component {
  componentDidMount() {
    console.log('mounted calculator!');
  }

  render() {
    return (
      <React.Fragment>
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

const mapStateToProps = (state) => {
  return {
    loginUrl: stateStore.getLoginUrl(state),
    expression: stateStore.getExpression(state),
    total: stateStore.getTotal(state)
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    calculate: (buttonKey) => {
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