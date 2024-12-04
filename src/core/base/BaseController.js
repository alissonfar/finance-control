// src/core/base/BaseController.js

class BaseController {
    constructor() {
        this.uiManager = null;
        this.dataManager = null;
        this.validators = new ValidationManager();
        this.isInitialized = false;
    }

    // Método de inicialização base
    async initialize() {
        if (this.isInitialized) return;
        
        try {
            await this.setupManagers();
            await this.loadInitialData();
            this.setupEventListeners();
            this.isInitialized = true;
        } catch (error) {
            console.error(`Error initializing ${this.constructor.name}:`, error);
            throw error;
        }
    }

    // Configuração dos managers (deve ser implementado pelas subclasses)
    async setupManagers() {
        throw new Error('setupManagers must be implemented by subclass');
    }

    // Carregamento de dados iniciais (deve ser implementado pelas subclasses)
    async loadInitialData() {
        throw new Error('loadInitialData must be implemented by subclass');
    }

    // Configuração de event listeners (deve ser implementado pelas subclasses)
    setupEventListeners() {
        throw new Error('setupEventListeners must be implemented by subclass');
    }

    // Métodos utilitários base
    async executeDbOperation(operation) {
        try {
            return await operation();
        } catch (error) {
            console.error('Database operation failed:', error);
            throw error;
        }
    }

    handleError(error, context = '') {
        console.error(`Error in ${this.constructor.name} ${context}:`, error);
        // Implementar lógica de tratamento de erro específica
    }

    // Validações base
    validateRequired(value, fieldName) {
        if (!value) {
            throw new Error(`${fieldName} is required`);
        }
    }

    validateNumeric(value, fieldName) {
        if (isNaN(parseFloat(value))) {
            throw new Error(`${fieldName} must be a number`);
        }
    }

    // Formatação base
    formatDate(date) {
        if (!date) return null;
        return new Date(date).toISOString().split('T')[0];
    }

    formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    }

    // Métodos de UI base
    showLoading() {
        if (this.uiManager) {
            this.uiManager.showLoading();
        }
    }

    hideLoading() {
        if (this.uiManager) {
            this.uiManager.hideLoading();
        }
    }

    showMessage(message, type = 'info') {
        if (this.uiManager) {
            this.uiManager.showMessage(message, type);
        }
    }

    // Métodos de estado
    getState() {
        return this.state;
    }

    setState(newState) {
        this.state = { ...this.state, ...newState };
        this.onStateChange();
    }

    onStateChange() {
        // Implementar lógica de atualização de UI baseada no estado
        if (this.uiManager) {
            this.uiManager.render(this.state);
        }
    }

    // Método de limpeza
    destroy() {
        this.isInitialized = false;
        if (this.uiManager) {
            this.uiManager.destroy();
        }
        // Limpar outros recursos se necessário
    }
}

// Export the base controller
export default BaseController;