// src/js/pages/participantes.js

const ParticipantesPage = {
    init() {
        this.setupForm();
        this.setupEventListeners();
    },

    setupForm() {
        const form = document.getElementById('participanteForm');
        if (form) {
            form.addEventListener('submit', (event) => {
                event.preventDefault();
                APP.controllers.participantes.handleSubmit(event);
            });
        }
    },

    setupEventListeners() {
        // Evento para checkbox de uso de contas
        const usaContasCheckbox = document.getElementById('usa_contas');
        if (usaContasCheckbox) {
            usaContasCheckbox.addEventListener('change', (event) => {
                APP.controllers.participantes.handleUsaContasChange(event.target.checked);
            });
        }

        // Eventos adicionais podem ser adicionados aqui conforme necessário
    }
};

// Evento disparado quando a página de participantes é carregada
document.addEventListener('pageLoaded', (event) => {
    if (event.detail.page === 'participantes') {
        ParticipantesPage.init();
        
        // Carrega os dados iniciais usando o controller existente
        if (APP.controllers.participantes && typeof APP.controllers.participantes.carregarDadosIniciais === 'function') {
            APP.controllers.participantes.carregarDadosIniciais();
        }
    }
});