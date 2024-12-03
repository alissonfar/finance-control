// src/js/pages/cartoes.js

const CartoesPage = {
    init() {
        this.setupForm();
    },

    setupForm() {
        const form = document.getElementById('cartaoForm');
        if (form) {
            form.addEventListener('submit', (event) => {
                event.preventDefault();
                APP.controllers.cartoes.handleSubmit(event);
            });
        }
    }
};

// Evento disparado quando a página de cartões é carregada
document.addEventListener('pageLoaded', (event) => {
    if (event.detail.page === 'cartoes') {
        CartoesPage.init();
        
        // Carrega os dados iniciais usando o controller existente
        if (APP.controllers.cartoes && typeof APP.controllers.cartoes.carregarDadosIniciais === 'function') {
            APP.controllers.cartoes.carregarDadosIniciais();
        }
    }
});