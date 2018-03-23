const path = require('path');

module.exports = {
    entry: './src/js/application.js',
    output: {
        path: path.resolve(__dirname, 'javascripts/renderer'),
        filename: 'application.js',
    },
    target: 'electron',
    module: {
        rules: [{
            test: /\.js$/,
            exclude: /node_modules/,
            use: 'babel-loader',
        }],
    },
};
