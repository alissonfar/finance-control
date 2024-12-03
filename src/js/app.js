// src/js/app.js

const App = {
    init() {
        this.setupSettingsMenu();
        this.setupModals();
    },

    setupSettingsMenu() {
        const settingsBtn = document.getElementById('settingsBtn');
        const settingsDropdown = document.getElementById('settingsDropdown');

        if (settingsBtn && settingsDropdown) {
            settingsBtn.addEventListener('click', () => {
                settingsDropdown.style.display = 
                    settingsDropdown.style.display === 'block' ? 'none' : 'block';
            });

            // Fecha o dropdown quando clicar fora dele
            document.addEventListener('click', (event) => {
                if (!event.target.matches('.settings-btn') && 
                    !event.target.matches('.fa-cog')) {
                    settingsDropdown.style.display = 'none';
                }
            });

            // Gerencia cliques nas opções de configuração
            settingsDropdown.addEventListener('click', (e) => {
                const settingsLink = e.target.closest('[data-settings]');
                if (settingsLink) {
                    e.preventDefault();
                    const settingType = settingsLink.getAttribute('data-settings');
                    this.loadSettings(settingType);
                }
            });
        }
    },

    setupModals() {
        // Configuração do modal de participantes
        const closeParticipantesModal = document.getElementById('closeParticipantesModal');
        const participantesModal = document.getElementById('participantesModal');

        if (closeParticipantesModal && participantesModal) {
            closeParticipantesModal.addEventListener('click', () => {
                participantesModal.style.display = 'none';
            });
        }

        // Fecha modais quando clicar fora deles
        window.addEventListener('click', (event) => {
            if (participantesModal && event.target === participantesModal) {
                participantesModal.style.display = 'none';
            }
        });
    },

    loadSettings(tipo) {
        const mainContent = document.getElementById('main-content');
        
        if (mainContent) {
            mainContent.innerHTML = `
                <div class="card">
                    <h2>Configuração de ${this.getSettingsTitle(tipo)}</h2>
                    <p>Funcionalidade em desenvolvimento...</p>
                </div>
            `;
        }
    },

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            const content = modal.querySelector('.modal-content');
            if (content) {
                content.classList.add('active');
            }
        }
    },

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            const content = modal.querySelector('.modal-content');
            if (content) {
                content.classList.remove('active');
            }
        }
    },

    // Função de compatibilidade para manter o código legado funcionando
    carregarConteudo(pagina) {
        Router.loadPage(pagina);
    },

    init() {
        this.setupSettingsMenu();
        this.setupModals();
        
        // Adiciona função de compatibilidade ao escopo global
        window.carregarConteudo = this.carregarConteudo;
    },

    getSettingsTitle(tipo) {
        const titles = {
            'categorias': 'Categorias',
            'backup': 'Backup do Sistema',
            'preferencias': 'Preferências do Sistema'
        };
        return titles[tipo] || tipo;
    }
};

// Exporta o App para uso global
window.App = App;