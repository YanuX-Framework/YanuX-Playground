const { spawn } = require('child_process');
const util = require('util');

const capabiltiesCollector = spawn('npx', ['electron', './main/main.js']);
let capabilitiesJson = '';
let error = '';

capabiltiesCollector.stdout.on('data', (data) => {
    capabilitiesJson += data;
});

capabiltiesCollector.stderr.on('data', (data) => {
    error += data
});

capabiltiesCollector.on('close', (code) => {
    if (!error) {
        const capabilities = JSON.parse(capabilitiesJson);
        console.log(util.inspect(capabilities, false, null, true));
    }
    console.log(`Exit Code: ${code}`);
});