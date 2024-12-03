// src/js/pages/pagamentos.js

const PagamentosPage = {
    init() {
        this.setupForm();
        this.setupEventListeners();
    },

    setupForm() {
        const form = document.getElementById('pagamentoForm');
        if (form) {
            form.addEventListener('submit', (event) => {
                event.preventDefault();
                APP.controllers.pagamentos.handleSubmit(event);
            });
        }
    },

    setupEventListeners() {
        // Evento para seleção de pagador
        const pagadorSelect = document.getElementById('pagador_id');
        if (pagadorSelect) {
            pagadorSelect.addEventListener('change', (event) => {
                APP.controllers.pagamentos.handlePagadorChange(event.target.value);
            });
        }

        // Evento para seleção de recebedor
        const recebedorSelect = document.getElementById('recebedor_id');
        if (recebedorSelect) {
            recebedorSelect.addEventListener('change', (event) => {
                APP.controllers.pagamentos.handleRecebedorChange(event.target.value);
            });
        }

        // Delegação de eventos para botões de ação na tabela
        const pagamentosTable = document.getElementById('pagamentosTable');
        if (pagamentosTable) {
            pagamentosTable.addEventListener('click', (event) => {
                const target = event.target;
                
                if (target.classList.contains('btn-confirmar')) {
                    const pagamentoId = target.getAttribute('data-id');
                    if (pagamentoId && APP.controllers.pagamentos.confirmarPagamento) {
                        APP.controllers.pagamentos.confirmarPagamento(pagamentoId);
                    }
                }
                
                if (target.classList.contains('btn-cancelar')) {
                    const pagamentoId = target.getAttribute('data-id');
                    if (pagamentoId && APP.controllers.pagamentos.cancelarPagamento) {
                        APP.controllers.pagamentos.cancelarPagamento(pagamentoId);
                    }
                }
            });
        }
    }
};

// Evento disparado quando a página de pagamentos é carregada
document.addEventListener('pageLoaded', (event) => {
    if (event.detail.page === 'pagamentos') {
        PagamentosPage.init();
        
        // Carrega os dados iniciais usando o controller existente
        if (APP.controllers.pagamentos && typeof APP.controllers.pagamentos.carregarDadosIniciais === 'function') {
            APP.controllers.pagamentos.carregarDadosIniciais();
        }
    }
});