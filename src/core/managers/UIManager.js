// src/core/managers/UIManager.js

class UIManager {
    static instance = null;

    constructor() {
        if (UIManager.instance) {
            return UIManager.instance;
        }
        this.modals = new Map();
        this.toasts = [];
        this.setupBaseStyles();
        UIManager.instance = this;
    }

    static getInstance() {
        if (!UIManager.instance) {
            UIManager.instance = new UIManager();
        }
        return UIManager.instance;
    }

    setupBaseStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .loading {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.5);
                display: none;
                justify-content: center;
                align-items: center;
                z-index: 9999;
            }
            .spinner {
                width: 50px;
                height: 50px;
                border: 5px solid #f3f3f3;
                border-top: 5px solid #3498db;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }
            .toast {
                position: fixed;
                bottom: 20px;
                right: 20px;
                padding: 15px 20px;
                border-radius: 4px;
                color: white;
                z-index: 10000;
            }
            .toast-info { background-color: #3498db; }
            .toast-success { background-color: #2ecc71; }
            .toast-error { background-color: #e74c3c; }
            .toast-warning { background-color: #f1c40f; }
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }

    createModal(id, content) {
        const modal = document.createElement('div');
        modal.id = id;
        modal.className = 'modal';
        modal.innerHTML = content;
        
        document.body.appendChild(modal);
        this.modals.set(id, modal);
        
        return modal;
    }

    showModal(id) {
        const modal = this.modals.get(id);
        if (modal) {
            modal.style.display = 'block';
            return true;
        }
        return false;
    }

    hideModal(id) {
        const modal = this.modals.get(id);
        if (modal) {
            modal.style.display = 'none';
            return true;
        }
        return false;
    }

    showToast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        this.toasts.push(toast);
        
        setTimeout(() => {
            toast.remove();
            this.toasts = this.toasts.filter(t => t !== toast);
        }, duration);
    }

    clearToasts() {
        this.toasts.forEach(toast => toast.remove());
        this.toasts = [];
    }

    showLoading() {
        let loader = document.querySelector('.loading');
        if (!loader) {
            loader = document.createElement('div');
            loader.className = 'loading';
            loader.innerHTML = '<div class="spinner"></div>';
            document.body.appendChild(loader);
        }
        loader.style.display = 'flex';
    }

    hideLoading() {
        const loader = document.querySelector('.loading');
        if (loader) {
            loader.style.display = 'none';
        }
    }

    clearModals() {
        this.modals.forEach(modal => modal.remove());
        this.modals.clear();
    }

    destroy() {
        this.clearModals();
        this.clearToasts();
        UIManager.instance = null;
    }
}

export default UIManager;