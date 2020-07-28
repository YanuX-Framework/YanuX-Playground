import * as types from '../types'

import {
    FeathersCoordinator,
    Credentials,
    ComponentsRuleEngine,
    InstancesComponentsDistribution
} from '@yanux/coordinator'

import queryString from 'query-string'

import yanuxBrokerConfig from '../../config/yanuxBroker'
import yanuxCoordinatorConfig from '../../config/yanuxCoordinator'

window.queryString = queryString
const parameters = queryString.parse(window.location.hash);
let localDeviceUrl = parameters.local_device_url ? parameters.local_device_url : sessionStorage.getItem('local_device_url')
localDeviceUrl = localDeviceUrl ? localDeviceUrl : yanuxBrokerConfig.local_device_url
sessionStorage.setItem('local_device_url', localDeviceUrl)

const initialState = {
    connected: false,
    coordinator: null,
    componentsRestrictions: yanuxCoordinatorConfig.components_restrictions,
    localDeviceUrl
}

export default (state = initialState, action) => {
    switch (action.type) {
        case types.LOGOUT:
            return Object.assign({}, initialState);
        case types.READY_TO_CONNECT:
            return Object.assign({}, state, {
                coordinator: new FeathersCoordinator(
                    yanuxBrokerConfig.broker_url,
                    state.localDeviceUrl,
                    yanuxBrokerConfig.app,
                    new Credentials('yanux', [
                        action.accessToken,
                        yanuxBrokerConfig.app
                    ])
                )
            })
        case types.CONNECTED:
            return Object.assign({}, state, {
                connected: true,
                componentsRuleEngine: new ComponentsRuleEngine(
                    state.coordinator.instance.instanceUuid,
                    state.coordinator.device.deviceUuid,
                    state.componentsRestrictions
                )
            })
        case types.RESOURCES_RETRIEVED:
            return Object.assign({}, state, { resources: action.resources })
        case types.CONFIGURE_COMPONENTS:
            return Object.assign({}, state, { componentsConfig: action.componentsConfig })
        case types.INSTANCES_COMPONENTS_DISTRIBUTED:
            //TODO: Perhaps this conversion from plain instances to InstancesComponentsDistribution could be done internally by the (Feathers)Coordinator.
            return Object.assign({}, state, {
                instancesComponentsDistribution: new InstancesComponentsDistribution(
                    action.instancesComponentsDistribution
                )
            })
        default:
            return state
    }
}
