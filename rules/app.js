const _ = require("lodash");

class ObjectId {
    constructor(id) {
        this.id = id;
    }
    toString() {
        return this.id;
    }
}

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
const activeInstances = instances.filter(i => i.active);

const proxemicsData = {
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
const proxemics = proxemicsData.state;
const componentsDistribution = _.cloneDeep(proxemics);

const defaultComponentsConfig = {
    view: false,
    control: false
}
let componentsConfig;
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
} else {
    componentsConfig = defaultComponentsConfig;
}
console.log("---- Classic ----");
console.log(componentsConfig);

//console.log("---- JSON Rules Engines ----");
//https://github.com/cachecontrol/json-rules-engine
//https://www.npmjs.com/package/json-rules-engine
//https://github.com/CacheControl/json-rules-engine/blob/master/docs/almanac.md
//const { Engine } = require('json-rules-engine');
//let engine = new Engine();

console.log("---- Node Rules ----");
//https://github.com/mithunsatheesh/node-rules
//https://www.npmjs.com/package/node-rules
let RuleEngine = require("node-rules");
/* Creating Rule Engine instance */
let R = new RuleEngine();
/* Register Rule */
R.register({
    "condition": function(R) {
        R.when(this.proxemics[this.localDeviceUuid]);
    },
    "consequence": function(R) {
        this.viewAndControlDevices = _.pickBy(proxemics, (caps, deviceUuid) => {
            return caps.view === true && caps.control === true && _.some(activeInstances, instance => deviceUuid === instance.device.deviceUuid);
        });
        this.viewOnlyDevices = _.pickBy(proxemics, (caps, deviceUuid) => {
            return caps.view === true && caps.control === false && _.some(activeInstances, instance => deviceUuid === instance.device.deviceUuid);
        });
        this.controlOnlyDevices = _.pickBy(proxemics, (caps, deviceUuid) => {
            return caps.view === false && caps.control === true && _.some(activeInstances, instance => deviceUuid === instance.device.deviceUuid);
        });
        R.next();
    }
});

R.register({
    "condition": function(R) {
        R.when(this.proxemics[this.localDeviceUuid]);
    },
    "consequence": function(R) {
        this.componentsConfig = this.componentsDistribution[this.localDeviceUuid];
        R.next();
    }
});

R.register({
    "condition": function(R) {
        R.when(!this.proxemics[this.localDeviceUuid]);
    },
    "consequence": function(R) {
        this.componentsConfig = this.defaultComponentsConfig;
        R.next();
    }
});

R.register({
    "condition": function(R) {
        R.when(!_.isEmpty(this.viewOnlyDevices));
    },
    "consequence": function(R) {
        for (let deviceUuid in this.viewAndControlDevices) {
            this.componentsDistribution[deviceUuid].view = false;
        }
        R.next();
    }
});

R.register({
    "condition": function(R) {
        R.when(!_.isEmpty(this.controlOnlyDevices));
    },
    "consequence": function(R) {
        for (let deviceUuid in this.viewAndControlDevices) {
            this.componentsDistribution[deviceUuid].view = false;
        }
        R.next();
    }
});

let fact = {
    localDeviceUuid,
    proxemics,
    activeInstances,
    componentsDistribution,
    defaultComponentsConfig: {
        view: false,
        control: false
    }
};

R.execute(fact, function (data) {
    console.log(data.componentsConfig);
});

//console.log("---- rools ----");
//https://github.com/frankthelen/rools
//https://www.npmjs.com/package/rools
//const { Rools, Rule } = require('rools');

//console.log("---- Tau Prolog ----");
//http://tau-prolog.org/
//https://github.com/jariazavalverde/tau-prolog
//https://www.npmjs.com/package/tau-prolog
//https://github.com/jariazavalverde/tau-prolog/blob/master/examples/nodejs/fruit.js
//let pl = require( "tau-prolog" );
//require("tau-prolog/modules/lists")(pl);
//let session = pl.create(1000);

//console.log("---- bspec ----");
//https://github.com/gchudnov/bspec
//https://www.npmjs.com/package/bspec
//const Spec = require('bspec').PromiseSpec;

//const nools = require("nools");
//console.log("---- nools ----");
//https://www.npmjs.com/package/nools
//https://github.com/noolsjs/nools