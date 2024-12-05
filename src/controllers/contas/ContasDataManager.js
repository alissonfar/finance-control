// src/controllers/contas/ContasDataManager.js
export default class ContasDataManager {
    constructor() {
        this.db = window.APP.db;
    }

    salvarConta(formData) {
        return new Promise((resolve, reject) => {
            const sql = `
                INSERT INTO contas (nome, saldo_atual, saldo_inicial, descricao)
                VALUES (?, ?, ?, ?)
            `;
            
            this.db.run(
                sql, 
                [formData.nome, formData.saldo_inicial, formData.saldo_inicial, formData.descricao],
                function(err) {
                    if (err) {
                        reject(new Error('Erro ao salvar conta: ' + err.message));
                        return;
                    }
                    resolve(this.lastID);
                }
            );
        });
    }

    getContas() {
        return new Promise((resolve, reject) => {
            this.db.all(
                'SELECT * FROM contas WHERE ativo = 1 ORDER BY data_criacao DESC',
                [],
                (err, rows) => {
                    if (err) {
                        reject(new Error('Erro ao carregar contas: ' + err.message));
                        return;
                    }
                    resolve(rows);
                }
            );
        });
    }
}