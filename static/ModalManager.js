class ModalManager {
    constructor(eBook) {
        this.eBook = eBook;
        this.modals = [];
    }

    createModal(title, content, options = {}, modalType = Modal) {
        const modal = new modalType(this.eBook, title, content, options);
        this.modals.push(modal);
        return modal;
    }

    openModal(title, content, options = {}, modalType = Modal, overlay=true) {
        this.closeAllModals();
        const modal = this.createModal(title, content, options, modalType);
        modal.open(overlay);
        // this.eBook.NotificationManager.addNotification(`Opened modal: ${title}`);
    }

    closeAllModals() {
        const overlay = document.getElementById('modal-overlay')
        if (overlay.classList.contains('show')) {
            overlay.classList.remove('show')
        }
        this.modals.forEach(modal => {
            try {
                modal.close();
            } catch (error) {
                // modal doesn't exist anymore
            }
        });
        this.modals = [];
    }
}

class Modal {
    constructor(eBook, title, content, options = {}) {
        this.eBook = eBook;
        this.title = title;
        this.content = content;
        this.options = options;
        this.element = this.createModalElement();
    }

    createModalElement() {
        const modalElement = document.createElement('div');
        modalElement.classList.add('modal');
        modalElement.innerHTML = `
      <div class="modal-header">
        <h2>${this.title}</h2>
        <span class="close">&times;</span>
      </div>
      <div class="modal-content">
        ${this.content}
      </div>
    `;
        this.applyStyles(modalElement);
        return modalElement;
    }

    applyStyles(modalElement) {
        const {backgroundColor, fontSize, fontColor, buttonColor, position, posX, posY} = this.options;
        if (backgroundColor) modalElement.style.backgroundColor = backgroundColor;
        if (fontSize) modalElement.style.fontSize = fontSize;
        if (fontColor) modalElement.style.color = fontColor;
        if (buttonColor) {
            const closeButton = modalElement.querySelector('.close');
            if (closeButton) closeButton.style.color = buttonColor;
        }
        if (position) modalElement.style.position = position
        if (posX) modalElement.style.left = (posX) + "px";
        if (posY) modalElement.style.top = (posY) + "px";
    }

    open(activateOverlay=true) {
        if (activateOverlay) {
            const overlay = document.getElementById('modal-overlay')
            if (!overlay.classList.contains('show')) {
                overlay.classList.add('show')
            }
        }
        document.body.appendChild(this.element);
        this.element.style.display = 'block';
        this.addCloseListener();
    }

    close() {
        const overlay = document.getElementById('modal-overlay')
        if (overlay.classList.contains('show')) {
            overlay.classList.remove('show')
        }
        document.body.removeChild(this.element);
    }

    addCloseListener() {
        const closeButton = this.element.querySelector('.close');
        closeButton.addEventListener('click', () => {
            this.close();
        });
    }
}

class SettingsModal extends Modal {
    constructor(eBook, title, content, options = {}) {
        super(eBook, title, content, options);
        this.generateModalContent();
    }

    generateModalContent() {
        const generalSettings = document.createElement('div');
        generalSettings.appendChild(new ThemeSettingsPanel(this.eBook).element);
        this.element.appendChild(generalSettings);
    }
}

class ThemeSettingsPanel {
    constructor(eBook) {
        this.eBook = eBook;
        this.element = this.createThemeSettingsPanel();
    }

    createThemeSettingsPanel() {
        const themeSettingsPanel = document.createElement('div');
        themeSettingsPanel.classList.add('theme-settings-panel');

        const lightTheme = this.createCheckbox('Light', 'light');
        const sepiaTheme = this.createCheckbox('Sepia', 'sepia');
        const darkTheme = this.createCheckbox('Dark Mode', 'dark');

        // themeSettingsPanel.appendChild(lightTheme);
        // themeSettingsPanel.appendChild(sepiaTheme);
        themeSettingsPanel.appendChild(darkTheme);

        return themeSettingsPanel;
    }

    createCheckbox(labelText, theme) {
        const checkboxContainer = document.createElement('label');
        checkboxContainer.classList.add('theme-checkbox-container');

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.dataset.theme = theme;
        checkbox.classList.add('theme-checkbox');
        checkbox.addEventListener('change', () => {
            if (!checkbox.checked) {
                theme = "light"
            } else {
                theme = checkbox.dataset.theme
            }
            console.log("Updating theme to:", theme)
            this.eBook.StateManager.updateState({userSettings: {theme: theme}})
        });

        const checkmark = document.createElement('span');
        checkmark.classList.add('checkmark');

        const label = document.createElement('span');
        label.innerText = labelText;

        checkboxContainer.appendChild(checkbox);
        checkboxContainer.appendChild(checkmark);
        checkboxContainer.appendChild(label);

        return checkboxContainer;
    }
}

class SaveModal extends Modal {
    constructor(title, content, options = {}) {
        super(title, content, options);
        this.generateModalContent();
    }

    generateModalContent() {
        const saveButton = document.createElement('button');
        saveButton.innerText = 'Save';
        saveButton.addEventListener('click', () => {
            this.save();
        });
        this.element.querySelector('.modal-content').appendChild(saveButton);
    }

    save() {
        console.log('Saving changes...');
    }
}

class HelpModal extends Modal {
    constructor(title, content, options = {}) {
        super(title, content, options);
        this.element.appendChild(this.generateModalContent());
    }

    generateModalContent() {
        const helpContent = document.createElement('div');
        helpContent.innerHTML = `<p>Need help? Contact us at <a href="mailto:support@theexpertta.com">support@theexpertta.com</a></p>`
        return helpContent;
    }
}

class TableOfContentsEditModal extends Modal {
    constructor(eBook, title, content, options = {}) {
        super(eBook, title, content, options);
        this.element.appendChild(this.generateModalContent());
    }

    generateModalContent() {
        const editForm = document.createElement('form');
        editForm.innerHTML = `
            <label for="tocItemName">Item Name:</label><br>
            <input type="text" id="tocItemName" name="tocItemName" value=""><br>
            <button type="submit">Save</button>
        `;
        editForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const itemNameInput = editForm.querySelector('#tocItemName');
            const newItemName = itemNameInput.value.trim();
            if (newItemName !== '') {
                // Assuming you have a method to handle TOC item editing in your eBook class
                console.log('edit toc item')
                this.close(); // Close the modal after editing
            } else {
                alert('Please provide a valid name for the TOC item.');
            }
        });
        return editForm;
    }
}
