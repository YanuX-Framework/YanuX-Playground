
import thunkMiddleware from 'redux-thunk'
import { createLogger } from 'redux-logger'
import { createStore, combineReducers, applyMiddleware, compose } from 'redux';
import authenticationReducer from './reducers/authenticationReducer'
import calculateReducer from './reducers/calculateReducer'
import yanuxCoordinatorReducer from './reducers/yanuxCoordinatorReducer'

import yanuxCoordinatorSyncMiddleware from './middleware/yanuxCoordinatorSync'


const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

const loggerMiddleware = createLogger()

const rootReducer = combineReducers({
  authentication: authenticationReducer,
  calculator: calculateReducer,
  yanuxCoordinator: yanuxCoordinatorReducer
})

export default createStore(
  rootReducer,
  composeEnhancers(
    applyMiddleware(
      thunkMiddleware,
      loggerMiddleware,
      yanuxCoordinatorSyncMiddleware
    )
  )
)

export const getExpression = state => {
  return state.calculator.expression
}

export const getTotal = state => {
  return state.calculator.total
}

export const getLoginUrl = state => {
  return state.authentication.loginUrl
}

export const getAuthenticationError = state => {
  return state.authentication.error
}

export const getCodeVerifier = state => {
  return state.authentication.codeVerifier
}

export const getIdToken = state => {
  return state.authentication.idToken;
}

