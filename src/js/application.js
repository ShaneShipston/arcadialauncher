import path from 'path';
import fs from 'fs';
import commandExists from 'command-exists';
import os from 'os';
import electron from 'electron';
import { exec } from 'child_process';
import Store from './store';
import Toolbar from './toolbar';
import Console from './console';
import Projects from './projects';
import Project from './project';
import Server from './server';

const remote = electron.remote;
const homePath = (electron.app || electron.remote.app).getPath('home');
const hostsPath = os.platform() === 'win32' ? 'C:\\Windows\\System32\\drivers\\etc\\hosts' : '/etc/hosts';

let activeProject = null;

/**
 * Defaults
 */
const appDefaults = {
    directory: path.join(homePath, 'arcadia'),
    tld: 'vm',
    startServer: false,
    openEditor: false,
    openDirectory: false,
    openRepo: false,
    openBrowser: false,
    createOpenDirectory: false,
    createOpenEditor: false,
    createOpenRepo: false,
    createOpenBrowser: false,
    initalCommit: true,
    initalCommitMsg: 'Cloned base theme',
    initalized: false,
    defaultEditor: 'subl',
    serverIP: '192.168.33.10',
    projectOrder: 'created',
};

/**
 * Settings
 */
const store = new Store({
    configName: 'app-settings',
    defaults: appDefaults,
});

/**
 * Active Projects
 */
const projects = new Projects();

/**
 * Terminal Output
 */
const terminal = new Console({
    output: document.getElementById('console-log'),
    indicator: document.querySelector('.status-console'),
});

/**
 * Server
 */
const server = new Server({
    directory: store.get('directory'),
    terminal,
    indicator: document.querySelector('.status-server'),
});

/**
 * Helpers
 */
function applySettings(screen) {
    const inputs = screen.querySelectorAll('input, select');

    Array.from(inputs).forEach((target) => {
        switch (target.getAttribute('type')) {
        case 'checkbox':
            target.checked = store.get(target.name);

            // Check for toggled elements
            if (target.hasAttribute('data-toggle')) {
                const toggleElement = document.querySelector(target.getAttribute('data-toggle'));
                if (target.checked) {
                    toggleElement.classList.remove('hidden');
                } else {
                    toggleElement.classList.add('hidden');
                }
            }

            break;
        default:
            target.value = store.get(target.name);
            break;
        }
    });
}

// function conflictChecks() {
//     const request = remote.net.request(`http://${store.get('serverIP')}`);

//     request.on('response', (response) => {
//         console.log(response.statusCode);
//     });

//     request.on('error', (error) => {
//         console.log(error);
//     });

//     request.end();

//     // check server running (vagrant status)
//     // another server is running (vagrant status fail + http access)
// }

function checkRequirements() {
    const systemChecks = document.querySelectorAll('.system-checks li[data-command]');
    const editCheck = document.querySelector('.system-checks li.edit-check');

    Array.from(systemChecks).forEach((target) => {
        if (target.classList.contains('collapse')) {
            return;
        }

        const commandToCheck = target.getAttribute('data-command');
        const icon = target.querySelector('.fa');
        const required = target.querySelector('.required');
        const version = target.querySelector('.version');

        icon.classList.remove('fa-check-circle');
        icon.classList.remove('fa-times-circle');
        icon.classList.add('fa-spinner');
        icon.classList.add('fa-spin');
        required.classList.add('hidden');

        commandExists(commandToCheck)
            .then((command) => {
                exec(`${command} --version`, (error, stdout) => {
                    version.innerHTML = stdout.replace(/[^0-9.]/g, '');

                    target.classList.add('collapse');
                    icon.classList.remove('fa-spinner');
                    icon.classList.remove('fa-spin');
                    icon.classList.add('fa-check-circle');
                });
            }).catch(() => {
                icon.classList.remove('fa-spinner');
                icon.classList.remove('fa-spin');
                icon.classList.add('fa-times-circle');
                required.classList.remove('hidden');
            });
    });

    // Hosts file edit ability
    if (editCheck.classList.contains('collapse')) {
        return;
    }

    const icon = editCheck.querySelector('.fa');
    const required = editCheck.querySelector('.required');

    fs.access(hostsPath, fs.W_OK, (err) => {
        icon.classList.remove('fa-spinner');
        icon.classList.remove('fa-spin');

        if (err) {
            icon.classList.add('fa-times-circle');
            required.classList.remove('hidden');
        } else {
            editCheck.classList.add('collapse');
            icon.classList.add('fa-check-circle');
        }
    });
}

