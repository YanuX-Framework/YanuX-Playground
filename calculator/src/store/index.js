
import thunkMiddleware from 'redux-thunk'
import { createLogger } from 'redux-logger'
import { createStore, combineReducers, applyMiddleware, compose } from 'redux';
import authenticationReducer from './reducers/authenticationReducer'
import calculateReducer from './reducers/calculateReducer'
import yanuxCoordinatorReducer from './reducers/yanuxCoordinatorReducer'

import yanuxCoordinatorMiddleware from './middleware/yanuxCoordinatorMiddleware'

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

//TODO: WARNING: Temporarily disabling console logging for better performance.
//console.log = function(){}
//console.debug = function(){}
//console.warn = function(){}
//console.error = function(){}

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
      yanuxCoordinatorMiddleware
    )
  )
)

export const getLoginUrl = state => {
  return state.authentication.loginUrl
}

export const getIdToken = state => {
  return state.authentication.idToken;
}

export const getAuthenticationError = state => {
  return state.authentication.error
}

export const getCoordinator = state => {
  return state.yanuxCoordinator.coordinator
}

export const getSubscribedResourceId = state => {
  return getCoordinator(state) ? getCoordinator(state).subscribedResourceId : null;
}

export const getResources = state => {
  return state.yanuxCoordinator.resources
}

export const getComponentsRuleEngine = state => {
  return state.yanuxCoordinator.componentsRuleEngine
}

export const getComponentsConfig = state => {
  return state.yanuxCoordinator.componentsConfig
}

export const getInstancesComponentsDistribution = state => {
  return state.yanuxCoordinator.instancesComponentsDistribution
}

export const isCoordinatorReady = state => {
  return state.yanuxCoordinator.connected
}

export const getExpression = state => {
  return state.calculator.expression
}

export const getTotal = state => {
  return state.calculator.total
}