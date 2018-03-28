import stripAnsi from 'strip-ansi';
import Indicator from './indicator';

export default class Console {
    constructor(options = []) {
        this.options = Object.assign({
            output: null,
            indicator: null,
        }, options);

        this.indicator = null;

        if (this.options.indicator !== null) {
            this.indicator = new Indicator({
                element: this.options.indicator,
            });
        }
    }
    setIndicatorStatus(status = null) {
        if (this.indicator !== null) {
            this.indicator.setStatus(status);
        }
    }
    setIndicatorState(state = null) {
        if (this.indicator !== null) {
            this.indicator.setState(state);
        }
    }
    log(line) {
        this.options.output.value += `${stripAnsi(line.toString())}`;
        this.focusBottom();
    }
    clear() {
        this.options.output.value = '';
        this.setIndicatorStatus('idle');
    }
    focusBottom() {
        this.options.output.scrollTop = this.options.output.scrollHeight;
    }
}
