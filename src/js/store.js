import electron from 'electron';
import path from 'path';
import fs from 'fs';

export default class Store {
    constructor(options = []) {
        this.options = Object.assign({
            configName: null,
            defaults: null,
        }, options);

        const userDataPath = (electron.app || electron.remote.app).getPath('userData');
        this.path = path.join(userDataPath, `${this.options.configName}.json`);
        this.data = Object.assign({}, this.options.defaults, this.parseFile());
    }
    get(key) {
        return this.data[key];
    }
    set(key, val) {
        this.data[key] = val;
        this.write();
    }
    assign(values = {}) {
        this.data = Object.assign({}, this.data, values);
        this.write();
    }
    write() {
        fs.writeFileSync(this.path, JSON.stringify(this.data));
    }
    parseFile() {
        try {
            return JSON.parse(fs.readFileSync(this.path));
        } catch (error) {
            return {};
        }
    }
}
