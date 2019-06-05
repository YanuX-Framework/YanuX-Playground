const _ = require("lodash");
const fs = require("fs");
const RuleEngine = require("node-rules");


class ObjectId {
    constructor(id) {
        this.id = id;
    }
    toString() {
        return this.id;
    }
}

function nodeRules(localDeviceUuid, instances, proxemicsData, restrictions) {
    const R = new RuleEngine();
    const activeInstances = instances.filter(i => i.active);
    const proxemics = proxemicsData.state;

    const facts = {
        localDeviceUuid,
        activeInstances,
        proxemics,
        restrictions,
        modules: { _: require('lodash') }
    };

    R.register({
        name: 'hide all components by default',
        condition: function (R) {
            R.when(!this.defaultComponentsConfig);
        },
        consequence: function (R) {
            this.defaultComponentsConfig = {};
            Object.keys(restrictions).forEach(component => {
                this.defaultComponentsConfig[component] = false;
            })
            R.next();
        }
    });

    R.register({
        name: 'start with the default components configuration',
        condition: function (R) {
            R.when(this.defaultComponentsConfig && !this.componentsConfig);
        },
        consequence: function (R) {
            this.componentsConfig = this.defaultComponentsConfig;
            R.next();
        }
    });

    R.register({
        name: 'when local device is present',
        condition: function (R) {
            R.when(this.proxemics[this.localDeviceUuid] && !this.localDeviceCapabilities);
        },
        consequence: function (R) {
            this.localDeviceCapabilities = this.proxemics[localDeviceUuid];
            R.next();
        }
    });

    R.register({
        name: 'when local device capabilities are available',
        condition: function (R) {
            R.when(this.localDeviceCapabilities);
        },
        consequence: function (R) {
            const matchComponents = components => {
                const [component, ...otherComponents] = components
                if (component) {
                    console.log('> Component:', component);
                    const componentRestrictions = this.restrictions[component];
                    this.componentsConfig[component] = matchRestriction(component, Object.keys(componentRestrictions))
                    matchComponents(otherComponents);
                }
            }
            const matchRestriction = (component, restrictions) => {
                console.log('>> Restrictions:', restrictions);
                return restrictions.every(r => matchCondition(this.restrictions[component][r], this.localDeviceCapabilities[r]));
            }
            const matchCondition = (condition, capability, operator) => {
                if (!operator) {
                    operator = 'AND';
                }
                if (condition === true && !this.modules._.isNull(this.localDeviceCapabilities.display)) {
                    console.log('>>> Condition True:', condition, 'Capability:', capability);
                    return true;
                }
                if (this.modules._.isArray(condition)) {
                    console.log('>>> Condition Array 1:', condition, 'Capability:', capability, 'Operator', operator);
                    switch (operator) {
                        case 'OR': return condition.some(c => matchCondition(c, capability, operator));
                        case 'AND':
                        case 'NOT':
                        default: return condition.every(c => matchCondition(c, capability, operator))
                    }
                }
                if (this.modules._.isArray(condition.values) && this.modules._.isString(condition.operator)) {
                    console.log('>>> Condition Array 2:', condition, 'Capability:', capability, 'Operator', operator);
                    return matchCondition(condition.values, capability, condition.operator);
                }
                if (this.modules._.isObject(condition) && this.modules._.isString(operator)) {
                    console.log('>>> Condition Object 1:', condition, 'Capability:', capability, 'Operator', operator);
                    const processConditionEntries = c => {
                        const entryKey = c[0];
                        const entryValue = c[1];
                        const capabilityValue = this.modules._.flattenDeep([capability[entryKey]]);
                        const conditionValue = this.modules._.flattenDeep([entryValue.value]);
                        switch (entryValue.operator) {
                            case '=':
                                return conditionValue.every((cn, i) => capabilityValue[i] == cn);
                            case '!':
                                console.log('>>>>>: !');
                                return conditionValue.every((cn, i) => capabilityValue[i] != cn);
                            case '>':
                                console.log('>>>>: >');
                                return conditionValue.every((cn, i) => capabilityValue[i] > cn);
                            case '>=':
                                console.log('>>>>: >=');
                                return conditionValue.every((cn, i) => capabilityValue[i] >= cn);
                            case '<':
                                console.log('>>>>: <');
                                return conditionValue.every((cn, i) => capabilityValue[i] < cn);
                            case '<=':
                                console.log('>>>>: <=');
                                return conditionValue.every((cn, i) => capabilityValue[i] <= cn);
                            case 'AND':
                                console.log('>>>>: AND');
                                return entryValue.values.every(v => {
                                    const cond = {};
                                    cond[entryKey] = v;
                                    return matchCondition(cond, capability)
                                });
                            case 'OR':
                                console.log('>>>>: OR');
                                return entryValue.values.some(v => {
                                    const cond = {};
                                    cond[entryKey] = v;
                                    return matchCondition(cond, capability)
                                });
                            case 'NOT':
                                console.log('>>>>: NOT');
                                return entryValue.values.every(v => {
                                    const cond = {};
                                    cond[entryKey] = v;
                                    return !matchCondition(cond, capability)
                                });
                            default:
                                console.log('>>>>: DEFAULT');
                                return entryValue.every(v => {
                                    const cond = {};
                                    cond[entryKey] = v;
                                    return matchCondition(cond, capability)
                                });
                        }
                    }
                    switch (operator) {
                        case 'OR': return Object.entries(condition).some(processConditionEntries);
                        case 'AND':
                        case 'NOT':
                        default: return Object.entries(condition).every(processConditionEntries);
                    }
                }
                if (this.modules._.isArray(capability)) {
                    console.log('>>> Condition Array Capability:', condition, 'Capability:', capability, 'Operator', operator);
                    return capability.includes(condition);
                }
            }
            matchComponents(Object.keys(this.restrictions));
            R.next();
        }
    });

    R.register({
        name: 'end when local device is not present',
        condition: function (R) {
            R.when(!this.proxemics[this.localDeviceUuid]);
        },
        consequence: function (R) {
            this.componentsConfig = this.defaultComponentsConfig;
            R.stop();
        }
    });

    R.execute(facts, function (data) {
        console.log("---- Node Rules ----");
        console.log(data.componentsConfig);
    });
}