function openPage(...elements) {
    const sections = document.querySelectorAll('.section');

    Array.from(sections).forEach((target) => {
        target.classList.add('hidden');
    });

    elements.forEach((target) => {
        const section = document.querySelector(target);
        section.classList.remove('hidden');
    });
}

function openProject(project) {
    activeProject = project;

    const projectViewer = document.querySelector('.highlighted-project');
    const domainName = projectViewer.querySelector('.domain-name');

    domainName.innerHTML = project.getDomainName();

    openPage('.highlighted-project');
}

function updateProjectList(allProjects) {
    const projectFeed = document.querySelector('.project-feed');

    projectFeed.innerHTML = '';

    allProjects.forEach((details) => {
        const tempURL = document.createElement('a');
        const tempElement = document.createElement('li');

        // Temp Patch
        if (!details.has('directory')) {
            allProjects.update(details.get('domain'), store.get('directory'));
        }
        // End Temp Path

        tempURL.innerHTML = details.getDomainName();
        tempURL.setAttribute('href', '#');

        tempURL.addEventListener('click', (e) => {
            e.preventDefault();
            openProject(details);
        });

        tempElement.appendChild(tempURL);
        projectFeed.appendChild(tempElement);
    });
}

function checkDirectoryRepo() {
    exec(`cd ${store.get('directory')} && git remote update`, (error) => {
        if (error) {
            return;
        }

        exec(`cd ${store.get('directory')} && git status -sb`, (error2, stdout) => {
            if (error2) {
                return;
            }

            const isBehind = stdout.indexOf('behind');

            if (isBehind >= 0) {
                const changeString = stdout.substring(stdout.indexOf('[', isBehind - 10) + 1, stdout.indexOf(']'));

                const aboveBelow = changeString.split(',');
                const belowCount = parseInt(aboveBelow.pop().trim().substring(7), 10);

                if (belowCount > 0) {
                    const alerts = document.querySelector('.alerts');
                    const warning = alerts.querySelector('li:first-child');

                    alerts.classList.remove('hidden');
                    warning.classList.remove('hidden');

                    warning.querySelector('.msg').innerHTML = `Your working directory is behind by ${belowCount} commit${belowCount !== 1 ? 's' : ''}`;
                }
            }
        });
    });
}

/**
 * App Loaded
 */
electron.ipcRenderer.on('loaded', () => {
    const initServerButton = document.querySelector('.init-server');

    /**
     * System Checks
     */
    checkRequirements();

    /**
     * Check folder is set up
     */
    if (store.get('initalized')) {
        initServerButton.innerHTML = 'Checking server status';

        /**
         * Repo Check
         */
        checkDirectoryRepo();

        /**
         * Check Server Status
         */
        server.setIndicatorStatus('verifying');

        server.status().then((online) => {
            if (online) {
                server.setIndicatorStatus('complete');
                initServerButton.classList.add('hidden');
            } else if (store.get('startServer')) {
                server.setIndicatorStatus('running');
                server.boot().then(() => {
                    initServerButton.classList.add('hidden');
                });
            } else {
                server.setIndicatorStatus('error');
                initServerButton.innerHTML = 'Boot server';
                initServerButton.disabled = false;
            }
        });
    } else {
        initServerButton.disabled = false;
    }

    /**
     * Populate Project Feed
     */
    switch (store.get('projectOrder')) {
    default:
    case 'created':
        updateProjectList(projects.sortByAge('asc'));
        break;
    case 'oldest':
        updateProjectList(projects.sortByAge('desc'));
        break;
    case 'alpha':
        updateProjectList(projects.sortAlphabetically());
        break;
    }

    const activeButton = document.querySelector('.project-order.active');
    const newActiveButton = document.querySelector(`.project-order[data-order="${store.get('projectOrder')}"]`);

    activeButton.classList.remove('active');
    newActiveButton.classList.add('active');
});

