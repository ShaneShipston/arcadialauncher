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
    getURL() {
        return `http://${this.get('domain')}.${this.get('tld')}/`;
    }
    getDomainName() {
        return `${this.get('domain')}.${this.get('tld')}`;
    }
    getDomain() {
        return this.get('domain');
    }
    getDirectory() {
        return `sites/${this.get('domain')}`;
    }
    getThemeDirectory() {
        return `${this.getDirectory()}/wp-content/themes/${this.get('theme')}`;
    }
    getRepo() {
        return this.get('repo') !== null ? this.get('repo') : `shoutmedia/${this.get('domain')}`;
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
