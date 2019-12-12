export const resourceSubscriptionHandler = (data, eventType) => {
    console.log('Resource Subscriber Handler Data:', data, 'Event Type', eventType)
}

export const proxemicsSubscriptionHandler = (data, eventType) => {
    console.log('Proxemics Subscriber Handler Data:', data, 'Event Type', eventType)
}

export const instancesSubscriptionHandler = (data, eventType) => {
    console.log('Inatances Subscription Handler Data:', data, 'Event Type', eventType)
}

export const eventsSubcriptionHandler = (data, eventType) => {
    console.log('Events Subscription Handler Data:', data, 'Event Type', eventType)
}