import Project from './project';
import Store from './store';

export default class Projects {
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
            this.projects.splice(projectIndex, 1);
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
        return this.projects.find(potential => potential.get('domain') === domain);
    }
    findIndex(domain) {
        return this.projects.findIndex(potential => potential.get('domain') === domain);
    }
    sortByAge(direction = 'asc') {
        if (direction === 'desc') {
            return this.projects.slice().reverse();
        }

        return this.projects;
    }
    sortAlphabetically(direction = 'asc') {
        if (direction === 'asc') {
            return this.projects.slice().sort((a, b) => {
                const nameA = a.get('domain').toUpperCase();
                const nameB = b.get('domain').toUpperCase();

                if (nameA < nameB) {
                    return -1;
                }

                if (nameA > nameB) {
                    return 1;
                }

                return 0;
            });
        }

        return this.projects;
    }
}
