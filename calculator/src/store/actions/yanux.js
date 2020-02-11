import * as types from '../types';

export const connected = (state, proxemics) => {
    return { type: types.CONNECTED, state, proxemics }
}

export const configureComponents = componentsConfig => {
    return { type: types.CONFIGURE_COMPONENTS, componentsConfig }
}

export const instanceComponentsDistributed = instancesComponentsDistribution => {
    return { type: types.INSTANCES_COMPONENTS_DISTRIBUTED, instancesComponentsDistribution }
}