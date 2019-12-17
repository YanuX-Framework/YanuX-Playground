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
            }).catch(err => { console.error('Error Connecting to YanuX Broker', err) })
            coordinator.subscribeResource(resourceSubscriptionHandler(this))
            coordinator.subscribeProxemics(proxemicsSubscriptionHandler(this))
            coordinator.subscribeInstances(instancesSubscriptionHandler(this))
            coordinator.subscribeEvents(eventsSubcriptionHandler(this))
        }
    }
    render() { return null }
}

const resourceSubscriptionHandler = component => (data, eventType) => {
    console.log(
        'Resource Subscriber Handler Data:', data,
        'Event Type', eventType
    )
    if (component.props.expression !== data.expression ||
        component.props.total !== data.total) {
        console.log(
            'Props Expression:', component.props.expression,
            'Data Expression:', data.expression,
            'Props Total:', component.props.total,
            'Data Total:', data.total
        )
        component.props.setValues(data.expression, data.total)
    }
}

const proxemicsSubscriptionHandler = component => (data, eventType) => {
    console.log('Proxemics Subscriber Handler Data:', data, 'Event Type', eventType)
}

const instancesSubscriptionHandler = component => (data, eventType) => {
    console.log('Inatances Subscription Handler Data:', data, 'Event Type', eventType)
}

const eventsSubcriptionHandler = component => (data, eventType) => {
    console.log('Events Subscription Handler Data:', data, 'Event Type', eventType)
}