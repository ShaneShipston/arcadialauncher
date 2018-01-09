class Project {
    constructor(data = {}) {
        this.data = Object.assign({}, this.structure(), data);
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
        return this.data.hasOwnProperty(key);
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
        return `sites/${this.getDomain()}`;
    }
    getThemeDirectory() {
        return `${this.getDirectory()}/wp-content/themes/${this.getTheme()}`;
    }
    getRepo() {
        return this.get('repo') !== null ? this.get('repo') : `shoutmedia/${this.getDomain()}`;
    }
    structure() {
        return {
            domain: null,
            theme: null,
            repo: null,
            tld: 'vm',
            type: 'WordPress',
        };
    }
}

module.exports = Project;
