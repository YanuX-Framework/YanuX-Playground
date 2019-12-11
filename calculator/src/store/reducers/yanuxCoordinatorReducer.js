import { FeathersCoordinator, Credentials, ComponentsRuleEngine } from '@yanux/coordinator'

import * as types from '../types'
import yanuxBrokerConfig from '../../config/yanuxBroker'


const initialState = {}

window.coord = null

export default (state = initialState, action) => {
    switch (action.type) {
        case types.READY_TO_CONNECT:
            window.coord = new FeathersCoordinator(
                yanuxBrokerConfig.broker_url,
                yanuxBrokerConfig.local_device_url,
                yanuxBrokerConfig.app,
                new Credentials('yanux', [
                    action.accessToken,
                    yanuxBrokerConfig.app
                ])
            )
            window.coord.init().then(results => {
                console.log('Connected to YanuX Broker', results)
            }).catch(err => {
                console.error('Error Connecting to YanuX Broker', err)
            })
            return state;
        default:
            return state
    }
}
