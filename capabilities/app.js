const Nightmare = require("nightmare")

const getBounds = async () => {
  const nm = new Nightmare({
    webPreferences: {
      nodeIntegration: true,
    },
  });
  const bounds = nm
    .goto('about:blank')
    .evaluate(() => {
      const electron = require('electron');
      const displays = electron.screen.getAllDisplays()
      const display = displays.find((d) => d.bounds.x !== 0 || d.bounds.y !== 0) || displays[0];
      return display.bounds;
    }).end();
  return bounds;
};

const main = async () => {
    const bounds = await getBounds();
    console.log('Bounds:', bounds);
};

main();
