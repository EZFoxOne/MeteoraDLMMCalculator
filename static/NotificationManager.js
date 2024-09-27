class NotificationManager {
    constructor(app) {
        this.app = app;
        this.notifications = [];
        this.handleNotifications = this.handleNotifications.bind(this);
        this.intervalId = null; // To store the interval ID for later cleanup
        this.containerId = 'notification-container';
    }

    addNotification(title, message, type, duration, timestamp) {
        const notification = new Notification(title, message, type, timestamp, duration, this.containerId);
        this.notifications.push(notification);
        return notification;
    }

    async handleNotifications() {
        while (this.notifications.length > 0) {
            let notification = this.notifications.pop();
            notification.show();
        }
    }

    startProcessing() {
        if (!this.intervalId) {
            this.intervalId = setInterval(this.handleNotifications, 500);
        }
    }

    stopProcessing() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }
}

class Notification {
    constructor(title, message, type, timestamp, duration, containerId=null) {
        if (!containerId) {
            this.containerId = 'notification-container';
        } else {
            this.containerId = containerId;
        }
        this.title = title;
        this.message = message;
        this.type = type;
        this.timestamp = timestamp || new Date().toLocaleString(); // Default to current time if timestamp not provided
        this.duration = duration || 5000; // Default duration: 5 seconds
        this.timeout = null; // To store the timeout ID for later cleanup
        this.element = null;
        this.generateHTML();
    }

    generateHTML() {
        this.element = document.createElement('div');
        this.element.classList.add('notification-wrapper', `notification-${this.type}`);

        const titleElement = document.createElement('h3');
        titleElement.textContent = this.title;

        const messageElement = document.createElement('p');
        messageElement.textContent = this.message;

        const footerElement = document.createElement('footer');
        const timestampElement = document.createElement('span');
        timestampElement.textContent = this.timestamp.toLocaleString(); // Format timestamp as per locale
        footerElement.appendChild(timestampElement);

        this.element.appendChild(titleElement);
        this.element.appendChild(messageElement);
        this.element.appendChild(footerElement);

        // Add event listener to handle dismissal
        this.element.addEventListener('click', () => {
            this.dismiss();
        });
    }

    edit(title=null, message=null, type=null, timestamp=null, duration=null) {
        if (title !== null) {
            this.title = title;
            this.element.querySelector('h3').textContent = title;
        }
        if (message !== null) {
            this.message = message;
            this.element.querySelector('p').textContent = message;
        }
        if (type !== null) {
            this.element.classList.remove(`notification-${this.type}`);
            this.type = type;
            this.element.classList.add(`notification-${this.type}`);
        }
        if (timestamp !== null) {
            this.timestamp = timestamp || new Date();
            this.element.querySelector('span').textContent = this.timestamp.toLocaleString();
        }
        if (duration !== null) {
            this.duration = duration || 5000;
            clearTimeout(this.timeout);
            this.timeout = setTimeout(() => {
                this.dismiss(this.element);
            }, this.duration);
        }
    }

    show () {
        // Slide in animation
        setTimeout(() => {
            this.element.style.right = '0'; // Slide in from the right
        }, 100); // Delay for smooth animation

        // Slide out animation after duration
        this.timeout = setTimeout(() => {
            this.dismiss(this.element);
        }, this.duration);
        console.log(this.containerId)
        document.getElementById(this.containerId).appendChild(this.element);
    }

    dismiss() {
        this.element.style.right = '-400px'; // Slide out to the right
        setTimeout(() => {
            this.element.remove();
        }, 500); // Delay to match the transition duration in CSS
    }
}
