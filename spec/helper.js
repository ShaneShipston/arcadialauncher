var path = require('path');

module.exports = {
  appPath: function() {
    switch (process.platform) {
      case 'darwin':
        return path.join(__dirname, '..', '.tmp', 'mac', 'Testing.app', 'Contents', 'MacOS', 'Testing');
      case 'linux':
        return path.join(__dirname, '..', '.tmp', 'linux', 'Testing');
      default:
        throw 'Unsupported platform';
    }
  }
};
