const _ = require("lodash");
const fs = require("fs");

class ObjectId {
    constructor(id) {
        this.id = id;
    }
    toString() {
        return this.id;
    }
}

function classic(localDeviceUuid, instances, proxemicsData) {
    const activeInstances = instances.filter(i => i.active);
    const proxemics = proxemicsData.state;
    const defaultComponentsConfig = {
        view: false,
        control: false
    }
    const componentsDistribution = _.cloneDeep(proxemics);
    let componentsConfig = defaultComponentsConfig;
    if (proxemics[localDeviceUuid]) {
        const viewAndControlDevices = _.pickBy(proxemics, (caps, deviceUuid) => {
            return caps.view === true && caps.control === true && _.some(activeInstances, instance => deviceUuid === instance.device.deviceUuid);
        });
        const viewOnlyDevices = _.pickBy(proxemics, (caps, deviceUuid) => {
            return caps.view === true && caps.control === false && _.some(activeInstances, instance => deviceUuid === instance.device.deviceUuid);
        });
        const controlOnlyDevices = _.pickBy(proxemics, (caps, deviceUuid) => {
            return caps.view === false && caps.control === true && _.some(activeInstances, instance => deviceUuid === instance.device.deviceUuid);
        });
        if (!_.isEmpty(viewOnlyDevices)) {
            for (let deviceUuid in viewAndControlDevices) {
                componentsDistribution[deviceUuid].view = false;
            }
        }
        if (!_.isEmpty(controlOnlyDevices)) {
            for (let deviceUuid in viewAndControlDevices) {
                componentsDistribution[deviceUuid].control = false;
            }
        }
        componentsConfig = componentsDistribution[localDeviceUuid];
    }
    console.log("---- Classic ----");
    console.log(componentsConfig);
}

