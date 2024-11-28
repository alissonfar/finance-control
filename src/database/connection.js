const path = require('path');
const projectRoot = path.resolve(__dirname, '../../');
const dbPath = path.join(projectRoot, 'src/database/config.js');
console.log('Tentando acessar banco em:', dbPath);
const db = require(dbPath);

// Inicializar o namespace APP
window.APP = {
    // Controllers serão adicionados aqui pelos seus respectivos arquivos
    controllers: {},
    
    // Banco de dados e utilitários
    db: db,
    path: path,
    
    // Funções utilitárias que podem ser usadas em toda a aplicação
    utils: {
        formatarData: function(data) {
            return new Date(data).toLocaleString('pt-BR');
        },
        
        formatarMoeda: function(valor) {
            return parseFloat(valor).toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            });
        }
    }
};

console.log('Conexão inicializada com sucesso');