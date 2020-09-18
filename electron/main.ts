import { app, BrowserWindow, ipcMain } from 'electron'
import * as path from 'path'
import * as url from 'url'
import { onMessage } from './messages'

let mainWindow;

console.log({
  REACT_APP_TEST_DRIVER: process.env.REACT_APP_TEST_DRIVER,
  ELECTRON_START_URL: process.env.ELECTRON_START_URL,
})

function createWindow () {
  const startUrl = process.env.ELECTRON_START_URL || url.format({
    pathname: path.join(__dirname, '../index.html'),
    protocol: 'file:',
    slashes: true,
  });
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
    }
  });
  mainWindow.loadURL(startUrl);
  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}
app.on('ready', createWindow);
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});

ipcMain.handle('message', (event, ...args) => {
  console.log({ event, args })
  return onMessage(args[0])
})

ipcMain.handle('close', () => {
  mainWindow.close()
  return true
})

