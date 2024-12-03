// src/js/pages/transacoes.js

const TransacoesPage = {
    init() {
        this.setupForm();
        this.setupEventListeners();
        this.loadInitialData();
    },

    setupForm() {
        const form = document.getElementById('transacaoForm');
        if (form) {
            form.addEventListener('submit', (event) => {
                event.preventDefault();
                if (APP.controllers.transacoes && APP.controllers.transacoes.handleSubmit) {
                    APP.controllers.transacoes.handleSubmit(event);
                }
            });
        }
    },

    setupEventListeners() {
        // Tipo
        const tipoSelect = document.getElementById('tipo');
        if (tipoSelect) {
            tipoSelect.addEventListener('change', (event) => {
                if (APP.controllers.transacoes && APP.controllers.transacoes.handleTipoChange) {
                    APP.controllers.transacoes.handleTipoChange(event.target.value);
                }
            });
        }

        // Método de Pagamento
        const metodoPagamentoSelect = document.getElementById('metodo_pagamento');
        if (metodoPagamentoSelect) {
            metodoPagamentoSelect.addEventListener('change', (event) => {
                if (APP.controllers.transacoes && APP.controllers.transacoes.handleMetodoPagamentoChange) {
                    APP.controllers.transacoes.handleMetodoPagamentoChange(event.target.value);
                }
            });
        }

        // Cartão
        const cartaoSelect = document.getElementById('cartao_id');
        if (cartaoSelect) {
            cartaoSelect.addEventListener('change', (event) => {
                if (APP.controllers.transacoes && APP.controllers.transacoes.carregarFaturas) {
                    APP.controllers.transacoes.carregarFaturas(event.target.value);
                }
            });
        }

        // Valor e Participantes
        const valorInput = document.getElementById('valor');
        const participantesSelect = document.getElementById('participantes_select');

        if (valorInput) {
            valorInput.addEventListener('change', () => {
                if (APP.controllers.participantes && APP.controllers.participantes.atualizarValoresParticipantes) {
                    APP.controllers.participantes.atualizarValoresParticipantes();
                }
            });
        }

        if (participantesSelect) {
            participantesSelect.addEventListener('change', () => {
                if (APP.controllers.participantes && APP.controllers.participantes.atualizarValoresParticipantes) {
                    APP.controllers.participantes.atualizarValoresParticipantes();
                }
            });
        }
    },

    loadInitialData() {
        // Garante que os controllers estão disponíveis antes de carregar os dados
        if (APP.controllers.transacoes && APP.controllers.transacoes.carregarDadosIniciais) {
            APP.controllers.transacoes.carregarDadosIniciais();
        }
    }
};

// Evento disparado quando a página de transações é carregada
document.addEventListener('pageLoaded', (event) => {
    if (event.detail.page === 'transacoes') {
        // Garante que o namespace APP.controllers existe
        if (!window.APP) window.APP = {};
        if (!window.APP.controllers) window.APP.controllers = {};
        
        TransacoesPage.init();
    }
});