/**
 * Boot Server
 */
const initServer = document.querySelector('.init-server');

initServer.addEventListener('click', () => {
    if (store.get('initalized')) {
        server.boot().then(() => {
            initServer.classList.add('hidden');
        });
        return;
    }

    fs.access(path.join(store.get('directory'), 'Vagrantfile'), fs.R_OK, (err) => {
        if (err) {
            server.init().then(() => {
                initServer.classList.add('hidden');
            });
        } else {
            server.boot().then(() => {
                initServer.classList.add('hidden');
            });
        }
    });

    // Check for placeholder
    fs.readFile(hostsPath, (err, data) => {
        if (err) {
            return;
        }

        if (data.indexOf('arcadia-launcher') < 0) {
            fs.appendFile(hostsPath, '\n\n# arcadia-launcher\n# arcadia-launcher-end', () => {});
        }
    });

    store.set('initalized', true);
});

/**
 * Update Server
 */
const updateServer = document.querySelector('.update-server');

updateServer.addEventListener('click', () => {
    updateServer.classList.add('btn-load');

    exec(`cd ${store.get('directory')} && git stash && git merge origin/master`, (error) => {
        if (error) {
            return;
        }

        exec(`cd ${store.get('directory')} && find scripts -type f -print0 | xargs -0 dos2unix`, (error2) => {
            if (error2) {
                return;
            }

            const alerts = document.querySelector('.alerts');
            const warning = alerts.querySelector('li:first-child');

            alerts.classList.add('hidden');
            warning.classList.add('hidden');

            updateServer.classList.remove('btn-load');
        });
    });
});

/**
 * Ignore Alerts
 */
const ignoreAlerts = document.querySelectorAll('.ignore-alert');

Array.from(ignoreAlerts).forEach((target) => {
    target.addEventListener('click', () => {
        const alerts = document.querySelector('.alerts');
        const warning = target.closest('li');

        alerts.classList.add('hidden');
        warning.classList.add('hidden');
    });
});

/**
 * Utilities
 */
const toggleBar = document.querySelectorAll('.toggle-bar');

Array.from(toggleBar).forEach((target) => {
    target.addEventListener('click', () => {
        const element = document.getElementById(target.getAttribute('data-target'));
        const icon = target.querySelector('.fa');

        element.classList.toggle('hidden');
        target.classList.toggle('open');
        icon.classList.toggle('fa-chevron-down');
        icon.classList.toggle('fa-chevron-right');
    });
});

const toggler = document.querySelectorAll('[data-toggle]');

Array.from(toggler).forEach((target) => {
    target.addEventListener('change', (e) => {
        const toggleElement = document.querySelector(target.getAttribute('data-toggle'));

        if (e.target.checked) {
            toggleElement.classList.remove('hidden');
        } else {
            toggleElement.classList.add('hidden');
        }
    });
});

const sorting = document.querySelector('.sorting');

sorting.addEventListener('click', () => {
    const dropDown = document.querySelector('.sorting-dropdown');
    dropDown.classList.toggle('open');
});

const dropdownTriggers = document.querySelectorAll('.action-dropdown');

Array.from(dropdownTriggers).forEach((target) => {
    target.addEventListener('click', () => {
        const dropdown = target.nextElementSibling;

        if (!dropdown.classList.contains('dropdown')) {
            return;
        }

        dropdown.classList.toggle('open');
    });
});

const projectOrdering = document.querySelectorAll('.project-order');

