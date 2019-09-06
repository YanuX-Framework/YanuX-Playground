const Nightmare = require("nightmare")

const getCapabilities = async () => {
  const nm = new Nightmare({
    webPreferences: {
      nodeIntegration: true
    },
  });
  const bounds = nm
    .goto('https://example.com/')
    .evaluate(async () => {
      const electron = require('electron');
      const capabilities = {
        debug: {}
      };

      const displays = electron.screen.getAllDisplays()
      //capabilities.debug.displays = displays;

      capabilities.display = displays.map(d => {
        const type = d.internal || (!d.bounds.x && !d.bounds.y) ? "internal" : "external";
        const orientation = d.rotation % 180 ? "portrait" : "landscape";
        const virtualResolution = [d.bounds.width, d.bounds.height];
        const bitDepth = d.colorDepth;
        const pixelDensity = d.scaleFactor * 96;
        const pixelRatio = d.scaleFactor;

        const resolution = virtualResolution.map(r => r * pixelRatio);

        const diagonalResolution = Math.sqrt(Math.pow(resolution[0], 2) + Math.pow(resolution[1], 2))
        const diagonalSize = diagonalResolution / pixelDensity;
        const aspectRatio = resolution[0] / resolution[1];
        const height = (diagonalSize * 25.4) / Math.sqrt(Math.pow(aspectRatio, 2) + 1);
        const width = aspectRatio * height;
        const size = [width, height];

        return { type, size, orientation, resolution, bitDepth, pixelDensity, pixelRatio, virtualResolution }
      });

      const mediaDevices = await navigator.mediaDevices.enumerateDevices();

      const audioOutputDevices = mediaDevices.filter(device => device.kind === 'audiooutput');
      if(audioOutputDevices.length > 0) {
        const audioCtx = new window.AudioContext();
        capabilities.speakers = {
          type: 'unknown',
          channels: audioCtx.destination.maxChannelCount,
          samplingRate: audioCtx.sampleRate
        }
      }
      
      const audioInputDevices = mediaDevices.filter(device => device.kind === 'audioinput');
      capabilities.microphone = audioInputDevices.length > 0;

      const videoInputDevices = mediaDevices.filter(device => device.kind === 'videoinput');
      if (videoInputDevices.length > 0) {
        capabilities.camera = {};
        for (var i = 128; i <= 3840; i += 128) {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { width: { exact: i } } });
            stream.getTracks().forEach(function (track) {
              const trackSettings = track.getSettings();
              capabilities.camera = {
                type: "webcam",
                resolution: [trackSettings.width, trackSettings.height],
                refreshRate: trackSettings.frameRate
              }
              track.stop();
            })
          } catch (e) { capabilities.debug.camera = e.toString(); break; }
        }
      }
      return capabilities;
    }).end();
  return bounds;
};

const main = async () => {
  const util = require('util');
  const capabilities = await getCapabilities();
  console.log(util.inspect(capabilities, false, null, true))
};

main();