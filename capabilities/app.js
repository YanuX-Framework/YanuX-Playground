const Nightmare = require('nightmare')

const getCapabilities = async () => {
  const nm = new Nightmare({
    webPreferences: {
      nodeIntegration: true
    },
    switches: {
      'ignore-certificate-errors': true
    }
  });
  const bounds = nm
    .goto('https://albuquerques.net/yanux/desktopclient/capabilities/')
    .evaluate(async () => {
      const electron = require('electron');
      const capabilities = { debug: {} };

      const displays = electron.screen.getAllDisplays()
      //capabilities.debug.displays = displays;

      capabilities.display = displays.map(d => {
        const type = d.internal || (!d.bounds.x && !d.bounds.y) ? 'internal' : 'external';
        const orientation = d.rotation % 180 ? 'portrait' : 'landscape';
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

      const audioCtx = new AudioContext();
      capabilities.speakers = {
        type: 'unknown',
        channels: audioCtx.destination.maxChannelCount,
        samplingRate: audioCtx.sampleRate
      }
      await audioCtx.close();

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: { ideal: 32 },
            sampleRate: { ideal: 192000 },
            sampleSize: { ideal: 64 },
          }
        });
        capabilities.microphone = stream.getTracks().map(function (track) {
          const trackSettings = track.getSettings();
          const microphone = {
            channels: trackSettings.channelCount ? trackSettings.channelCount : 1,
            bitDepth: trackSettings.sampleSize,
            samplingRate: trackSettings.sampleRate
          }
          track.stop();
          return microphone;
        });
      } catch (e) { capabilities.debug.microphone = e.toString(); }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 4096 },
            height: { ideal: 4096 },
            frameRate: { ideal: 1024 }
          }
        });
        capabilities.camera = stream.getTracks().map(function (track) {
          const trackSettings = track.getSettings();
          const camera = {
            type: 'webcam',
            resolution: [trackSettings.width, trackSettings.height],
            refreshRate: trackSettings.frameRate
          }
          track.stop();
          return camera;
        });
      } catch (e) { capabilities.debug.camera = e.toString(); }

      capabilities.input = [];
      
      if (matchMedia('(any-pointer: fine)').matches) {
        capabilities.input.push('mouse')
      }
      
      if (matchMedia('(any-pointer: coarse)').matches) {
        capabilities.input.push('touchscreen')
      }

      if (navigator.keyboard && (await navigator.keyboard.getLayoutMap()).size) {
        capabilities.input.push('keyboard');
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