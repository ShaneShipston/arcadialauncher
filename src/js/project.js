import path from 'path';

export default class Project {
    constructor(data = {}) {
        this.data = Object.assign({}, {
            domain: null,
            theme: null,
            repo: null,
            tld: 'vm',
            type: 'wordpress',
            directory: null,
        }, data);
    }
    all() {
        return this.data;
    }
    assign(data) {
        this.data = Object.assign(this.data, data);
    }
    get(key) {
        return this.data[key];
    }
    set(key, value) {
        this.data[key] = value;
    }
    has(key) {
        return Object.prototype.hasOwnProperty.call(this.data, key) && this.data[key] !== null;
    }
    getDomain() {
        return this.get('domain');
    }
    getTheme() {
        return this.get('theme') !== null ? this.get('theme') : this.getDomain();
    }
    getDomainName() {
        return `${this.getDomain()}.${this.get('tld')}`;
    }
    getURL(uri = '') {
        return `http://${this.getDomainName()}/${uri}`;
    }
    getDirectory() {
        return path.join(this.get('directory'), 'sites', this.getDomain());
    }
    getThemeDirectory() {
        return path.join(this.getDirectory(), 'wp-content', 'themes', this.getTheme());
    }
    getWorkingDirectory() {
        return this.get('type') === 'wordpress' ? this.getThemeDirectory() : this.getDirectory();
    }
    getRepo() {
        return this.get('repo') !== null ? this.get('repo') : `shoutmedia/${this.getDomain()}`;
    }
    getRepoURL() {
        return `https://bitbucket.org/${this.getRepo()}`;
    }
    getBackups() {
        if (!this.has('backups')) {
            return [];
        }

        return this.data.backups;
    }
}
