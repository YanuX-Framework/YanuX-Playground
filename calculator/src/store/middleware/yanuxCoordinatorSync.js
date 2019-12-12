export default store => next => action => {
    console.log('[YanuX Coordinator Sync Middleware]', action)
    console.log('[YCSM] Dispatching', action)
    let result = next(action)
    const state = store.getState()
    console.log('[YCSM] Next State', state)
    if (state.yanuxCoordinator.coordinator && state.yanuxCoordinator.coordinator.isConnected()) {
        state.yanuxCoordinator.coordinator.setResourceData({
            expression: state.calculator.expression,
            total: state.calculator.total
        })
    }
    return result
}