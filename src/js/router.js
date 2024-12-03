// src/js/router.js

const Router = {
    async loadPage(pageName) {
        try {
            const response = await fetch(`../views/pages/${pageName}.html`);
            if (!response.ok) {
                throw new Error(`Erro ao carregar página: ${pageName}`);
            }
            const content = await response.text();
            document.getElementById('main-content').innerHTML = content;
            
            // Dispara evento para informar que a página foi carregada
            const event = new CustomEvent('pageLoaded', { detail: { page: pageName } });
            document.dispatchEvent(event);
            
            // Chama função de inicialização se existir
            if (APP.controllers[pageName] && typeof APP.controllers[pageName].carregarDadosIniciais === 'function') {
                APP.controllers[pageName].carregarDadosIniciais();
            }
        } catch (error) {
            console.error('Erro ao carregar página:', error);
            document.getElementById('main-content').innerHTML = `
                <div class="card">
                    <h2>Erro ao carregar página</h2>
                    <p>Não foi possível carregar o conteúdo solicitado.</p>
                </div>
            `;
        }
    },

    async loadComponent(componentName, targetId) {
        try {
            const response = await fetch(`../views/components/${componentName}.html`);
            if (!response.ok) {
                throw new Error(`Erro ao carregar componente: ${componentName}`);
            }
            const content = await response.text();
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                targetElement.innerHTML = content;
            }
            
            // Dispara evento para informar que o componente foi carregado
            const event = new CustomEvent('componentLoaded', { detail: { component: componentName } });
            document.dispatchEvent(event);
        } catch (error) {
            console.error('Erro ao carregar componente:', error);
        }
    },

    init() {
        // Carrega componentes iniciais
        this.loadComponent('sidebar', 'sidebar');
        this.loadComponent('settings-menu', 'settings-menu');
        this.loadComponent('faturas-modal', 'faturasModal');
        this.loadComponent('participantes-modal', 'participantesModal');
        
        // Define página inicial
        this.loadPage('contas');
        
        // Atualiza navegação
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[data-page]');
            if (link) {
                e.preventDefault();
                const page = link.getAttribute('data-page');
                this.loadPage(page);
            }
        });
    }
};

// Exporta o router para uso global
window.Router = Router;