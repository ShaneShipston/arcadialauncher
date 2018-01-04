const stripAnsi = require('strip-ansi');

class Console {
    constructor(options = []) {
        this.options = Object.assign({
            output: null,
        }, options);
    }
    log(line) {
        this.options.output.value += `${stripAnsi(line.toString())}`;
        this.options.output.scrollTop = this.options.output.scrollHeight;
    }
    clear() {
        this.options.output.value = '';
    }
}

// expose the class
module.exports = Console;
