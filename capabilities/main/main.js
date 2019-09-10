const { app, BrowserWindow, ipcMain } = require('electron');

function createWindow () {
  // Create the browser window.
  let win = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true
    },
    //show: false
  });
  win.loadFile('../window/index.html');
  ipcMain.on('asynchronous-message', (event, arg) => {
    console.log(JSON.stringify(arg));
    app.quit();
  });
}

app.on('ready', createWindow);