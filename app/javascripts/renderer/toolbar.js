class Toolbar {
    constructor(options = []) {
        this.options = Object.assign({
            close: null,
            maximize: null,
            minimize: null,
            restore: null,
        }, options);

        this.remote = require('electron').remote;
        this.window = this.remote.getCurrentWindow();

        if (this.options.close !== null) {
            this.close();
        }

        if (this.options.maximize !== null) {
            this.maximize();
        }

        if (this.options.minimize !== null) {
            this.minimize();
        }

        if (this.options.restore !== null) {
            this.restore();
        }
    }
    close() {
        this.options.close.addEventListener('click', () => {
            this.window.close();
        });
    }
    maximize() {
        this.options.maximize.addEventListener('click', () => {
            this.window.maximize();

            this.options.maximize.classList.add('hidden');
            this.options.restore.classList.remove('hidden');
        });
    }
    minimize() {
        this.options.minimize.addEventListener('click', () => {
            this.window.minimize();
        });
    }
    restore() {
        this.options.restore.addEventListener('click', () => {
            this.window.restore();

            this.options.restore.classList.add('hidden');
            this.options.maximize.classList.remove('hidden');
        });
    }
}

module.exports = Toolbar;
