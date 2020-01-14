import * as types from '../types'

import {
    FeathersCoordinator,
    Credentials,
    ComponentsRuleEngine
} from '@yanux/coordinator'

import queryString from 'query-string'

import yanuxBrokerConfig from '../../config/yanuxBroker'
import yanuxCoordinatorConfig from '../../config/yanuxCoordinator'

const parameters = queryString.parse(window.location.hash);

const initialState = {
    connected: false,
    coordinator: null,
    componentsRestrictions: yanuxCoordinatorConfig.components_restrictions,
    localDeviceUrl: parameters.local_device_url
}

export default (state = initialState, action) => {
    switch (action.type) {
        case types.LOGOUT:
            return Object.assign({}, initialState);
        case types.READY_TO_CONNECT:
            state.coordinator = new FeathersCoordinator(
                yanuxBrokerConfig.broker_url,
                state.localDeviceUrl ? state.localDeviceUrl : yanuxBrokerConfig.local_device_url,
                yanuxBrokerConfig.app,
                new Credentials('yanux', [
                    action.accessToken,
                    yanuxBrokerConfig.app
                ])
            )
            return Object.assign({}, state);
        case types.CONNECTED:
            state.componentsRuleEngine = new ComponentsRuleEngine(state.coordinator.device.deviceUuid, state.componentsRestrictions)
            return Object.assign({}, state, {
                connected: true
            })
        case types.CONFIGURE_COMPONENTS:
            state.componentsConfig = action.componentsConfig
            return Object.assign({}, state)
        default:
            return state
    }
}
