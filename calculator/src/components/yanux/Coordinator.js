import React from 'react'

export default class Coordinator extends React.Component {

    constructor(props) {
        super(props)
        this.yanuxCoordinatorResourceSubscriptionHandler = this.__resourceSubscriptionHandler()
        this.yanuxCoordinatorProxemicsSubscriptionHandler = this.__proxemicsSubscriptionHandler()
        this.yanuxCoordinatorInstancesSubscriptionHandler = this.__instancesSubscriptionHandler()
        this.yanuxCoordinatorEventsSubcriptionHandler = this.__eventsSubcriptionHandler()
        this.yanuxCoordinatorReconnectSubscriptionHandler = this.__reconnectSubscriptionHandler()

        this.yanuxResourceManagementRef = React.createRef();
        this.yanuxResourceManagementResourceSelected = this.__resourceSelected()
        this.yanuxResourceManagementCreateResource = this.__createResource()
        this.yanuxResourceManagementShareResource = this.__shareResource()
        this.yanuxResourceManagementDeleteResource = this.__deleteResource()

        this.yanuxComponentsDistributionRef = React.createRef()
        this.yanuxComponentsDistributionUpdatedComponentsDistribution = this.__updatedComponentsDistribution()
        this.yanuxComponentsDistributionResetAutoComponentsDistribution = this.__resetAutoComponentsDistribution()
    }

    componentDidUpdate(prevProps) {
        const coordinator = this.props.coordinator
        if (coordinator && !prevProps.coordinator) {
            coordinator.init().then(results => {
                const initialState = results[0];
                const initialProxemics = results[1];
                console.log('Connected to YanuX Broker')
                console.log('Initial State', initialState)
                console.log('Initial Proxemics', initialProxemics)
                this.yanuxCoordinatorResourceSubscriptionHandler(initialState)
                this.props.connected(initialState, initialProxemics)
                this.updateResources()
                this.updateComponents()
            }).catch(err => {
                console.error('Error Connecting to YanuX Broker', err)
                this.props.logout()
            })
            coordinator.subscribeResource(this.yanuxCoordinatorResourceSubscriptionHandler)
            coordinator.subscribeProxemics(this.yanuxCoordinatorProxemicsSubscriptionHandler)
            coordinator.subscribeInstances(this.yanuxCoordinatorInstancesSubscriptionHandler)
            coordinator.subscribeEvents(this.yanuxCoordinatorEventsSubcriptionHandler)
            coordinator.subscribeReconnects(this.yanuxCoordinatorReconnectSubscriptionHandler)
        }

        if (this.yanuxResourceManagementRef.current) {
            this.yanuxResourceManagementRef.current.addEventListener(
                'resource-selected',
                this.yanuxResourceManagementResourceSelected
            )
            this.yanuxResourceManagementRef.current.addEventListener(
                'create-resource',
                this.yanuxResourceManagementCreateResource
            )
            this.yanuxResourceManagementRef.current.addEventListener(
                'share-resource',
                this.yanuxResourceManagementShareResource
            )
            this.yanuxResourceManagementRef.current.addEventListener(
                'delete-resource',
                this.yanuxResourceManagementDeleteResource
            )
        }

        if (this.yanuxComponentsDistributionRef.current) {
            this.yanuxComponentsDistributionRef.current.addEventListener(
                'updated-components-distribution',
                this.yanuxComponentsDistributionUpdatedComponentsDistribution
            )
            this.yanuxComponentsDistributionRef.current.addEventListener(
                'reset-auto-components-distribution',
                this.yanuxComponentsDistributionResetAutoComponentsDistribution
            )
        }
    }
    componentWillUnmount() {
        if (this.yanuxComponentsDistributionRef.current) {
            this.yanuxComponentsDistributionRef.current.removeEventListener(
                'updated-components-distribution',
                this.yanuxComponentsDistributionUpdatedComponentsDistribution
            )
            this.yanuxComponentsDistributionRef.current.removeEventListener(
                'reset-auto-components-distribution',
                this.yanuxComponentsDistributionResetAutoComponentsDistribution
            )
        }
    }
    render() {
        if (!this.props.isCoordinatorReady) {
            return (
                <div className="overlay">
                    {this.props.idToken ? <div className="text">Loading</div> : null}
                </div>
            )
        } else {
            return (
                <React.Fragment>
                    <div class="resource-management">
                        <yanux-resource-management
                            ref={this.yanuxResourceManagementRef}
                            resourceId={this.props.resourceId || this.props.coordinator.resource.id}
                            resources={JSON.stringify(this.props.resources)} />
                    </div>
                    <div className="components-distribution">
                        <yanux-components-distribution
                            ref={this.yanuxComponentsDistributionRef}
                            instanceId={this.props.coordinator.instance.id}
                            componentsDistribution={JSON.stringify(this.props.instancesComponentsDistribution)} />
                    </div>
                </React.Fragment>
            )
        }
    }

    updateResources() {
        const coordinator = this.props.coordinator
        if (coordinator) {
            coordinator.getResources()
                .then(resources => {
                    console.log('[YXCRM] YanuX Coordinator Resources:', resources)
                    this.props.resourcesRetrieved(resources)
                }).catch(err => console.log(err))
        }
    }

    updateState(data) {
        if (this.props.expression !== data.expression ||
            this.props.total !== data.total) {
            console.log(
                'Props Expression:', this.props.expression,
                'Data Expression:', data.expression,
                'Props Total:', this.props.total,
                'Data Total:', data.total
            )
            this.props.setValues(data.expression || '', data.total || 0)
        }
    }

