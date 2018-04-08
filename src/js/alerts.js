import { elementIndex } from './helpers/dom';

export default class Alerts {
    constructor(container) {
        this.alerts = [];
        this.container = container;
        this.messages = this.container.querySelector('.messages');
        this.arrows = this.container.querySelector('.arrows');
        this.previousArrow = this.arrows.querySelector('button:first-child');
        this.nextArrow = this.arrows.querySelector('button:last-child');

        this.nextArrow.addEventListener('click', () => {
            this.nextIssue();
        });

        this.previousArrow.addEventListener('click', () => {
            this.previousIssue();
        });
    }
    addIssue(message, actions = []) {
        const alert = {
            message,
        };

        this.messages.insertAdjacentHTML('beforeend', this.template(message));
        this.container.classList.remove('hidden');
        this.alerts.push(alert);

        alert.element = this.messages.querySelector('li:last-child');

        if (this.alerts.length === 1) {
            alert.element.classList.add('active');
            this.previousArrow.disabled = true;
            this.nextArrow.disabled = true;
        } else if (this.alerts.length > 1) {
            this.nextArrow.disabled = false;
        }

        const ignoreButton = alert.element.querySelector('button');
        const ignoreElement = ignoreButton.closest('li');

        ignoreButton.addEventListener('click', () => {
            this.removeIssue(ignoreElement);
        });

        if (actions.length > 0) {
            actions.forEach((button) => {
                alert.element.querySelector('.actions').insertAdjacentHTML('afterbegin', `<button type="button" class="btn btn-xs btn-default">${button.label}</button>`);

                const newButton = alert.element.querySelector('button:first-child');

                newButton.addEventListener('click', () => {
                    newButton.classList.add('btn-load');

                    const promise = new Promise((resolve, reject) => {
                        button.callback(resolve, reject);
                    });

                    promise.then(() => {
                        this.removeIssue(alert.element);
                    });
                });
            });
        }
    }
    removeIssue(element) {
        if (element.classList.contains('active')) {
            if (this.alerts.length === 1) {
                this.container.classList.add('hidden');
            } else if (!this.nextArrow.disabled) {
                this.nextIssue();
            } else {
                this.previousIssue();
            }
        }

        const currentIndex = elementIndex(element);

        if (currentIndex === 0) {
            this.previousArrow.disabled = true;
        } else if (currentIndex + 1 === this.alerts.length) {
            this.nextArrow.disabled = true;
        }

        element.remove();
        this.alerts.splice(currentIndex, 1);
    }
    nextIssue() {
        const activeMessage = this.activeElement();
        const activeIndex = elementIndex(activeMessage);
        const nextMessage = this.alerts[activeIndex + 1].element;

        if (activeIndex + 2 >= this.alerts.length) {
            this.nextArrow.disabled = true;
        }

        this.previousArrow.disabled = false;

        activeMessage.classList.remove('active');
        nextMessage.classList.add('active');
    }
    previousIssue() {
        const activeMessage = this.activeElement();
        const activeIndex = elementIndex(activeMessage);
        const previousMessage = this.alerts[activeIndex - 1].element;

        if (activeIndex - 1 === 0) {
            this.previousArrow.disabled = true;
        }

        this.nextArrow.disabled = false;

        activeMessage.classList.remove('active');
        previousMessage.classList.add('active');
    }
    activeElement() {
        return this.messages.querySelector('.active');
    }
    template(message) {
        return `<li>
            <div class="msg">${message}</div>
            <div class="actions">
                <button type="button" class="btn btn-xs">Ignore</button>
            </div>
        </li>`;
    }
}