function jsonRulesEngine(localDeviceUuid, instances, proxemicsData) {
    //https://github.com/cachecontrol/json-rules-engine
    //https://www.npmjs.com/package/json-rules-engine
    //https://github.com/CacheControl/json-rules-engine/blob/master/docs/almanac.md
    const { Engine } = require('json-rules-engine');
    const engine = new Engine();

    const activeInstances = instances.filter(i => i.active);
    const proxemics = proxemicsData.state;
    const componentsDistribution = _.cloneDeep(proxemics);
    const defaultComponentsConfig = {
        view: false,
        control: false
    }
    const facts = {
        localDeviceUuid,
        activeInstances,
        proxemics,
        componentsDistribution,
        defaultComponentsConfig
    };
    engine.addFact('viewAndControlDevices', function (params, almanac) {
        return Promise.all([
            almanac.factValue('proxemics'),
            almanac.factValue('activeInstances')
        ]).then(results => {
            const fProxemics = results[0];
            const fActiveInstances = results[1];
            const viewAndControlDevices = _.pickBy(fProxemics, (caps, deviceUuid) => {
                return caps.view === true && caps.control === true && _.some(fActiveInstances, instance => deviceUuid === instance.device.deviceUuid);
            });
            if (_.isEmpty(viewAndControlDevices)) {
                return { devices: null };
            } else {
                return { devices: viewAndControlDevices }
            }
        });
    });
    engine.addFact('viewOnlyDevices', function (params, almanac) {
        return Promise.all([
            almanac.factValue('proxemics'),
            almanac.factValue('activeInstances')
        ]).then(results => {
            const fProxemics = results[0];
            const fActiveInstances = results[1];
            const viewOnlyDevices = _.pickBy(fProxemics, (caps, deviceUuid) => {
                return caps.view === true && caps.control === false && _.some(fActiveInstances, instance => deviceUuid === instance.device.deviceUuid);
            });
            if (_.isEmpty(viewOnlyDevices)) {
                return { devices: null };
            } else {
                return { devices: viewOnlyDevices }
            }
        });
    });
    engine.addFact('controlOnlyDevices', function (params, almanac) {
        return Promise.all([
            almanac.factValue('proxemics'),
            almanac.factValue('activeInstances')
        ]).then(results => {
            const fProxemics = results[0];
            const fActiveInstances = results[1];
            const controlOnlyDevices = _.pickBy(fProxemics, (caps, deviceUuid) => {
                return caps.view === false && caps.control === true && _.some(fActiveInstances, instance => deviceUuid === instance.device.deviceUuid);
            })
            if (_.isEmpty(controlOnlyDevices)) {
                return { devices: null };
            } else {
                return { devices: controlOnlyDevices }
            }
        });
    });
    engine.addRule({
        conditions: {
            all: [{
                fact: 'proxemics',
                operator: 'notEqual',
                path: '.' + localDeviceUuid,
                value: undefined
            }]
        },
        event: {  // define the event to fire when the conditions evaluate truthy
            type: 'localDeviceIsPresent',
        },
        onSuccess: function (event, almanac) {
            almanac.addRuntimeFact('localDeviceIsPresent', true) // track that the rule passed
        },
        onFailure: function (event, almanac) {
            almanac.addRuntimeFact('localDeviceIsPresent', false) // track that the rule failed
            almanac.factValue('defaultComponentsConfig').then(fDefaultComponentsConfig => {
                almanac.addRuntimeFact('componentsConfig', fDefaultComponentsConfig)
            })
        },
        priority: 3
    });
    engine.addRule({
        conditions: {
            all: [{
                fact: 'localDeviceIsPresent',
                operator: 'equal',
                value: true
            }, {
                fact: 'viewOnlyDevices',
                operator: 'notEqual',
                path: '.devices',
                value: null
            }]
        },
        event: {  // define the event to fire when the conditions evaluate truthy
            type: 'viewOnlyDevicesExist',
        },
        onSuccess: function (event, almanac) {
            Promise.all([
                almanac.factValue('localDeviceUuid'),
                almanac.factValue('viewAndControlDevices', {}, '.devices'),
                almanac.factValue('componentsDistribution')
            ]).then(results => {
                const fLocalDeviceUuid = results[0];
                const fViewAndControlDevices = results[1];
                const fComponentsDistribution = results[2];
                for (let deviceUuid in fViewAndControlDevices) {
                    fComponentsDistribution[deviceUuid].view = false;
                }
                almanac.addRuntimeFact('componentsConfig', fComponentsDistribution[fLocalDeviceUuid])
            }).catch(err => console.error(err));
        },
        priority: 2
    });
    engine.addRule({
        conditions: {
            all: [{
                fact: 'localDeviceIsPresent',
                operator: 'equal',
                value: true
            }, {
                fact: 'controlOnlyDevices',
                operator: 'notEqual',
                path: '.devices',
                value: null
            }]
        },
        event: {  // define the event to fire when the conditions evaluate truthy
            type: 'controlOnlyDevicesExist',
        },
        onSuccess: function (event, almanac) {
            Promise.all([
                almanac.factValue('localDeviceUuid'),
                almanac.factValue('viewAndControlDevices', {}, '.devices'),
                almanac.factValue('componentsDistribution')
            ]).then(results => {
                const fLocalDeviceUuid = results[0];
                const fViewAndControlDevices = results[1];
                const fComponentsDistribution = results[2];
                for (let deviceUuid in fViewAndControlDevices) {
                    fComponentsDistribution[deviceUuid].control = false;
                }
                almanac.addRuntimeFact('componentsConfig', fComponentsDistribution[fLocalDeviceUuid])
            }).catch(err => console.error(err));
        },
        priority: 2
    });

    engine.addRule({
        conditions: {
            all: [{
                fact: 'localDeviceIsPresent',
                operator: 'equal',
                value: true
            }, {
                fact: 'componentsConfig',
                operator: 'notEqual',
                value: undefined
            }]
        },
        event: {  // define the event to fire when the conditions evaluate truthy
            type: 'componentsConfig',
            params: {
                defaultConfig: false
            }
        },
        priority: 1 // lower priority ensures this is run AFTER its predecessor
    });

    engine.addRule({
        conditions: {
            all: [{
                fact: 'localDeviceIsPresent',
                operator: 'equal',
                value: false
            }, {
                fact: 'componentsConfig',
                operator: 'notEqual',
                value: undefined
            }]
        },
        event: {  // define the event to fire when the conditions evaluate truthy
            type: 'componentsConfig',
            params: {
                defaultConfig: true
            }
        }
    });

    console.log("---- JSON Rules Engine ----");
    engine.run(facts).then(events => { // run() returns events with truthy conditions
        console.log('Engine Finished');
    });
    engine.on('success', (event, almanac, ruleResult) => {
        if (event.type === 'componentsConfig') {
            console.log(ruleResult.conditions.all.find(condition => condition.fact === 'componentsConfig').factResult)
        }
    });
    engine.rules.forEach((rule, index) => {
        fs.writeFileSync('json-rules-engine-'+index+'.json', rule.toJSON());
    });
}

