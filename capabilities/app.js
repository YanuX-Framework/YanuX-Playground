//TODO: Migrate this code into YanuX Desktop Client, along with the Electron Main and Renderer Processes
//Import spawn from the child_process module.
const { spawn } = require('child_process');
//Import the util module.
const util = require('util');

//Launch the electron main process using spawn.
const capabiltiesCollector = spawn('npx', ['electron', './main/main.js'], { shell: true });

//The empty JSON string that we will fill from the output of the Electron's Main Process.
let capabilitiesJson = '';
//A string to be filled by anything that came from Electron's Main Process stderr.
let error = '';

//When data comes from the Electron's Main Process stdout.
capabiltiesCollector.stdout.on('data', data => {
    //Concatenate it into the Capabilities JSON string.
    capabilitiesJson += data;
});

//When data comes from the Electron's Main Process stderr.
capabiltiesCollector.stderr.on('data', data => {
    //Concatenate it into the error string.
    error += data
});

//Once the process quits
capabiltiesCollector.on('close', code => {
    //If there was no error output
    if (!error) {
        const capabilities = JSON.parse(capabilitiesJson);
        console.log(util.inspect(capabilities, false, null, true));
    }
    //Otherwise print any error messages.
    else {
        console.error(error);
    }
    //Print the exit code.
    console.log(`Exit Code: ${code}`);
});