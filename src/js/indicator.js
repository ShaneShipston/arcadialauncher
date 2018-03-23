export default class Indicator {
    constructor(options = []) {
        this.options = Object.assign({
            element: null,
            status: 'idle',
            state: null,
        }, options);

        this.setStatus(this.options.status);
        this.setState(this.options.state);
    }
    setStatus(status = null) {
        if (this.options.element === null) {
            return;
        }

        this.options.element.classList.remove('led-blue', 'led-red', 'led-yellow', 'led-green', 'led-blank');

        this.setState();

        switch (status) {
            case 'verifying':
                this.options.element.classList.add('led-yellow');
                this.setState('running');
                break;
            case 'running':
                this.options.element.classList.add('led-blue');
                this.setState('running');
                break;
            case 'error':
                this.options.element.classList.add('led-red');
                break;
            case 'complete':
                this.options.element.classList.add('led-green');
                break;
            case 'idle':
            default:
                this.options.element.classList.add('led-blank');
                break;
        }
    }
    setState(state = null) {
        if (this.options.element === null) {
            return;
        }

        this.options.element.classList.remove('running', 'fast');

        switch (state) {
            case 'processing':
                this.options.element.classList.add('fast');
                break;
            case 'running':
                this.options.element.classList.add('running');
                break;
        }
    }
}
