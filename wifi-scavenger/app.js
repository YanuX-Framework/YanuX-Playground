const wifi = require('node-wifi');

const initWifi = () => {
    // Initialize wifi module
    // Absolutely necessary even to set interface to null
    wifi.init({
        iface: null // network interface, choose a random wifi interface if set to null
    });
}

const scanWifiNetworks = () => {
    // Scan networks
    const start = new Date();
    wifi.scan((error, networks) => {
        const end = new Date();
        if (error) { console.log(error); }
        else { console.log(networks); }
        console.log('Elapsed Time (ms):', end - start);
        //scanWifiNetworks();
    });
}

const main = () => {
    initWifi();
    scanWifiNetworks();
}

main();