Array.from(projectOrdering).forEach((target) => {
    target.addEventListener('click', () => {
        if (target.classList.contains('active')) {
            return;
        }

        const activeButton = document.querySelector('.project-order.active');

        activeButton.classList.remove('active');
        target.classList.add('active');

        switch (target.getAttribute('data-order')) {
        default:
        case 'created':
            updateProjectList(projects.sortByAge('asc'));
            break;
        case 'oldest':
            updateProjectList(projects.sortByAge('desc'));
            break;
        case 'alpha':
            updateProjectList(projects.sortAlphabetically());
            break;
        }

        store.set('projectOrder', target.getAttribute('data-order'));

        const dropDown = document.querySelector('.sorting-dropdown');
        dropDown.classList.remove('open');
    });
});

/**
 * External Links
 */
document.addEventListener('click', (event) => {
    if (event.target.tagName === 'A' && event.target.href.startsWith('http')) {
        event.preventDefault();
        electron.shell.openExternal(event.target.href);
    }
});

/**
 * Toolbar
 */
new Toolbar({
    close: document.querySelector('.window-actions .fa-times'),
    minimize: document.querySelector('.window-actions .fa-window-minimize'),
    maximize: document.querySelector('.window-actions .fa-window-maximize'),
    restore: document.querySelector('.window-actions .fa-window-restore'),
});

/**
 * Navigation
 */
const openProjects = document.querySelector('.primary-nav .open-projects');
const openSettings = document.querySelector('.primary-nav .open-settings');
const openConsole = document.querySelector('.primary-nav .open-console');
const openImport = document.querySelector('.import-project-btn');
const newProject = document.querySelector('.new-project-btn');

openProjects.addEventListener('click', (e) => {
    e.preventDefault();
    openPage('.dashboard');
});
const pageTriggers = document.querySelectorAll('[data-page]');

openConsole.addEventListener('click', () => {
    openPage('.console');
    terminal.focusBottom();
});

openSettings.addEventListener('click', (e) => {
    e.preventDefault();
    openPage('.settings');
});

openImport.addEventListener('click', () => {
    openPage('.import-project');
});

newProject.addEventListener('click', () => {
    document.querySelector('.domain-tld').innerHTML = `.${store.get('tld')}`;
    openPage('.new-project');
});

Array.from(pageTriggers).forEach((target) => {
    target.addEventListener('click', () => {
        openPage(`.${target.getAttribute('data-page')}`);
    });
});

/**
 * Settings
 */
const selectDirectory = document.querySelectorAll('.select-directory');

Array.from(selectDirectory).forEach((target) => {
    target.addEventListener('click', () => {
        remote.dialog.showOpenDialog({
            defaultPath: document.querySelector('.directory-output').value,
            properties: ['openDirectory'],
        }, (data) => {
            document.querySelector('.directory-output').value = data[0];
        });
    });
});

// Prefill fields
applySettings(document.querySelector('.settings'));

// Double check working directory exists
if (!fs.existsSync(store.get('directory'))) {
    fs.mkdir(store.get('directory'), () => {});
}

// Required software checks
const refreshChecks = document.querySelector('.refresh-system-checks');

refreshChecks.addEventListener('click', () => {
    checkRequirements();
});

// Restore defaults
const restoreDefaults = document.querySelector('.restore-default-settings');

restoreDefaults.addEventListener('click', () => {
    store.assign(appDefaults);
    applySettings(document.querySelector('.settings'), store);
});

// Save setting changes
const saveSettings = document.querySelector('.save-settings');

saveSettings.addEventListener('click', () => {
    const inputs = document.querySelectorAll('.settings input, .settings select');
    const values = {};

    Array.from(inputs).forEach((target) => {
        switch (target.getAttribute('type')) {
        case 'checkbox':
            values[target.name] = target.checked;
            break;
        default:
            values[target.name] = target.value;
            break;
        }
    });

    store.assign(values);
});

/**
 * Create Project
 */
const createProject = document.querySelector('.create-project');

