import './Coordinator.css'
import React from 'react'
import ReactModal from 'react-modal'

export default class Coordinator extends React.Component {
    constructor(props) {
        super(props)
        this.state = { alert: { title: 'Alert', message: 'Message', show: false } }

        this.handleOpenModal = this.handleOpenModal.bind(this)
        this.handleCloseModal = this.handleCloseModal.bind(this)

        this.resourceSubscriptionHandler = this.resourceSubscriptionHandler.bind(this)
        this.resourcesSubscriptionHandler = this.resourcesSubscriptionHandler.bind(this)
        this.resourceSubscriptionSubscriptionHandler = this.resourceSubscriptionSubscriptionHandler.bind(this)
        this.proxemicsSubscriptionHandler = this.proxemicsSubscriptionHandler.bind(this)
        this.instancesSubscriptionHandler = this.instancesSubscriptionHandler.bind(this)
        this.eventsSubcriptionHandler = this.eventsSubcriptionHandler.bind(this)
        this.reconnectSubscriptionHandler = this.reconnectSubscriptionHandler.bind(this)

        this.resourceManagementRef = React.createRef();
        this.resourceSelected = this.resourceSelected.bind(this)
        this.createResource = this.createResource.bind(this)
        this.renameResource = this.renameResource.bind(this)
        this.shareResource = this.shareResource.bind(this)
        this.deleteResource = this.deleteResource.bind(this)
        this.unshareResource = this.unshareResource.bind(this)

        this.componentsDistributionRef = React.createRef()
        this.updatedComponentsDistribution = this.updatedComponentsDistribution.bind(this)
        this.resetAutoComponentsDistribution = this.resetAutoComponentsDistribution.bind(this)
    }

    componentDidUpdate(prevProps) {
        const coordinator = this.props.coordinator
        if (coordinator && !prevProps.coordinator) {
            coordinator.init().then(results => {
                const [initialState, initialProxemics, initialResourceId] = results
                console.log('[YXC] Connected to YanuX Broker')
                console.log('[YXC] Initial State', initialState)
                console.log('[YXC] Initial Proxemics', initialProxemics)
                console.log('[YXC] Initial Resource Id', initialResourceId)
                coordinator.subscribeResource(this.resourceSubscriptionHandler, initialResourceId);
                this.resourceSubscriptionHandler(initialState)
                this.props.connected(initialState, initialProxemics)
                this.updateResources()
                this.updateComponents()
            }).catch(err => {
                console.error('[YXC] Error Connecting to YanuX Broker', err)
                this.props.logout()
            })
            coordinator.subscribeResources(this.resourcesSubscriptionHandler)
            coordinator.subscribeResourceSubscription(this.resourceSubscriptionSubscriptionHandler)
            coordinator.subscribeProxemics(this.proxemicsSubscriptionHandler)
            coordinator.subscribeInstances(this.instancesSubscriptionHandler)
            coordinator.subscribeEvents(this.eventsSubcriptionHandler)
            coordinator.subscribeReconnects(this.reconnectSubscriptionHandler)
        }

        if (this.resourceManagementRef.current) {
            this.resourceManagementRef.current.addEventListener(
                'resource-selected',
                this.resourceSelected
            )
            this.resourceManagementRef.current.addEventListener(
                'create-resource',
                this.createResource
            )
            this.resourceManagementRef.current.addEventListener(
                'rename-resource',
                this.renameResource
            )
            this.resourceManagementRef.current.addEventListener(
                'delete-resource',
                this.deleteResource
            )
            this.resourceManagementRef.current.addEventListener(
                'share-resource',
                this.shareResource
            )
            this.resourceManagementRef.current.addEventListener(
                'unshare-resource',
                this.unshareResource
            )
        }

        if (this.componentsDistributionRef.current) {
            this.componentsDistributionRef.current.addEventListener(
                'updated-components-distribution',
                this.updatedComponentsDistribution
            )
            this.componentsDistributionRef.current.addEventListener(
                'reset-auto-components-distribution',
                this.resetAutoComponentsDistribution
            )
        }
    }

    componentWillUnmount() {
        if (this.componentsDistributionRef.current) {
            this.componentsDistributionRef.current.removeEventListener(
                'updated-components-distribution',
                this.updatedComponentsDistribution
            )
            this.componentsDistributionRef.current.removeEventListener(
                'reset-auto-components-distribution',
                this.resetAutoComponentsDistribution
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
                    <div className="yanux-elements">
                        <div className="yanux-element resource-management">
                            <span className="info">Resources</span>
                            <yanux-resource-management
                                ref={this.resourceManagementRef}
                                selectedResourceId={this.props.subscribedResourceId || this.props.coordinator.resource.id}
                                resources={JSON.stringify(this.props.resources)} />
                        </div>
                        <div className="yanux-element components-distribution">
                            <span className="info">Devices</span>
                            <yanux-components-distribution
                                ref={this.componentsDistributionRef}
                                instanceId={this.props.coordinator.instance.id}
                                componentsDistribution={JSON.stringify(this.props.instancesComponentsDistribution)} />
                        </div>
                    </div>
                    <div className="alert">
                        <ReactModal
                            isOpen={this.state.alert.show}
                            contentLabel="Alert Dialog"
                            onRequestClose={this.handleCloseModal}
                            className="alert-content">
                            <h3>{this.state.alert.title}</h3>
                            <p>{this.state.alert.message}</p>
                            <button className="alert-button" onClick={this.handleCloseModal}>OK</button>
                        </ReactModal>
                    </div>
                </React.Fragment>
            )
        }
    }