function main() {
    const localDeviceUuid = "3d42affa-3685-47f2-97d0-bd4ff46de5c6";
    const instances = [
        {
            "_id": new ObjectId("5cb4c511eb479c2e46a7a20d"),
            "active": true,
            "brokerName": "YanuX-Broker",
            "user": new ObjectId("5cb4c3b2eb479c2e46a785d7"),
            "client": new ObjectId("5cb4c50feb479c2e46a7a1e2"),
            "device": {
                "_id": new ObjectId("5cb4c420eb479c2e46a78969"),
                "beaconValues": [
                    "113069EC-6E64-4BD3-6810-DE01B36E8A3E",
                    1,
                    101
                ],
                "brokerName": "YanuX-Broker",
                "deviceUuid": "3d42affa-3685-47f2-97d0-bd4ff46de5c6",
                "user": new ObjectId("5cb4c3b2eb479c2e46a785d7"),
                "createdAt": new Date("2019-04-15T17:49:20.145Z"),
                "updatedAt": new Date("2019-04-15T18:01:02.481Z"),
                "__v": 0
            },
            "instanceUuid": "0ea41404-86a7-42d7-980c-f343ef66df10",
            "createdAt": new Date("2019-04-15T17:53:21.038Z"),
            "updatedAt": new Date("2019-04-15T17:54:32.525Z"),
            "__v": 0
        },
        {
            "_id": new ObjectId("5cb4c532eb479c2e46a7a43b"),
            "active": true,
            "brokerName": "YanuX-Broker",
            "user": new ObjectId("5cb4c3b2eb479c2e46a785d7"),
            "client": new ObjectId("5cb4c50feb479c2e46a7a1e2"),
            "device": {
                "_id": new ObjectId("5cb4c3b2eb479c2e46a785d8"),
                "beaconValues": [
                    "113069EC-6E64-4BD3-6810-DE01B36E8A3E",
                    1,
                    100
                ],
                "brokerName": "YanuX-Broker",
                "deviceUuid": "9ab8e750-bc1e-11e8-a769-3f2e91eebf08",
                "user": new ObjectId("5cb4c3b2eb479c2e46a785d7"),
                "createdAt": new Date("2019-04-15T17:47:30.957Z"),
                "updatedAt": new Date("2019-04-15T17:47:30.957Z"),
                "__v": 0
            },
            "instanceUuid": "9057a01c-9854-486d-9a11-cc4af4d7d5b8",
            "createdAt": new Date("2019-04-15T17:53:54.870Z"),
            "updatedAt": new Date("2019-04-15T17:53:54.880Z"),
            "__v": 0
        }
    ];
    const proxemics = {
        "_id": new ObjectId("5cb4c3d0eb479c2e46a785dc"),
        "brokerName": "YanuX-Broker",
        "user": "5cb4c3b2eb479c2e46a785d7",
        "state": {
            "3d42affa-3685-47f2-97d0-bd4ff46de5c6": {
                "view": true,
                "control": true,
                "display": {
                    "resolution": [1920, 1080],
                    "pixelDensity": 96,
                    "bitDepth": 24,
                    "size": [481, 271],
                    "refreshRate": 60
                },
                "speakers": {
                    "type": "loadspeaker",
                    "channels": 2,
                },
                "camera": {
                    "resolution": [1280, 720],
                },
                "microphone": {
                    "channels": 1,
                },
                "input": ["keyboard", "mouse"],
                "sensors": []
            },
            "9ab8e750-bc1e-11e8-a769-3f2e91eebf08": {
                "view": true,
                "control": false,
                "display": {
                    "resolution": [1080, 2248],
                    "pixelDensity": 402,
                    "size": [154.9, 74.8],
                    "refreshRate": 60
                },
                "speakers": {
                    "type": "loudspeaker",
                    "channels": 1,
                },
                "camera": {
                    "resolution": [4032, 3024],
                },
                "input": ["keyboard", "mouse"],
                "sensors": []
            }
        },
        "updatedAt": new Date("2019-04-15T17:56:57.834Z"),
        "createdAt": new Date("2019-04-15T17:56:57.834Z")
    };
    const restrictions = {
        "viewer-form": {
            "display": true,
            "input": {
                "operator": "OR",
                "values": [{
                    "operator": "AND",
                    "values": ["keyboard", "mouse"]
                }, "touchscreen"]
            }
        },
        "player": {
            "display": {
                "operator": "AND",
                "values": [{
                    "resolution": {
                        "operator": ">=",
                        "value": [1280, null],
                    },
                    "size": {
                        "operator": ">=",
                        "value": [160, 90],
                    },
                    "pixelDensity": {
                        "operator": "NOT",
                        "values": [{
                            "operator": ">",
                            "value": 150
                        }]
                    },
                }]
            },
            "speakers": {
                "channels": [
                    {
                        "operator": ">=",
                        "value": 2,
                    },
                    {
                        "operator": ">=",
                        "value": 1,
                    }
                ]
            }
        }
    };
    nodeRules(localDeviceUuid, instances, proxemics, restrictions);
}
main();