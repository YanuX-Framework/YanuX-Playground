import React from 'react'

export default class Coordinator extends React.Component {
    componentDidUpdate(prevProps) {
        const coordinator = this.props.coordinator
        if (coordinator && !prevProps.coordinator) {
            coordinator.init().then(results => {
                const initialState = results[0];
                const initialProxemics = results[1];
                console.log('Connected to YanuX Broker')
                console.log('Initial State', initialState)
                console.log('Initial Proxemics', initialProxemics)
                resourceSubscriptionHandler(this)(initialState)
                this.props.connected(initialState, initialProxemics)
            }).catch(err => {
                console.error('Error Connecting to YanuX Broker', err)
                this.props.logout()
            })
            coordinator.subscribeResource(resourceSubscriptionHandler(this))
            coordinator.subscribeProxemics(proxemicsSubscriptionHandler(this))
            coordinator.subscribeInstances(instancesSubscriptionHandler(this))
            coordinator.subscribeEvents(eventsSubcriptionHandler(this))
            coordinator.subscribeReconnects(reconnectSubscriptionHandler(this))
        }
    }
    render() {
        if (!this.props.isCoordinatorReady) {
            return (
                <div className="overlay">
                    {this.props.idToken ? <div className="text">Loading</div> : null}
                </div>
            )
        } else { return null }
    }
}

const updateState = (component, data) => {
    if (component.props.expression !== data.expression ||
        component.props.total !== data.total) {
        console.log(
            'Props Expression:', component.props.expression,
            'Data Expression:', data.expression,
            'Props Total:', component.props.total,
            'Data Total:', data.total
        )
        component.props.setValues(data.expression || '', data.total || '0')
    }
}

const updateComponents = (component) => {
    const coordinator = component.props.coordinator
    const componentsRuleEngine = component.props.componentsRuleEngine
    // TODO: Finish this!
    if (coordinator && componentsRuleEngine) {
        coordinator.getActiveInstances().then(activeInstances => {
            const proxemics = coordinator.proxemics.state
            componentsRuleEngine.proxemics = proxemics
            componentsRuleEngine.instances = activeInstances
            componentsRuleEngine.run()
                .then(res => console.log('[Components Rule Engine] Result:', res))
                .catch(err => console.error('[Components Rule Engine] Error:', err))
        }).catch(err => console.error(err));
    }
}

const resourceSubscriptionHandler = component => (data, eventType) => {
    console.log(
        'Resource Subscriber Handler Data:', data,
        'Event Type:', eventType
    )
    updateState(component, data)
}

const proxemicsSubscriptionHandler = component => (data, eventType) => {
    console.log(
        'Proxemics Subscriber Handler Data:', data,
        'Event Type:', eventType
    )
    updateComponents(component)
}

const instancesSubscriptionHandler = component => (data, eventType) => {
    console.log(
        'Inatances Subscription Handler Data:', data,
        'Event Type:', eventType
    )
    updateComponents(component)
}

const eventsSubcriptionHandler = component => (data, eventType) => {
    console.log(
        'Events Subscription Handler Data:', data,
        'Event Type:', eventType
    )
}

const reconnectSubscriptionHandler = component => (state, proxemics) => {
    console.log(
        'Reconnect Subscription Handler State:', state,
        'Proxemics:', proxemics
    )
    updateState(component, state)
}