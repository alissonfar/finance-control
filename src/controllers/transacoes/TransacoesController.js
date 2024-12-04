// src/controllers/transacoes/TransacoesController.js

import TransacoesUIManager from './TransacoesUIManager.js';
import TransacoesDataManager from './TransacoesDataManager.js';

class TransacoesController {
    constructor() {
        // Mantém compatibilidade com o sistema global
        if (!window.APP.controllers.transacoes) {
            window.APP.controllers.transacoes = {};
        }

        // Define os métodos de pagamento no escopo global
        window.APP.controllers.transacoes.METODOS_PAGAMENTO = {
            DINHEIRO: 'DINHEIRO',
            DEBITO: 'DÉBITO',
            CREDITO: 'CRÉDITO',
            PIX: 'PIX',
            VA_VR: 'VA/VR',
            TRANSFERENCIA: 'TRANSFERÊNCIA'
        };

        this.dataManager = new TransacoesDataManager();
        this.setupController();

        // Adiciona listener para quando a página for carregada
        document.addEventListener('pageLoaded', (event) => {
            if (event.detail.page === 'transacoes') {
                console.log('Página de transações carregada, inicializando UI...');
                this.uiManager = new TransacoesUIManager();
                this.carregarDadosIniciais();
            }
        });
    }

    setupController() {
        window.APP.controllers.transacoes = {
            ...window.APP.controllers.transacoes,
            carregarDadosIniciais: async () => {
                if (this.uiManager) {
                    await this.carregarDadosIniciais();
                }
            },
            handleTipoChange: (tipo) => this.handleTipoChange(tipo),
            handleMetodoPagamentoChange: (metodo) => this.handleMetodoPagamentoChange(metodo),
            handleSubmit: (event) => this.handleSubmit(event),
            mostrarModalParticipantes: (transacao) => this.mostrarModalParticipantes(transacao)
        };
    }

    async carregarDadosIniciais() {
        try {
            console.log('Iniciando carregamento de dados...');
            await Promise.all([
                this.carregarCategorias(),
                this.carregarTransacoes()
            ]);
            
            this.uiManager.inicializarMetodosPagamento(window.APP.controllers.transacoes.METODOS_PAGAMENTO);
            this.uiManager.setDataAtual();
            
            if (window.APP.controllers.participantes?.carregarParticipantes) {
                await window.APP.controllers.participantes.carregarParticipantes();
            }
        } catch (error) {
            console.error('Erro ao carregar dados iniciais:', error);
        }
    }

    async handleTipoChange(tipo) {
        try {
            const categorias = await this.dataManager.getCategoriasByTipo(tipo);
            this.uiManager.updateCategorias(categorias);
        } catch (error) {
            console.error('Erro ao mudar tipo:', error);
        }
    }

    async handleMetodoPagamentoChange(metodo) {
        try {
            if (metodo === window.APP.controllers.transacoes.METODOS_PAGAMENTO.CREDITO) {
                const cartoes = await this.dataManager.loadCartoes();
                this.uiManager.showCamposCartao();
                this.uiManager.updateCartoes(cartoes);
            } else {
                this.uiManager.hideCamposCartao();
            }
        } catch (error) {
            console.error('Erro ao mudar método de pagamento:', error);
        }
    }

    async carregarCategorias() {
        try {
            const categorias = await this.dataManager.loadCategorias();
            this.uiManager.updateCategorias(categorias);
        } catch (error) {
            console.error('Erro ao carregar categorias:', error);
        }
    }

    async carregarTransacoes() {
        try {
            const transacoes = await this.dataManager.loadTransacoes();
            this.uiManager.updateTransacoesTable(transacoes);
        } catch (error) {
            console.error('Erro ao carregar transações:', error);
        }
    }

    async handleSubmit(event) {
        event.preventDefault();
        const formData = this.uiManager.getFormData();
        
        try {
            await this.dataManager.processarTransacao(formData);
            alert('Transação salva com sucesso!');
            await this.carregarDadosIniciais();
        } catch (error) {
            console.error('Erro ao processar transação:', error);
            alert('Erro ao salvar transação');
        }
    }

    async mostrarModalParticipantes(transacao) {
        try {
            const detalhes = await this.dataManager.getTransacaoDetalhes(transacao.id);
            this.uiManager.showTransacaoModal(detalhes);
        } catch (error) {
            console.error('Erro ao mostrar modal de participantes:', error);
        }
    }
}

export default TransacoesController;