createProject.addEventListener('click', () => {
    const form = createProject.closest('form');
    const errorOutput = document.querySelector('.new-project .errors');
    const wpTitle = form.querySelector('input[name="wpTitle"]');
    const theme = form.querySelector('input[name="themeName"]');
    const repo = form.querySelector('input[name="repo"]');
    const pages = form.querySelector('textarea[name="pages"]');

    errorOutput.classList.add('hidden');

    const project = new Project({
        domain: form.querySelector('input[name="domain"]').value,
        tld: store.get('tld'),
        type: form.querySelector('select[name="projectType"]').value,
        directory: store.get('directory'),
    });

    // Validate inputs
    if (project.get('domain').length < 2) {
        errorOutput.classList.remove('hidden');
        errorOutput.innerHTML = 'Domain is required';
        return;
    }

    // Project exists
    if (projects.get(project.get('domain'))) {
        errorOutput.classList.remove('hidden');
        errorOutput.innerHTML = 'Domain already exists';
        return;
    }

    createProject.classList.add('btn-load');

    server.bash('new-domain.sh', [
        '--site',
        project.get('domain'),
        '--tld',
        project.get('tld'),
    ])
    .then(() => {
        // Add domain to hosts file
        fs.readFile(hostsPath, 'utf8', (err, data) => {
            if (err) {
                return;
            }

            fs.writeFile(hostsPath, data.replace('# arcadia-launcher-end', `${store.get('serverIP')} ${project.getDomainName()}\n# arcadia-launcher-end`), 'utf8', () => {});
        });

        if (project.get('type') === 'blank') {
            const projectFeed = document.querySelector('.project-feed');
            const tempURL = document.createElement('a');
            const tempElement = document.createElement('li');
            const wordPressFields = document.querySelectorAll('.req-wordpress');
            const commandToCheck = store.get('defaultEditor');

            tempURL.innerHTML = `${project.get('domain')}.${store.get('tld')}`;
            tempURL.setAttribute('href', '#');

            tempURL.addEventListener('click', (event) => {
                event.preventDefault();
                openProject(project);
            });

            tempElement.appendChild(tempURL);
            projectFeed.appendChild(tempElement);

            projects.store(project);

            form.reset();

            Array.from(wordPressFields).forEach((element) => {
                element.classList.remove('hidden');
            });

            if (store.get('createOpenEditor')) {
                commandExists(commandToCheck)
                    .then((command) => {
                        exec(`cd ${project.getWorkingDirectory()} && ${command} .`, () => {});
                    });
            }

            if (store.get('createOpenDirectory')) {
                electron.shell.openItem(project.getWorkingDirectory());
            }

            if (store.get('createOpenBrowser')) {
                electron.shell.openExternal(project.getURL());
            }

            if (store.get('createOpenRepo')) {
                electron.shell.openExternal(project.getRepoURL());
            }

            createProject.classList.remove('btn-load');

            return;
        }

        const args = [];

        if (theme.value.length > 0) {
            args.push('--theme', theme.value);
            project.set('theme', theme.value);
        }

        if (wpTitle.value.length > 0) {
            args.push('--title', wpTitle.value);
        }

        if (repo.value.length > 0) {
            args.push('--repo', repo.value);
            project.set('repo', repo.value);
        }

        if (pages.value.length > 0) {
            args.push('--pages', pages.value.replace(/\n/g, ', '));
        }

        // Create WordPress install
        server.command('bash', [
            path.join(store.get('directory'), 'scripts', 'new-project.sh'),
            '--directory',
            store.get('directory'),
            '--domain',
            project.get('domain'),
            '--tld',
            project.get('tld'),
            ...args,
        ])
        .then(() => {
            const commandToCheck = store.get('defaultEditor');
            const projectFeed = document.querySelector('.project-feed');
            const tempURL = document.createElement('a');
            const tempElement = document.createElement('li');
            const wordPressFields = document.querySelectorAll('.req-wordpress');

            tempURL.innerHTML = `${project.get('domain')}.${project.get('tld')}`;
            tempURL.setAttribute('href', '#');

            tempURL.addEventListener('click', (event) => {
                event.preventDefault();
                openProject(project);
            });

            tempElement.appendChild(tempURL);
            projectFeed.appendChild(tempElement);

            projects.store(project);

            form.reset();

            Array.from(wordPressFields).forEach((element) => {
                element.classList.remove('hidden');
            });

            if (store.get('createOpenEditor')) {
                commandExists(commandToCheck)
                    .then((command) => {
                        exec(`cd ${project.getWorkingDirectory()} && ${command} .`, () => {});
                    });
            }

            if (store.get('createOpenDirectory')) {
                electron.shell.openItem(project.getWorkingDirectory());
            }

            if (store.get('createOpenBrowser')) {
                electron.shell.openExternal(project.getURL());
            }

            if (store.get('createOpenRepo')) {
                electron.shell.openExternal(project.getRepoURL());
            }

            createProject.classList.remove('btn-load');
        });
    });
});