    handleOpenModal(newTitle, newMessage) {
        const title = newTitle || this.state.alert.title
        const message = newMessage || this.state.alert.message
        this.setState({ alert: { title, message, show: true } })
    }

    handleCloseModal() {
        this.setState({ alert: { show: false } })
    }

    updateResources() {
        const coordinator = this.props.coordinator
        if (coordinator) {
            coordinator.getResources().then(resources => {
                console.log('[YXCRM] YanuX Coordinator Resources:', resources)
                this.props.resourcesRetrieved(resources)
            }).catch(err => console.error('[YXCRM] Error getting resources:', err))
        }
    }

    updateState(data) {
        if (data && (this.props.expression !== data.expression || this.props.total !== data.total)) {
            console.log(
                '[YXC] Props Expression:', this.props.expression,
                'Data Expression:', data.expression,
                'Props Total:', this.props.total,
                'Data Total:', data.total
            )
            this.props.setValues(data.expression, data.total)
        }
    }

    //TODO: I should probably find a way to make this updateComponents pattern something that is "promoted" by the library/framework itself. 
    updateComponents(instance = null) {
        const coordinator = this.props.coordinator
        const componentsRuleEngine = this.props.componentsRuleEngine
        if (coordinator) {
            coordinator.getActiveInstances().then(activeInstances => {
                if (instance && instance.componentsDistribution && instance.componentsDistribution.auto === false) {
                    //Also, at the very least I should "virtually" rename "_id" to "id".
                    //I will probably just make a "blind" copy of "_id" into "id" so that it is backwards compatible.
                    const localInstance = activeInstances.find(i => i._id === coordinator.instance.id)
                    console.log('[YXCCRE] YanuX Coordinator Manual Component Distribution:', activeInstances)
                    console.log('[YXCCRE] Local Instance:', localInstance)
                    if (localInstance && localInstance.componentsDistribution && localInstance.componentsDistribution.components) {
                        this.props.configureComponents(localInstance.componentsDistribution.components)
                    }
                    this.props.instanceComponentsDistributed(activeInstances)
                } else if (componentsRuleEngine && coordinator.instance && coordinator.instance.id) {
                    this.distributeComponents(coordinator.instance.id, activeInstances)
                }
            }).catch(err => console.error('[YXCCRE] Error getting active instances:', err));
        }
    }

