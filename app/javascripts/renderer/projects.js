const Project = require('./project.js');
const Store = require('./store.js');

class Projects {
    constructor() {
        this.dataset = new Store({
            configName: 'projects',
            defaults: {
                domains: [],
            },
        });

        this.projects = [];

        this.dataset.get('domains').forEach((project) => {
            this.projects.push(new Project(project));
        });
    }
    store(newProject) {
        this.projects.push(newProject);
        this.save();
    }
    list() {
        return this.projects;
    }
    get(domain) {
        return this.findByDomain(domain);
    }
    update(domain, details) {
        const project = this.get(domain);

        if (project !== null) {
            project.assign(details);
        }

        this.save();
    }
    delete(domain) {
        const projectIndex = this.findIndex(domain);

        if (projectIndex) {
            this.projects[projectIndex].splice(projectIndex, 1);
        }

        this.save();
    }
    save() {
        const data = [];

        this.projects.forEach((project) => {
            data.push(project.all());
        });

        this.dataset.set('domains', data);
    }
    findByDomain(domain) {
        return this.projects.find((potential) => {
            return potential.get('domain') === domain;
        });
    }
    findIndex(domain) {
        return this.projects.findIndex((potential) => {
            return potential.get('domain') === domain;
        });
    }
}

// expose the class
module.exports = Projects;
