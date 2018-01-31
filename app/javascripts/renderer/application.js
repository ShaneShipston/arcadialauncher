const Store = require('./store.js');
const Toolbar = require('./toolbar.js');
const Console = require('./console.js');
const Projects = require('./projects.js');
const Project = require('./project.js');
const electron = require('electron');
const path = require('path');
const fs = require('fs');
const commandExists = require('command-exists');
const os = require('os');
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
    openSublime: false,
    openBrowser: false,
    openBrowserWP: false,
    openBrowserHome: false,
    openBrowserSync: false,
    createOpenEditor: false,
    createOpenBrowser: false,
    createOpenBrowserWP: false,
    createOpenBrowserHome: false,
    createOpenBrowserSync: false,
    initalCommit: true,
    initalCommitMsg: 'Cloned base theme',
    initalized: false,
    defaultEditor: 'subl',
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
});

/**
 * App Loaded
 */
electron.ipcRenderer.on('loaded' , function(event, data) {
    /**
     * App Version
     */
    document.querySelector('.app-version').innerHTML = data.appVersion;

    /**
     * System Checks
     */
    checkRequirements();

    /**
     * Populate Project Feed
     */
    const projectFeed = document.querySelector('.project-feed');
    projects.list().forEach((details) => {
        const tempURL = document.createElement('a');
        const tempElement = document.createElement('li');

        tempURL.innerHTML = details.getDomainName();
        tempURL.setAttribute('href', '#');

        tempURL.addEventListener('click', (e) => {
            e.preventDefault();
            openProject(details);
        });

        tempElement.appendChild(tempURL);
        projectFeed.appendChild(tempElement);
    });
});

/**
 * Boot Server
 */
const initServer = document.querySelector('.init-server');

initServer.addEventListener('click', () => {
    // Server already set up
    if (store.get('initalized')) {
        return;
    }

    openPage('.console');

    // Check for placeholder
    fs.readFile(hostsPath, (err, data) => {
        if (err) {
            return;
        }

        if (data.indexOf('arcadia-launcher') < 0) {
            fs.appendFile(hostsPath, '\n\n# arcadia-launcher\n# arcadia-launcher-end', () => {});
        }
    });

    // Clone directory repo
    fs.access(path.join(store.get('directory'), 'Vagrantfile'), fs.R_OK, (err) => {
        if (err) {
            runCommand('git', [
                'clone',
                'https://ShaneShipston@bitbucket.org/ShaneShipston/arcadiadirectory.git',
                store.get('directory'),
            ])
            .then(() => {
                runCommand('bash', [
                    path.join(store.get('directory'), 'scripts', 'boot-server.sh'),
                    '--directory',
                    store.get('directory'),
                ])
                .then(() => {
                    terminal.log('\nServer setup!');
                });
            });
        } else {
            runCommand('bash', [
                path.join(store.get('directory'), 'scripts', 'boot-server.sh'),
                '--directory',
                store.get('directory'),
            ])
            .then(() => {
                terminal.log('\nServer running!');
            });
        }
    });
});

/**
 * Utilities
 */
const toggleBar = document.querySelectorAll('.toggle-bar');