const projectTypeSelect = document.querySelector('.project-type');

projectTypeSelect.addEventListener('change', () => {
    const wordPressFields = document.querySelectorAll('.req-wordpress');

    Array.from(wordPressFields).forEach((element) => {
        if (projectTypeSelect.value === 'blank') {
            element.classList.add('hidden');
        } else {
            element.classList.remove('hidden');
        }
    });
});

/**
 * Project Screen
 */
const openProjectAction = document.querySelector('.default-open-action');
openProjectAction.addEventListener('click', (e) => {
    e.preventDefault();

    const commandToCheck = store.get('defaultEditor');

    if (store.get('openEditor')) {
        commandExists(commandToCheck)
            .then((command) => {
                exec(`cd ${activeProject.getWorkingDirectory()} && ${command} .`, () => {});
            });
    }

    if (store.get('openDirectory')) {
        electron.shell.openItem(activeProject.getWorkingDirectory());
    }

    if (store.get('openBrowser')) {
        electron.shell.openExternal(activeProject.getURL());
    }

    if (store.get('openRepo')) {
        electron.shell.openExternal(activeProject.getRepoURL());
    }
});

const openBrowser = document.querySelector('.open-browser');
const openDirectory = document.querySelector('.open-directory');
const openEditor = document.querySelector('.open-editor');
const openRepo = document.querySelector('.open-repo');
const deleteProject = document.querySelector('.delete-project');

openBrowser.addEventListener('click', () => {
    electron.shell.openExternal(activeProject.getURL());
    openBrowser.closest('.dropdown').classList.remove('open');
});

openDirectory.addEventListener('click', () => {
    electron.shell.openItem(activeProject.getWorkingDirectory());
    openDirectory.closest('.dropdown').classList.remove('open');
});

openEditor.addEventListener('click', () => {
    const commandToCheck = store.get('defaultEditor');

    commandExists(commandToCheck)
        .then((command) => {
            exec(`cd ${activeProject.getWorkingDirectory()} && ${command} .`, () => {});
        });

    openEditor.closest('.dropdown').classList.remove('open');
});

openRepo.addEventListener('click', () => {
    electron.shell.openExternal(activeProject.getRepoURL());
    openRepo.closest('.dropdown').classList.remove('open');
});

deleteProject.addEventListener('click', () => {
    // Check for unstaged changes on WordPress only for now
    // git diff-index --quiet HEAD -- || echo "untracked";

    const projectToDelete = activeProject;

    server.bash('delete-domain.sh', [
        '--site',
        projectToDelete.get('domain'),
    ])
    .then(() => {
        const highlightedProject = document.querySelector('.highlighted-project');

        // Remove domain from hosts file
        fs.readFile(hostsPath, 'utf8', (err, data) => {
            if (err) {
                return;
            }

            let newData = data.replace(`${store.get('serverIP')} ${projectToDelete.getDomainName()}\n`, '');
            newData = newData.replace(`${store.get('serverIP')} ${projectToDelete.getDomainName()}`, '');

            fs.writeFile(hostsPath, newData, 'utf8', () => {});
        });

        projects.delete(projectToDelete.get('domain'));
        updateProjectList(projects.sortByAge());

        if (!highlightedProject.classList.contains('hidden')) {
            openPage('.dashboard');
        }
    });
});

/**
 * Console
 */
const clearConsole = document.querySelector('.clear-console');

clearConsole.addEventListener('click', () => {
    terminal.clear();
});
