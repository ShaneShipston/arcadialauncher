import path from 'path';
import { exec, spawn } from 'child_process';
import Indicator from './indicator';

export default class Server {
    constructor(options = []) {
        this.options = Object.assign({
            directory: null,
            terminal: null,
            indicator: null,
        }, options);

        this.indicator = null;

        if (this.options.indicator !== null) {
            this.indicator = new Indicator({
                element: this.options.indicator,
            });
        }
    }
    init() {
        return this.command('git', [
            'clone',
            'https://ShaneShipston@bitbucket.org/ShaneShipston/arcadiadirectory.git',
            this.options.directory,
        ]).then(() => {
            return this.boot();
        });
    }
    boot() {
        return this.command('bash', [
            path.join(this.options.directory, 'scripts', 'boot-server.sh'),
            '--directory',
            this.options.directory,
        ])
        .then(() => {
            this.options.terminal.log('\nServer running!');
            this.setIndicatorStatus('complete');
        });
    }
    status() {
        return new Promise((resolve, reject) => {
            exec(`cd ${this.options.directory} && vagrant status --machine-readable | grep state,running`, (error, stdout) => {
                if (stdout) {
                    resolve(true);
                } else {
                    resolve(false);
                }
            });
        });
    }
    command(command, args = [], callback = () => {}) {
        this.options.terminal.setIndicatorStatus('running');
        this.setIndicatorState('running');

        return new Promise((resolve, reject) => {
            const longRunning = spawn(command, args);

            longRunning.stdout.on('data', (data) => {
                this.options.terminal.log(data);
            });

            longRunning.stderr.on('data', (data) => {
                this.options.terminal.log(data);
            });

            longRunning.on('close', (code) => {
                this.options.terminal.setIndicatorStatus('complete');
                this.setIndicatorState();
                resolve(this.options.terminal);
                callback(code);
            });
        });
    }
    bash(script, args) {
        return this.command('bash', [
            path.join(this.options.directory, 'scripts', 'bootstrap.sh'),
            '--directory',
            this.options.directory,
            '--script',
            script,
            ...args,
        ]);
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
    exec(command, callback = () => {}) {
        exec(`cd ${this.options.directory} && ${command}`, callback);
    }
}
