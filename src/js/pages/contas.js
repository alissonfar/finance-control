// src/js/pages/contas.js

const ContasPage = {
    init() {
        this.setupForm();
    },

    setupForm() {
        const form = document.getElementById('contaForm');
        if (form) {
            form.addEventListener('submit', (event) => {
                event.preventDefault();
                APP.controllers.contas.handleSubmit(event);
            });
        }
    }
};

// Evento disparado quando a página de contas é carregada
document.addEventListener('pageLoaded', (event) => {
    if (event.detail.page === 'contas') {
        ContasPage.init();
        
        // Carrega os dados iniciais usando o controller existente
        if (APP.controllers.contas && typeof APP.controllers.contas.carregarContas === 'function') {
            APP.controllers.contas.carregarContas();
        }
    }
});