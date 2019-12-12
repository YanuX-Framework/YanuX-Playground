import * as types from '../types'

import {
    FeathersCoordinator,
    Credentials,
    /*ComponentsRuleEngine*/
} from '@yanux/coordinator'

import yanuxBrokerConfig from '../../config/yanuxBroker'

import {
    resourceSubscriptionHandler,
    proxemicsSubscriptionHandler,
    instancesSubscriptionHandler,
    eventsSubcriptionHandler
} from '../actions/yanuxCoordinator'

const initialState = { coordinator: null }

export default (state = initialState, action) => {
    switch (action.type) {
        case types.READY_TO_CONNECT:
            state.coordinator = new FeathersCoordinator(
                yanuxBrokerConfig.broker_url,
                yanuxBrokerConfig.local_device_url,
                yanuxBrokerConfig.app,
                new Credentials('yanux', [
                    action.accessToken,
                    yanuxBrokerConfig.app
                ])
            )
            state.coordinator.init().then(results => {
                const initialState = results[0];
                const initialProxemics = results[1];
                console.log('Connected to YanuX Broker')
                console.log('Initial State', initialState)
                console.log('Initial Proxemics', initialProxemics)
            }).catch(err => { console.error('Error Connecting to YanuX Broker', err) })
            state.coordinator.subscribeResource(resourceSubscriptionHandler)
            state.coordinator.subscribeProxemics(proxemicsSubscriptionHandler)
            state.coordinator.subscribeInstances(instancesSubscriptionHandler)
            state.coordinator.subscribeEvents(eventsSubcriptionHandler)
            return Object.assign({}, state);
        default:
            return state
    }
}
