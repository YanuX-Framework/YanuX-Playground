//Electron Imports
const { remote, ipcRenderer } = require('electron')

//Async function to build the "capabilities" object
async function getCapabilities() {
    //*** CAPABILITIES ***
    //Initialize the "capabilties" object and start to fill it before returning at the end.
    const capabilities = {};

    //** DISPLAY **
    //Get the information about all the displays from the Electron's Main Process.
    //NOTE: We could probably do something similar using the "screen" object (e.g., "screen.width" and "screen.height"), "devicePixelRatio", etc.
    const displays = remote.screen.getAllDisplays()

    //A variable that stores the current device's type.
    let deviceType = 'unknown';
    //Map the displays to the an array on the capabilities object
    capabilities.display = displays.map(d => {
        //Check if the display is internal. If the property is not available consider it internal/primary if the bounds start at (0,0). 
        //Otherwise consider it external/secondary.
        const type = d.internal || (!d.bounds.x && !d.bounds.y) ? 'internal' : 'external';
        //Get the orientation and consider it to be landscaoe if rotation mod 180 = 0. Otherwisem it's portrait.
        //TODO: Perhaps I should just change this property to a numeric value that hold 0, 90, 180 or 270.
        const orientation = d.rotation % 180 ? 'portrait' : 'landscape';
        //Get the width and height from the bounds. This is actually the virtual resolution because electron automatically applies scaling to the values.
        const virtualResolution = [d.bounds.width, d.bounds.height];
        //Get the color bit-depth.
        const bitDepth = d.colorDepth;
        //Get an estimated pixelDensity from the scaleFactor. This is probably underestimating the PPI, especially on handheld device.
        const pixelDensity = d.scaleFactor * 96;
        //The scaleFactor is our pixelRatio.
        const pixelRatio = d.scaleFactor;
        //Conver the virtualResolution to the resolution using the pixelRatio.      
        const resolution = virtualResolution.map(r => r * pixelRatio);

        //Calculate the device's diagonal resolution from the resolution.
        const diagonalResolution = Math.sqrt(Math.pow(resolution[0], 2) + Math.pow(resolution[1], 2))
        //Estimate the diagonal size of the device from the diagonalResolution and pixelDensity.
        const diagonalSize = diagonalResolution / pixelDensity;
        //Calculate the aspect ratio from the resolution width and height.
        const aspectRatio = resolution[0] / resolution[1];
        //Calculate the height from the diagonal size (convert to millimeters first) and from the aspect ratio.
        const height = (diagonalSize * 25.4) / Math.sqrt(Math.pow(aspectRatio, 2) + 1);
        //Calculate the width from the aspectRatio and height.
        const width = aspectRatio * height;
        //Save the two width and height sizes.
        const size = [width, height];

        //Infer the device type from its internal display size
        if(type === 'internal') {
            //If it's smaller than 2 inches it's probably a smartwatch.
            if(diagonalSize < 2.0) {
                deviceType = 'smartwatch';
            //If it's smaller than 7 inches it's probably a smartphone.
            } else if(diagonalSize < 7.0) {
                deviceType = 'smartphone';
            //Otherwise, it's hard to be sure.
            //I could combine screen size with input types to try to infer a more concrete device type, but I'll leave as other for now!
            } else {
                deviceType = 'other';
            }
        }

        //Return all the information regarding the display.
        return { type, size, orientation, resolution, bitDepth, pixelDensity, pixelRatio, virtualResolution }
    });
    //Store the current device's type in the capabilities object.
    capabilities.type = deviceType;

    //** SPEAKERS **
    //Create an audio context
    const audioCtx = new AudioContext();
    capabilities.speakers = {
        //The audio context does not provide enough information to determine the time of speakers. So I'll just set them to unknown.
        type: 'unknown',
        //Get the maximum number of channels in the destination of the audio context.
        channels: audioCtx.destination.maxChannelCount,
        //Get the audio context sample rate.
        samplingRate: audioCtx.sampleRate
    }
    //Close the Audio Context
    audioCtx.close();

    //** MICROPHONE **
    //Execute the following code and just continue if something bad happens.
    try {
        //Request an audio stream with an absurd number of channels, sample rate, and sample size.
        //We should get a stream that is as close as possible to these requirements.
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                channelCount: { ideal: 32 },
                sampleRate: { ideal: 192000 },
                sampleSize: { ideal: 64 },
            }
        });
        //We then map each of the tracks of the stream (probably just one) to the microphone array on the capabilities object.
        capabilities.microphone = stream.getTracks().map(track => {
            //We get the settings of the track so that we can get the information that characterizes the microphone.
            const trackSettings = track.getSettings();
            //We prepare an object with the microphone's capabilities.
            const microphone = {
                //If channelCount is unavailable we just consider it to have one channel since a track can't have 0.
                channels: trackSettings.channelCount ? trackSettings.channelCount : 1,
                //The sampleSize is the bitDepth
                bitDepth: trackSettings.sampleSize,
                samplingRate: trackSettings.sampleRate
            }
            //We stop the track since we don't need it anymore.
            track.stop();
            //Return the information about the microphone.
            return microphone;
        });
    }
    //If something bad happens just log the error to the console.
    catch (e) { console.error(e); }

    //** CAMERA **
    //Execute the following code and just continue if something bad happens.
    try {
        //Request a video stream with an absurd number of width, height and frame rate.
        //We should get a stream that is as close as possible to these requirements.
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 4096 },
                height: { ideal: 4096 },
                frameRate: { ideal: 1024 }
            }
        });
        //We then map each of the tracks of the stream (probably just one) to the camera array on the capabilities object.
        capabilities.camera = stream.getTracks().map(track => {
            //We get the settings of the track so that we can get the information that characterizes the camera.
            const trackSettings = track.getSettings();
            //We prepare an object with the cameras's capabilities.
            const camera = {
                type: 'webcam',
                resolution: [trackSettings.width, trackSettings.height],
                refreshRate: trackSettings.frameRate
            }
            //We stop the track since we don't need it anymore.
            track.stop();
            //Return the information about the camera.
            return camera;
        });
    }
    //If something bad happens just log the error to the console.
    catch (e) { console.error(e); }

    //** INPUT **
    //Prepare an empty array for the supported input types.
    capabilities.input = [];

    //Use the "any-pointer" media feature to check if a pointer is present and how accurate it is.
    //A fine pointer is probably a mouse.
    if (matchMedia('(any-pointer: fine)').matches) {
        capabilities.input.push('mouse')
    }
    //A coarse pointer is probably a touchscreen.
    if (matchMedia('(any-pointer: coarse)').matches) {
        capabilities.input.push('touchscreen')
    }
    //Check for Keyboard API support.
    //If supported and the size of the keyboard is > 0 than the device should have a keyboard.
    if (navigator.keyboard && (await navigator.keyboard.getLayoutMap()).size > 0) {
        capabilities.input.push('keyboard');
    }

    //Use the standard SpeechRecognition class or the prefixed webkitSpeechRecognition
    //(I think that the standard one is not available on any browser)
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    //If SpeechRecognition API is supported.
    if (SpeechRecognition) {
        //Execute the following code and just continue if something bad happens.
        try {
            //Build a promise around the SpeechRecognition API and its events.
            const speechRecognitionSupported = await new Promise((resolve, reject) => {
                //New SpeechRecognition object.
                const recognition = new SpeechRecognition();
                //Register funtions for the onstart and onerror events
                //If the speech recognition process starts...
                recognition.onstart = function () {
                    //Then resolve the promise as true...
                    resolve(true)
                    //And stop the speech recognition.
                    recognition.stop();
                };
                //If an error happened just reject the promise.
                recognition.onerror = e => { reject(e) };
                //Start the speech recognition.
                recognition.start();
            });
            //If the promise resolved successfuly...
            if (speechRecognitionSupported) {
                //Then we have speech input support
                capabilities.input.push('speech input')
            }
        }
        //If something bad happens just log the error to the console.
        catch (e) { console.error(e); }
    }

    //** SENSORS **
    //Prepare an empty array for the supported sensor types.
    capabilities.sensors = [];
    //Check for Geolocation API support
    if (navigator.geolocation) {
        //Execute the following code and just continue if something bad happens.
        try {
            //Wrap a promise around Geolocation's API getCurrentPosition(...)
            const position = await new Promise((resolve, reject) => {
                //On sucess resolve the promise with the position, on error reject it with the error.
                navigator.geolocation.getCurrentPosition(resolve, reject);
            });
            //If the position was resolved, than we have location support. 
            if (position) { capabilities.sensors.push('location'); }
        }
        //If something bad happens just log the error to the console.
        catch (e) { console.error(e); }
    }
    //Log if Geolocation is not supported. 
    else { console.log('Geolocation is not supported.') }

    //This function receiver a sensor from the Generic Sensor API and checks if it is supported.
    let checkSensorSupport = async (sensor) => new Promise((resolve, reject) => {
        //If the sensor is sucessfully activated...
        sensor.onactivate = e => {
            //Resolve the promise with the event information.
            resolve(e);
            //Stop the sensor since we no longer need it.
            sensor.stop();
        }
        //If an error occurs, just reject the promise with the error value.
        sensor.onerror = e => { reject(e) };
        //Start the sensor
        sensor.start();
    });

    //Check if the Accelerometer class exists.
    if (window.Accelerometer) {
        //Execute the following code and just continue if something bad happens.
        try {
            //Execute the checkSensorSupport function with an Accelerometer object and await for the result.
            const result = await checkSensorSupport(new Accelerometer());
            //If the result came, than it means that the accelerometer is supported.
            if (result) { capabilities.sensors.push('accelerometer'); }
        }
        //If something bad happens just log the error to the console.
        catch (e) { console.error(e); }
    }
    //Log if the Accelerometer class is not supported.
    else { console.log('Acceleromenter is not supported.'); }

    //Check if the Gyroscope class exists.
    if (window.Gyroscope) {
        //Execute the checkSensorSupport function with an Gyroscope object and await for the result.
        try {
            //Execute the checkSensorSupport function with an Gyroscope object and await for the result.
            const result = await checkSensorSupport(new Gyroscope());
            //If the result came, than it means that the gyroscope is supported.
            if (result) { capabilities.sensors.push('gyroscope'); }
        }
        //If something bad happens just log the error to the console.
        catch (e) { console.error(e); }
    }
    //Log if the Gyroscope class is not supported. 
    else { console.log('Gyroscope is not supported'); }

    //Check if the Magnetometer class exists.
    if (window.Magnetometer) {
        //Execute the checkSensorSupport function with an Magnetometer object and await for the result.
        try {
            //Execute the checkSensorSupport function with an Magnetometer object and await for the result.
            await checkSensorSupport(new Magnetometer());
            //If the result came, than it means that the magnetometer is supported.
            capabilities.sensors.push('magnetometer');
        }
        //If something bad happens just log the error to the console.
        catch (e) { console.error(e); }
    }
    //Log if the Magnetometer class is not supported.
    else { console.log('Magnetometer is not supported.'); }

    //Check if the AmbientLightSensor class exists.
    if (window.AmbientLightSensor) {
        //Execute the checkSensorSupport function with an AmbientLightSensor object and await for the result.
        try {
            //Execute the checkSensorSupport function with an AmbientLightSensor object and await for the result.
            await checkSensorSupport(new AmbientLightSensor());
            //If the result came, than it means that the light sensor is supported.
            capabilities.sensors.push('light');
        }
        //If something bad happens just log the error to the console.
        catch (e) { console.error(e); }
    }
    //Log if the AmbientLightSensor class is not supported.
    else { console.log('AmbientLightSensor is not supported.'); }

    //Check if the ProximitySensor class exists.
    if (window.ProximitySensor) {
        //Execute the checkSensorSupport function with an ProximitySensor object and await for the result.
        try {
            //Execute the checkSensorSupport function with an ProximitySensor object and await for the result.
            await checkSensorSupport(new ProximitySensor());
            //If the result came, than it means that the proximity sensor is supported.
            capabilities.sensors.push('proximity');
        }
        //If something bad happens just log the error to the console.
        catch (e) { console.error(e); }
    }
    //Log if the ProximitySensor class is not supported.
    else { console.log('ProximitySensor is not supported.'); }

    //Return the capabilities object.
    return capabilities;
}

async function main() {
    //Execute the getCapabilities() function to get an object with all of the device's capabilities.
    const capabilities = await getCapabilities();
    //Log the object for debugging.
    console.log('Capabilities', capabilities);
    //Send the object to Electron's Main Process.
    ipcRenderer.send('asynchronous-message', capabilities);
}

//Execute the main function!
main();