/** TODO: Replace lodash with fully "native" solution in order to be able to "persist" the rules seamlessly! */
function nodeRules(localDeviceUuid, instances, proxemicsData) {
    //https://github.com/mithunsatheesh/node-rules
    //https://www.npmjs.com/package/node-rules
    const RuleEngine = require("node-rules");
    const R = new RuleEngine();
    const activeInstances = instances.filter(i => i.active);
    const proxemics = proxemicsData.state;
    const componentsDistribution = _.cloneDeep(proxemics);
    const defaultComponentsConfig = {
        view: false,
        control: false
    }
    const facts = {
        localDeviceUuid,
        activeInstances,
        proxemics,
        componentsDistribution,
        defaultComponentsConfig,
        modules: { _: require('lodash') }
    };
    R.register({
        "name": 'Rule compute device type lists if local device is present',
        "condition": function (R) {
            R.when(this.proxemics[this.localDeviceUuid]);
        },
        "consequence": function (R) {
            this.viewAndControlDevices = this.modules._.pickBy(this.proxemics, (caps, deviceUuid) => {
                return caps.view === true && caps.control === true && this.modules._.some(this.activeInstances, instance => deviceUuid === instance.device.deviceUuid);
            });
            this.viewOnlyDevices = this.modules._.pickBy(this.proxemics, (caps, deviceUuid) => {
                return caps.view === true && caps.control === false && this.modules._.some(this.activeInstances, instance => deviceUuid === instance.device.deviceUuid);
            });
            this.controlOnlyDevices = this.modules._.pickBy(this.proxemics, (caps, deviceUuid) => {
                return caps.view === false && caps.control === true && this.modules._.some(this.activeInstances, instance => deviceUuid === instance.device.deviceUuid);
            });
            R.next();
        }
    });
    R.register({
        "name": 'end when local device is present',
        "condition": function (R) {
            R.when(this.proxemics[this.localDeviceUuid]);
        },
        "consequence": function (R) {
            this.componentsConfig = this.componentsDistribution[this.localDeviceUuid];
            R.next();
        }
    });
    R.register({
        "name": 'end when local device is not present',
        "condition": function (R) {
            R.when(!this.proxemics[this.localDeviceUuid]);
        },
        "consequence": function (R) {
            this.componentsConfig = this.defaultComponentsConfig;
            R.stop();
        }
    });
    R.register({
        "name": 'dedicated view devices have priority',
        "condition": function (R) {
            R.when(!this.modules._.isEmpty(this.viewOnlyDevices));
        },
        "consequence": function (R) {
            for (let deviceUuid in this.viewAndControlDevices) {
                this.componentsDistribution[deviceUuid].view = false;
            }
            R.next();
        }
    });
    R.register({
        "name": 'dedicated control devices have priority',
        "condition": function (R) {
            R.when(!this.modules._.isEmpty(this.controlOnlyDevices));
        },
        "consequence": function (R) {
            for (let deviceUuid in this.viewAndControlDevices) {
                this.componentsDistribution[deviceUuid].control = false;
            }
            R.next();
        }
    });
    const rules = R.toJSON();
    fs.writeFileSync('node-rules.json', JSON.stringify(rules));
    R.fromJSON(rules);
    R.execute(facts, function (data) {
        console.log("---- Node Rules ----");
        console.log(data.componentsConfig);
    });
}