Array.from(toggleBar).forEach((target) => {
    target.addEventListener('click', (e) => {
        e.preventDefault();

        const element = document.getElementById(target.getAttribute('data-target'));

        element.classList.toggle('hidden');
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
const newProject = document.querySelector('.new-project-btn');

openProjects.addEventListener('click', (e) => {
    e.preventDefault();
    openPage('.dashboard');
});

openSettings.addEventListener('click', (e) => {
    e.preventDefault();
    openPage('.settings');
});

newProject.addEventListener('click', () => {
    // Change TLD suffix
    document.querySelector('.domain-tld').innerHTML = `.${store.get('tld')}`;

    openPage('.new-project');
});

/**
 * Settings
 */
const selectDirectory = document.querySelectorAll('.select-directory');

Array.from(selectDirectory).forEach((target) => {
    target.addEventListener('click', (e) => {
        remote.dialog.showOpenDialog({
            defaultPath: document.querySelector('.directory-output').value,
            properties: ['openDirectory'],
        }, (data) => {
            document.querySelector('.directory-output').value = data[0];
        });
    });
});

const appSettings = document.querySelector('.settings');

// Prefill fields
applySettings(appSettings, store);

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

createProject.addEventListener('click', (e) => {
    e.preventDefault();

    const form = createProject.closest('form');
    const domain = form.querySelector('input[name="domain"]');
    const wpTitle = form.querySelector('input[name="wpTitle"]');
    const theme = form.querySelector('input[name="themeName"]');
    const repo = form.querySelector('input[name="repo"]');
    const pages = form.querySelector('textarea[name="pages"]');
    const projectType = form.querySelector('select[name="projectType"]');

    const project = new Project({
        domain: domain.value,
        tld: store.get('tld'),
        type: projectType.value,
    });

    // Validate inputs
    if (project.get('domain').length < 2) {
        return;
    }

    // project exists
    if (projects.get(project.get('domain'))) {
        return;
    }

    openPage('.console');

    bashScript('new-domain.sh', [
        '--site',
        project.get('domain'),
        '--tld',
        project.get('tld'),
    ])
    .then(() => {
        // Add domain to hosts file
        fs.readFile(hostsPath, 'utf8', (err, data) => {
            if (err) {
                console.log('Nope');
                return;
            }

            fs.writeFile(hostsPath, data.replace('# arcadia-launcher-end', `192.168.33.10 ${project.getDomainName()}\n# arcadia-launcher-end`), 'utf8', (err2) => {
                if (err2) {
                    console.log('Nope');
                }
            });
        });

        // Exit early
        if (project.get('type') === 'blank') {
            terminal.log('\nDone!');

            const projectFeed = document.querySelector('.project-feed');
            const tempURL = document.createElement('a');
            const tempElement = document.createElement('li');

            tempURL.innerHTML = `${project.get('domain')}.${store.get('tld')}`;
            tempURL.setAttribute('href', '#');

            tempURL.addEventListener('click', (e) => {
                e.preventDefault();
                openProject(project);
            });

            tempElement.appendChild(tempURL);
            projectFeed.appendChild(tempElement);

            projects.store(project);

            form.reset();
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
            args.push('--pages', pages.value.replace('\n', ', '))
        }

        // Create WordPress install
        runCommand('bash', [
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
            terminal.log('\nDone!');

            const { exec } = require('child_process');
            const commandToCheck = store.get('defaultEditor');

            const projectFeed = document.querySelector('.project-feed');
            const tempURL = document.createElement('a');
            const tempElement = document.createElement('li');

            tempURL.innerHTML = `${domain.value}.${store.get('tld')}`;
            tempURL.setAttribute('href', '#');

            tempURL.addEventListener('click', (e) => {
                e.preventDefault();
                openProject(project);
            });

            tempElement.appendChild(tempURL);
            projectFeed.appendChild(tempElement);

            projects.store(project);

            form.reset();

            if (store.get('createOpenEditor')) {
                commandExists(commandToCheck)
                    .then((command) => {
                        exec(`cd ${path.join(store.get('directory'), project.getThemeDirectory())} && ${command} .`, () => {});
                    });
            }

            if (store.get('createOpenBrowser')) {
                if (store.get('createOpenBrowserWP')) {
                    electron.shell.openExternal(project.getURL('wp-admin'));
                }

                if (store.get('createOpenBrowserHome')) {
                    electron.shell.openExternal(project.getURL());
                }

                if (store.get('createOpenBrowserSync')) {
                    electron.shell.openExternal('http://localhost:3000/');
                }
            }
        });
    });
});

const openProjectAction = document.querySelector('.default-open-action');
openProjectAction.addEventListener('click', (e) => {
    e.preventDefault();

    const { exec } = require('child_process');
    const commandToCheck = store.get('defaultEditor');

    if (store.get('openEditor')) {
        commandExists(commandToCheck)
            .then((command) => {
                exec(`cd ${path.join(store.get('directory'), activeProject.getThemeDirectory())} && ${command} .`, () => {});
            });
    }

    if (store.get('openDirectory')) {
        electron.shell.openItem(path.join(store.get('directory'), activeProject.getThemeDirectory()));
    }

    if (store.get('openBrowser')) {
        if (store.get('openBrowserWP') && activeProject.get('type') === 'wordpress') {
            electron.shell.openExternal(activeProject.getURL('wp-admin'));
        }

        if (store.get('openBrowserHome')) {
            electron.shell.openExternal(activeProject.getURL());
        }

        if (store.get('openBrowserSync') && activeProject.get('type') === 'wordpress') {
            electron.shell.openExternal('http://localhost:3000/');
        }
    }
});

/**
 * Helpers
 */
function applySettings(screen, store) {
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

function checkRequirements() {
    const systemChecks = document.querySelectorAll('.system-checks li[data-command]');
    const editCheck = document.querySelector('.system-checks li.edit-check');

    Array.from(systemChecks).forEach((target) => {
        if (target.classList.contains('collapse')) {
            return;
        }

        const { exec } = require('child_process');
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

    // server running
    // another server is running
    // server has been set up
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

    terminal.clear();
}

function openProject(project) {
    activeProject = project;

    const projectViewer = document.querySelector('.highlighted-project');
    const domainName = projectViewer.querySelector('.domain-name');

    domainName.innerHTML = project.getDomainName();

    openPage('.highlighted-project');
}

function runCommand(command, args = [], callback = function() {}) {
    return new Promise((resolve, reject) => {
        const { spawn } = require('child_process');
        const longRunning = spawn(command, args);

        longRunning.stdout.on('data', (data) => {
            terminal.log(data);
        });

        longRunning.stderr.on('data', (data) => {
            terminal.log(data);
        });

        longRunning.on('close', (code) => {
            resolve();
            callback(code);
        });
    });
}

function bashScript(script, args) {
    return runCommand('bash', [
        path.join(store.get('directory'), 'scripts', 'bootstrap.sh'),
        '--directory',
        store.get('directory'),
        '--script',
        script,
        ...args,
    ]);
}
