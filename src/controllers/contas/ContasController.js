export default class ContasController {
    constructor() {
        this.uiManager = null;
        this.dataManager = null;
        this.initialized = false;
        this.setupLegacySupport();
    }

    setupLegacySupport() {
        // Mantém compatibilidade com o namespace global
        window.APP.controllers.contas = {
            handleSubmit: (event) => this.handleSubmit(event),
            carregarContas: () => this.carregarContas(),
            initialize: () => this.initialize()
        };
    }

    async initialize() {
        if (this.initialized) return;
        
        // Importa managers dinamicamente apenas quando necessário
        const [UIManager, DataManager] = await Promise.all([
            import('./ContasUIManager.js'),
            import('./ContasDataManager.js')
        ]);

        this.uiManager = new UIManager.default(this);
        this.dataManager = new DataManager.default();
        
        this.initialized = true;
        console.log('ContasController inicializado');
    }

    async handleSubmit(event) {
        event.preventDefault();
        if (!this.uiManager || !this.dataManager) await this.initialize();

        try {
            const formData = this.uiManager.getFormData();
            await this.dataManager.salvarConta(formData);
            
            this.uiManager.resetForm();
            this.uiManager.showSuccessMessage('Conta salva com sucesso!');
            await this.carregarContas();
        } catch (error) {
            console.error('Erro ao salvar conta:', error);
            this.uiManager.showErrorMessage(error.message);
        }
        
        return false;
    }

    async carregarContas() {
        if (!this.uiManager || !this.dataManager) await this.initialize();

        try {
            const contas = await this.dataManager.getContas();
            this.uiManager.renderContas(contas);
        } catch (error) {
            console.error('Erro ao carregar contas:', error);
            this.uiManager.showErrorMessage('Erro ao carregar contas: ' + error.message);
        }
    }
}