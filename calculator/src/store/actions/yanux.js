import * as types from '../types';

export const connected = (state, proxemics) => {
    return { type: types.CONNECTED, state, proxemics }
}