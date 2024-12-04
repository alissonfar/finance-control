// src/core/base/BaseUIManager.js

class BaseUIManager {
    constructor() {
        this.elements = {};
        this.eventListeners = {};
    }

    async initialize() {
        this.cacheElements();
        this.setupBaseEventListeners();
    }

    cacheElements() {
        // Deve ser implementado pela classe filha
    }

    setupBaseEventListeners() {
        // Implementação base de event listeners
        window.addEventListener('unload', () => this.destroy());
    }

    render(data) {
        // Deve ser implementado pela classe filha
        throw new Error('render method must be implemented');
    }

    showLoading() {
        const loader = document.querySelector('.loading') || this.createLoader();
        loader.style.display = 'flex';
    }

    hideLoading() {
        const loader = document.querySelector('.loading');
        if (loader) loader.style.display = 'none';
    }

    showMessage(message, type = 'info') {
        const toast = this.createToast(message, type);
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    createLoader() {
        const loader = document.createElement('div');
        loader.className = 'loading';
        loader.innerHTML = '<div class="spinner"></div>';
        document.body.appendChild(loader);
        return loader;
    }

    createToast(message, type) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        return toast;
    }

    destroy() {
        // Limpa event listeners e referências
        Object.values(this.eventListeners).forEach(listener => {
            if (listener.element && listener.event) {
                listener.element.removeEventListener(listener.event, listener.handler);
            }
        });
        this.eventListeners = {};
        this.elements = {};
    }
}

export default BaseUIManager;