    updateComponents(instance = null) {
        const coordinator = this.props.coordinator
        const componentsRuleEngine = this.props.componentsRuleEngine
        if (coordinator) {
            coordinator.getActiveInstances().then(activeInstances => {
                if (instance && instance.componentsDistribution && instance.componentsDistribution.auto === false) {
                    //TODO:
                    //I should probably find a way to make this pattern something that is "promoted" by the library/framework itself. 
                    //At the very least I should "virtually" rename "_id" to "id".
                    //I will probably just make a "blind" copy of "_id" into "id" so that it is backwards compatible.
                    const localInstance = activeInstances.find(i => i._id === coordinator.instance.id)
                    console.log('[YXCCRE] YanuX Coordinator Manual Component Distribution:', activeInstances)
                    console.log('[YXCCRE] Local Instance:', localInstance)
                    if (localInstance && localInstance.componentsDistribution && localInstance.componentsDistribution.components) {
                        this.props.configureComponents(localInstance.componentsDistribution.components)
                    }
                    this.props.instanceComponentsDistributed(activeInstances)
                } else if (componentsRuleEngine && coordinator.instance && coordinator.instance.id) {
                    this._distributeComponents(coordinator.instance.id, activeInstances)
                }
            }).catch(err => console.error(err));
        }
    }

    _distributeComponents(instanceId, activeInstances, ignoreManual = false) {
        const coordinator = this.props.coordinator
        const componentsRuleEngine = this.props.componentsRuleEngine
        if (coordinator && componentsRuleEngine) {
            componentsRuleEngine.proxemics = coordinator.proxemics.state
            componentsRuleEngine.instances = activeInstances
            componentsRuleEngine.run(ignoreManual).then(res => {
                console.log('[YXCCRE] YanuX Coordinator Components Rule Engine')
                console.log('[YXCCRE] Instance Id', instanceId)
                console.log('[YXCCRE] Proxemics:', componentsRuleEngine.proxemics)
                console.log('[YXCCRE] Instances:', componentsRuleEngine.instances)
                console.log('[YXCCRE] Result:', res)
                if (coordinator.instance && coordinator.instance.id === instanceId) {
                    this.props.configureComponents(res.componentsConfig)
                }
                return coordinator.setComponentDistribution(res.componentsConfig, res.auto, instanceId)
            }).then(() => {
                return coordinator.getActiveInstances()
            }).then(activeInstances => {
                this.props.instanceComponentsDistributed(activeInstances)
            }).catch(err => console.error('[YXCCRE] Error:', err))
        }
    }

    __resourceSubscriptionHandler() {
        const self = this
        return (data, eventType) => {
            console.log(
                'Resource Subscriber Handler Data:', data,
                'Event Type:', eventType
            )
            self.updateState(data)
        }
    }

    __proxemicsSubscriptionHandler() {
        const self = this
        return (data, eventType) => {
            console.log(
                'Proxemics Subscriber Handler Data:', data,
                'Event Type:', eventType
            )
            self.updateComponents()
        }
    }

    __instancesSubscriptionHandler() {
        const self = this
        return (data, eventType) => {
            console.log(
                'Instances Subscription Handler Data:', data,
                'Event Type:', eventType
            )
            self.updateComponents(data)
        }
    }

    __eventsSubcriptionHandler() {
        return (data, eventType) => console.log(
            'Events Subscription Handler Data:', data,
            'Event Type:', eventType
        )
    }

    __reconnectSubscriptionHandler() {
        const self = this
        return (state, proxemics) => {
            console.log(
                'Reconnect Subscription Handler State:', state,
                'Proxemics:', proxemics
            )
            self.updateState(state)
        }
    }

    __resourceSelected() {
        const self = this
        return e => {
            console.log('[YXRME] Resource Selected:', e.detail)
        }
    }

    __createResource() {
        const self = this
        return e => {
            console.log('[YXRME] Create Resource:', e.detail)
            const coordinator = self.props.coordinator
            coordinator.createResource(e.detail.resourceName)
                .then(resource => {
                    console.log('[YXRME] Resource Created:', resource)
                }).catch(err => console.error(err))
        }
    }

    __shareResource() {
        const self = this
        return e => {
            console.log('[YXRME] Share Resource:', e.detail)
        }
    }

    __deleteResource() {
        const self = this
        return e => {
            console.log('[YXRME] Delete Resource:', e.detail)
        }
    }

    __updatedComponentsDistribution() {
        const self = this
        return e => {
            const coordinator = self.props.coordinator
            console.log('[YXCDE] Updated Components Distribution:', e.detail)
            const componentsDistribution = e && e.detail && e.detail.componentsDistribution ? e.detail.componentsDistribution : null
            if (coordinator && componentsDistribution) {
                Promise.all(
                    Object
                        .keys(componentsDistribution)
                        .map(instanceId => coordinator.setComponentDistribution(
                            componentsDistribution[instanceId].components,
                            componentsDistribution[instanceId].auto,
                            instanceId
                        ))
                ).then(results => {
                    console.log('[YXCDE] Updated Instances Based on the New Components Distribution:', results)
                }).catch(e => {
                    console.log('[YXCDE] Something went wrong while updating Instances based on the new Components Distribution:', e)
                })
            }
        }
    }

    __resetAutoComponentsDistribution() {
        const self = this
        return e => {
            const coordinator = self.props.coordinator
            coordinator.getActiveInstances().then(activeInstances => {
                self._distributeComponents(e.detail.instanceId, activeInstances, true)
            }).catch(err => console.error(err));
            console.log('[YXCDE] Reset Auto Components Distribution:', e.detail)
        }
    }

}





