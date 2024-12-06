// src/utils/moduleLoader.js

/**
 * Gerencia a inicialização e integração de controllers modernos com o sistema legado
 */
class ModuleLoader {
    /**
     * Cache de controllers instanciados
     * @private
     */
    static #instances = new Map();

    /**
     * Utilitários globais do sistema
     * @private
     */
    static #globalUtils = {
        formatarData: function(data) {
            if (!data) return '';
            const date = new Date(data);
            return date.toLocaleDateString('pt-BR');
        },
        
        formatarMoeda: function(valor) {
            if (valor === null || valor === undefined) return 'R$ 0,00';
            return new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            }).format(valor);
        },

        // Outros utilitários existentes
        formatarDataHora: function(data) {
            if (!data) return '';
            const date = new Date(data);
            return date.toLocaleString('pt-BR');
        },

        validarNumero: function(valor) {
            return !isNaN(parseFloat(valor)) && isFinite(valor);
        }
    };

    /**
     * Inicializa um controller e o integra com o sistema legado
     * @param {string} controllerName - Nome do controller (ex: 'transacoes')
     * @param {class} ControllerClass - Classe do controller
     * @returns {Promise<Object>} Instância inicializada do controller
     */
    static async initializeController(controllerName, ControllerClass) {
        try {
            console.log(`Inicializando controller: ${controllerName}`);

            // Verifica se já existe uma instância
            if (this.#instances.has(controllerName)) {
                console.log(`Retornando instância existente de ${controllerName}`);
                return this.#instances.get(controllerName);
            }

            // Cria nova instância
            const controller = new ControllerClass();
            
            // Mantém compatibilidade com sistema legado
            window.APP.controllers[controllerName] = {
                // Método principal esperado pelo router atual
                carregarDadosIniciais: async () => {
                    await controller.initialize();
                },
                
                // Proxy para outros métodos do controller
                handler: new Proxy(controller, {
                    get: (target, prop) => {
                        if (prop in target) {
                            const value = target[prop];
                            if (typeof value === 'function') {
                                return value.bind(target);
                            }
                            return value;
                        }
                        return undefined;
                    }
                })
            };

            // Inicializa o controller
            await controller.initialize();

            // Guarda a instância no cache
            this.#instances.set(controllerName, controller);

            console.log(`Controller ${controllerName} inicializado com sucesso`);
            return controller;

        } catch (error) {
            console.error(`Erro ao inicializar controller ${controllerName}:`, error);
            throw new Error(`Falha ao inicializar ${controllerName}: ${error.message}`);
        }
    }

    /**
     * Registra utilitários globais mantendo compatibilidade
     * @param {Object} utils - Objeto com utilitários
     */
    static registerGlobalUtils(utils) {
        this.#globalUtils = {
            ...this.#globalUtils,
            ...utils
        };

        window.APP.utils = {
            ...window.APP.utils,
            ...this.#globalUtils
        };
    }

    /**
     * Remove um controller do sistema
     * @param {string} controllerName - Nome do controller
     */
    static destroyController(controllerName) {
        try {
            const controller = this.#instances.get(controllerName);
            if (controller && typeof controller.destroy === 'function') {
                controller.destroy();
            }
            
            this.#instances.delete(controllerName);
            delete window.APP.controllers[controllerName];
            
            console.log(`Controller ${controllerName} removido com sucesso`);
        } catch (error) {
            console.error(`Erro ao destruir controller ${controllerName}:`, error);
        }
    }

    /**
     * Obtém uma instância de controller
     * @param {string} controllerName - Nome do controller
     * @returns {Object|null} Instância do controller ou null
     */
    static getController(controllerName) {
        return this.#instances.get(controllerName) || null;
    }

    /**
     * Verifica se um controller está inicializado
     * @param {string} controllerName - Nome do controller
     * @returns {boolean}
     */
    static isInitialized(controllerName) {
        return this.#instances.has(controllerName);
    }

    /**
     * Inicializa os utilitários globais do sistema
     */
    static initializeGlobalUtils() {
        this.registerGlobalUtils(this.#globalUtils);
    }
}

// Inicializa os utilitários globais
ModuleLoader.initializeGlobalUtils();

// Exporta os métodos individuais para uso mais simples
export const {
    initializeController,
    registerGlobalUtils,
    destroyController,
    getController,
    isInitialized
} = ModuleLoader;

// Exporta a classe completa para casos específicos
export default ModuleLoader;