    //TODO: This is also a good candidate to be included into the framework.
    distributeComponents(instanceId, activeInstances, ignoreManual = false) {
        const coordinator = this.props.coordinator
        const componentsRuleEngine = this.props.componentsRuleEngine
        if (coordinator && componentsRuleEngine) {
            coordinator.getProxemicsState().then(proxemics => {
                console.log('Merged Proxemics:', proxemics)
                componentsRuleEngine.proxemics = proxemics
            }).then(() => {
                componentsRuleEngine.instances = activeInstances
                return componentsRuleEngine.run(ignoreManual)
            }).then(res => {
                console.log(
                    '[YXCCRE] - YanuX Coordinator Components Rule Engine -',
                    'Instance Id:', instanceId,
                    'Proxemics:', componentsRuleEngine.proxemics,
                    'Instances:', componentsRuleEngine.instances,
                    'Result', res)
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

    selectResource(resourceId) {
        const coordinator = this.props.coordinator
        return coordinator.getResourceData(resourceId).then(data => {
            console.log('[YXC] Resource Id', data.id, 'Data:', data)
            return Promise.all([Promise.resolve(data), coordinator.subscribeResource(this.resourceSubscriptionHandler, resourceId)]);
        }).then(results => {
            const [data, resourceSubscription] = results;
            this.props.setValues(data.expression, data.total)
            console.log('[YXC] Resource Subscription', resourceSubscription)
        }).catch(err => {
            this.handleOpenModal('Error Selecting Resource', err.message)
            console.error('[YXC] Error Selecting Resource:', err)
        })
    }


    resourceSubscriptionHandler(data, eventType) {
        console.log(
            '[YXC] Resource Subscriber Handler Data:', data,
            'Event Type:', eventType
        )
        this.updateState(data)
    }

    resourcesSubscriptionHandler(data, eventType) {
        console.log(
            '[YXC] Resources Subscriber Handler Data:', data,
            'Event Type:', eventType
        )
        const coordinator = this.props.coordinator;
        if (eventType === 'removed' && data.id === coordinator.subscribedResourceId) {
            this.selectResource(null)
        }
        this.updateResources()
    }

    resourceSubscriptionSubscriptionHandler(data, eventType) {
        console.log(
            '[YXC] Resources Subscriber Handler Data:', data,
            'Event Type:', eventType
        )
        if (eventType !== 'removed') { this.selectResource(data.resource) }
    }

    proxemicsSubscriptionHandler(data, eventType) {
        console.log(
            '[YXC] Proxemics Subscriber Handler Data:', data,
            'Event Type:', eventType
        )
        this.updateComponents()
    }

    instancesSubscriptionHandler(data, eventType) {
        console.log(
            '[YXC] Instances Subscription Handler Data:', data,
            'Event Type:', eventType
        )
        this.updateComponents(data)
    }

    eventsSubcriptionHandler(data, eventType) {
        console.log(
            '[YXC] Events Subscription Handler Data:', data,
            'Event Type:', eventType
        )
    }

    reconnectSubscriptionHandler(state, proxemics, resourceId) {
        console.log(
            '[YXC] Reconnect Subscription Handler State:', state,
            'Proxemics:', proxemics,
            'Resource Id:', resourceId
        )
        this.updateState(state)
    }

    resourceSelected(e) {
        console.log('[YXRME] Resource Selected:', e.detail)
        this.selectResource(e.detail.selectedResourceId)
    }

    createResource(e) {
        console.log('[YXRME] Create Resource:', e.detail)
        const coordinator = this.props.coordinator
        coordinator.createResource(e.detail.resourceName)
            .then(resource => {
                console.log('[YXRME] Resource Created:', resource)
            }).catch(err => {
                this.handleOpenModal('Error Creating Resource', err.message)
                console.error('[YXRME] Error Creating Resource:', err)
            })
    }

    renameResource(e) {
        console.log('[YXRME] Rename Resource:', e.detail)
        const coordinator = this.props.coordinator
        coordinator.renameResource(e.detail.resourceName, e.detail.resourceId)
            .then(resource => {
                console.log('[YXRME] Resource Renamed:', resource)
                this.updateResources()
            }).catch(err => {
                this.handleOpenModal('Error Renaming Resource', err.message)
                console.error('[YXRME] Error Renameing Resource:', err)
            })
    }

    deleteResource(e) {
        const coordinator = this.props.coordinator
        console.log('[YXRME] Delete Resource:', e.detail)
        coordinator.deleteResource(e.detail.resourceId)
            .then(resource => {
                console.log('[YXRME] Resource Deleted:', resource)
                this.updateResources()
            }).catch(err => {
                this.handleOpenModal('Error Deleting Resource', err.message)
                console.error('[YXRME] Error Deleting Resource:', err)
            })
    }

    shareResource(e) {
        console.log('[YXRME] Share Resource:', e.detail)
        const coordinator = this.props.coordinator
        coordinator.shareResource(e.detail.userEmail, e.detail.resourceId)
            .then(resource => {
                console.log('[YXRME] Resource Shared:', resource)
                this.updateResources()
            }).catch(err => {
                this.handleOpenModal('Error Sharing Resource', err.message)
                console.error('[YXRME] Error Sharing Resource:', err)
            })
    }

    unshareResource(e) {
        console.log('[YXRME] Unshare Resource:', e.detail)
        const coordinator = this.props.coordinator
        coordinator.unshareResource(e.detail.userEmail, e.detail.resourceId)
            .then(resource => {
                console.log('[YXRME] Resource Unshared:', resource)
                this.updateResources()
            }).catch(err => {
                this.handleOpenModal('Error Unsharing Resource', err.message)
                console.error('[YXRME] Error Unsharing Resource:', err)
            })
    }

    //TODO: This is also a good candidate to be included into the framework.
    updatedComponentsDistribution(e) {
        const coordinator = this.props.coordinator
        console.log('[YXCDE] Updated Components Distribution:', e.detail)
        const componentsDistribution = e && e.detail && e.detail.componentsDistribution ? e.detail.componentsDistribution : null
        if (coordinator && componentsDistribution) {
            Promise.all(Object.keys(componentsDistribution)
                .map(instanceId => coordinator.setComponentDistribution(
                    componentsDistribution[instanceId].components,
                    componentsDistribution[instanceId].auto,
                    instanceId
                ))
            ).then(results => {
                console.log('[YXCDE] Updated Instances Based on the New Components Distribution:', results)
            }).catch(e => {
                console.error('[YXCDE] Something went wrong while updating Instances based on the new Components Distribution:', e)
            })
        }

    }

    //TODO: This is also a good candidate to be included into the framework.
    resetAutoComponentsDistribution(e) {
        const coordinator = this.props.coordinator
        coordinator.getActiveInstances().then(activeInstances => {
            this.distributeComponents(e.detail.instanceId, activeInstances, true)
        }).catch(err => console.error('[YXCDE] Error while getting active instances:', err));
        console.error('[YXCDE] Reset Auto Components Distribution:', e.detail)
    }
}