async function rools(localDeviceUuid, instances, proxemicsData) {
    //https://github.com/frankthelen/rools
    //https://www.npmjs.com/package/rools
    const { Rools, Rule } = require('rools');

    const activeInstances = instances.filter(i => i.active);
    const proxemics = proxemicsData.state;
    const componentsDistribution = _.cloneDeep(proxemics);
    const defaultComponentsConfig = {
        view: false,
        control: false
    }
    const facts = {
        localDeviceUuid,
        activeInstances,
        proxemics,
        componentsDistribution,
        defaultComponentsConfig
    };
    const ruleComputeDeviceTypeListsIfLocalDeviceIsPresent = new Rule({
        name: 'Rule compute device type lists if local device is present',
        when: facts => facts.proxemics[facts.localDeviceUuid],
        then: (facts) => {
            facts.viewAndControlDevices = _.pickBy(facts.proxemics, (caps, deviceUuid) => {
                return caps.view === true && caps.control === true && _.some(activeInstances, instance => deviceUuid === instance.device.deviceUuid);
            });
            facts.viewOnlyDevices = _.pickBy(facts.proxemics, (caps, deviceUuid) => {
                return caps.view === true && caps.control === false && _.some(activeInstances, instance => deviceUuid === instance.device.deviceUuid);
            });
            facts.controlOnlyDevices = _.pickBy(facts.proxemics, (caps, deviceUuid) => {
                return caps.view === false && caps.control === true && _.some(activeInstances, instance => deviceUuid === instance.device.deviceUuid);
            });
        },
    });
    const ruleEndWhenLocalDeviceIsPresent = new Rule({
        name: 'end when local device is present',
        when: facts => facts.proxemics[facts.localDeviceUuid],
        then: (facts) => {
            facts.componentsConfig = facts.componentsDistribution[facts.localDeviceUuid];
        },
    });
    const ruleWhenLocalDeviceIsNotPresent = new Rule({
        name: 'end when local device is not present',
        when: facts => !facts.proxemics[facts.localDeviceUuid],
        then: (facts) => {
            facts.componentsConfig = facts.defaultComponentsConfig
        },
    });
    const ruleViewOnlyPriority = new Rule({
        name: 'dedicated view devices have priority',
        when: facts => !_.isEmpty(facts.viewOnlyDevices),
        then: (facts) => {
            for (let deviceUuid in facts.viewAndControlDevices) {
                facts.componentsDistribution[deviceUuid].view = false;
            }
        },
    });
    const ruleControlOnlyPriority = new Rule({
        name: 'dedicated control devices have priority',
        when: facts => !_.isEmpty(facts.controlOnlyDevices),
        then: (facts) => {
            for (let deviceUuid in facts.viewAndControlDevices) {
                facts.componentsDistribution[deviceUuid].control = false;
            }
        },
    });
    const rools = new Rools();
    await rools.register([
        ruleComputeDeviceTypeListsIfLocalDeviceIsPresent,
        ruleEndWhenLocalDeviceIsPresent,
        ruleWhenLocalDeviceIsNotPresent,
        ruleViewOnlyPriority,
        ruleControlOnlyPriority
    ]);
    await rools.evaluate(facts);
    console.log("---- rools ----");
    console.log(facts.componentsConfig);
}

function tauProlog(localDeviceUuid, instances, proxemics) {
    //http://tau-prolog.org/
    //https://github.com/jariazavalverde/tau-prolog
    //https://www.npmjs.com/package/tau-prolog
    //https://github.com/jariazavalverde/tau-prolog/blob/master/examples/nodejs/fruit.js
    const pl = require("tau-prolog");
    require("tau-prolog/modules/lists")(pl);
    const session = pl.create(1000);
    console.log("---- Tau Prolog ----");
}

function nools(localDeviceUuid, instances, proxemics) {
    const nools = require("nools");
    //https://www.npmjs.com/package/nools
    //https://github.com/noolsjs/nools
    console.log("---- nools ----");
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
                "capabilities": {
                    "view": true,
                    "control": true
                },
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
                "capabilities": {
                    "view": true,
                    "control": false
                },
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
                "control": true
            },
            "9ab8e750-bc1e-11e8-a769-3f2e91eebf08": {
                "view": true,
                "control": false
            }
        },
        "updatedAt": new Date("2019-04-15T17:56:57.834Z"),
        "createdAt": new Date("2019-04-15T17:56:57.834Z")
    };
    classic(localDeviceUuid, instances, proxemics);
    jsonRulesEngine(localDeviceUuid, instances, proxemics);
    //nodeRules(localDeviceUuid, instances, proxemics);
    //rools(localDeviceUuid, instances, proxemics);
    //tauProlog(localDeviceUuid, instances, proxemics);
    //nools(localDeviceUuid, instances, proxemics);
}
main();