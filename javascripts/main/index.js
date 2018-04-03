const { app, BrowserWindow } = require('electron');
const windowStateKeeper = require('electron-window-state');
const path = require('path');
const json = require('../../package.json');

let arcadiaWindow;

const isSecondInstance = app.makeSingleInstance(() => {
    if (arcadiaWindow) {
        if (arcadiaWindow.isMinimized()) {
            arcadiaWindow.restore();
        }

        arcadiaWindow.focus();
    }
})

if (isSecondInstance) {
    app.quit();
}

app.on('ready', function() {
    let mainWindowState = windowStateKeeper({
        defaultWidth: json.settings.width,
        defaultHeight: json.settings.height,
    });

    arcadiaWindow = new BrowserWindow({
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

    mainWindowState.manage(arcadiaWindow);

    arcadiaWindow.loadURL('file://' + path.join(__dirname, '..', '..') + '/index.html');

    arcadiaWindow.webContents.on('did-finish-load', function() {
        arcadiaWindow.webContents.send('loaded', {
            appName: json.name,
            appVersion: json.version,
        });
    });

    arcadiaWindow.on('closed', function() {
        arcadiaWindow = null;
    });
});
