const { app, BrowserWindow } = require('electron');
const windowStateKeeper = require('electron-window-state');
const path = require('path');
const json = require('../../package.json');

let window;

app.on('ready', function() {
    let mainWindowState = windowStateKeeper({
        defaultWidth: json.settings.width,
        defaultHeight: json.settings.height,
    });

    window = new BrowserWindow({
        title: json.name,
        x: mainWindowState.x,
        y: mainWindowState.y,
        width: mainWindowState.width,
        height: mainWindowState.height,
        minWidth: 800,
        minHeight: 400,
        frame: false,
        backgroundColor: '#2a3542',
    });

    mainWindowState.manage(window);

    window.loadURL('file://' + path.join(__dirname, '..', '..') + '/index.html');

    window.webContents.on('did-finish-load', function(){
        window.webContents.send('loaded', {
            appName: json.name,
            appVersion: json.version,
        });
    });

    window.on('closed', function() {
        window = null;
    });
});
