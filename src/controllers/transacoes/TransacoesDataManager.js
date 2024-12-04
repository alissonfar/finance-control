// src/controllers/transacoes/TransacoesDataManager.js

class TransacoesDataManager {
    constructor() {
        if (!window.APP.db) {
            throw new Error('Database connection not available');
        }
        this.db = window.APP.db;
    }

    async loadCategorias() {
        console.log('Carregando categorias...');
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM categorias WHERE ativo = 1 ORDER BY nome';
            
            this.db.all(sql, [], (err, categorias) => {
                if (err) {
                    console.error('Erro ao carregar categorias:', err);
                    reject(err);
                    return;
                }
                console.log('Categorias carregadas:', categorias);
                resolve(categorias);
            });
        });
    }

    async getCategoriasByTipo(tipo) {
        console.log('Carregando categorias por tipo:', tipo);
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM categorias WHERE tipo = ? AND ativo = 1 ORDER BY nome';
            
            this.db.all(sql, [tipo], (err, categorias) => {
                if (err) {
                    console.error('Erro ao filtrar categorias:', err);
                    reject(err);
                    return;
                }
                console.log('Categorias filtradas:', categorias);
                resolve(categorias);
            });
        });
    }

    async loadTransacoes() {
        console.log('Carregando transações...');
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT 
                    t.*, 
                    cat.nome as categoria_nome,
                    cc.nome as cartao_nome,
                    GROUP_CONCAT(p.nome) as participantes_nomes,
                    GROUP_CONCAT(tp.valor_devido) as participantes_valores
                FROM transacoes t 
                JOIN categorias cat ON t.categoria_id = cat.id 
                LEFT JOIN cartoes_credito cc ON t.cartao_id = cc.id
                LEFT JOIN transacoes_participantes tp ON t.id = tp.transacao_id
                LEFT JOIN participantes p ON tp.participante_id = p.id
                WHERE t.ativo = 1 
                GROUP BY t.id
                ORDER BY t.data_efetiva DESC
            `;

            this.db.all(sql, [], (err, transacoes) => {
                if (err) {
                    console.error('Erro ao carregar transações:', err);
                    reject(err);
                    return;
                }
                console.log('Transações carregadas:', transacoes);
                resolve(transacoes);
            });
        });
    }

    async loadCartoes() {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM cartoes_credito WHERE ativo = 1 ORDER BY nome';
            
            this.db.all(sql, [], (err, cartoes) => {
                if (err) {
                    console.error('Erro ao carregar cartões:', err);
                    reject(err);
                    return;
                }
                resolve(cartoes);
            });
        });
    }

    async loadFaturas(cartaoId) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT * FROM faturas 
                WHERE cartao_id = ? 
                AND status = 'ABERTA' 
                AND ativo = 1
                ORDER BY data_vencimento DESC
            `;
            
            this.db.all(sql, [cartaoId], (err, faturas) => {
                if (err) {
                    console.error('Erro ao carregar faturas:', err);
                    reject(err);
                    return;
                }
                resolve(faturas);
            });
        });
    }

    async getTransacaoDetalhes(transacaoId) {
        console.log('Carregando detalhes da transação:', transacaoId);
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT 
                    t.*,
                    p.nome,
                    p.usa_contas,
                    tp.valor_devido,
                    GROUP_CONCAT(c.nome) as contas_nomes
                FROM transacoes t
                JOIN transacoes_participantes tp ON t.id = tp.transacao_id
                JOIN participantes p ON tp.participante_id = p.id
                LEFT JOIN participantes_contas pc ON p.id = pc.participante_id
                LEFT JOIN contas c ON pc.conta_id = c.id
                WHERE t.id = ?
                GROUP BY p.id, tp.valor_devido
            `;

            this.db.all(sql, [transacaoId], (err, result) => {
                if (err) {
                    console.error('Erro ao carregar detalhes da transação:', err);
                    reject(err);
                    return;
                }

                if (!result || result.length === 0) {
                    reject(new Error('Transação não encontrada'));
                    return;
                }

                const transacao = {
                    ...result[0],
                    participantes: result.map(row => ({
                        nome: row.nome,
                        usa_contas: row.usa_contas,
                        valor_devido: row.valor_devido,
                        contas_nomes: row.contas_nomes
                    }))
                };

                resolve(transacao);
            });
        });
    }

    async processarTransacao(formData) {
        console.log('Iniciando processamento da transação:', formData);
        return new Promise(async (resolve, reject) => {
            try {
                await this.beginTransaction();

                // 1. Inserir transação
                const transacaoId = await this.insertTransacao(formData);
                console.log('Transação inserida, ID:', transacaoId);

                // 2. Processar participantes
                if (formData.participantes?.length > 0) {
                    await this.processarParticipantes(transacaoId, formData);
                }

                // 3. Atualizar fatura se for cartão de crédito
                if (formData.metodo_pagamento === window.APP.controllers.transacoes.METODOS_PAGAMENTO.CREDITO) {
                    await this.atualizarFatura(formData);
                }

                await this.commit();
                resolve(transacaoId);
            } catch (error) {
                console.error('Erro no processamento da transação:', error);
                await this.rollback();
                reject(error);
            }
        });
    }

    async beginTransaction() {
        return new Promise((resolve, reject) => {
            this.db.run('BEGIN TRANSACTION', err => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    async commit() {
        return new Promise((resolve, reject) => {
            this.db.run('COMMIT', err => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    async rollback() {
        return new Promise((resolve, reject) => {
            this.db.run('ROLLBACK', err => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    async insertTransacao(formData) {
        console.log('Inserindo transação:', formData);
        return new Promise((resolve, reject) => {
            const sql = `
                INSERT INTO transacoes (
                    tipo, categoria_id, valor, 
                    data_efetiva, data_lancamento, metodo_pagamento, descricao,
                    cartao_id, fatura_id, numero_parcelas
                ) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?, ?, ?)
            `;
            
            this.db.run(sql, [
                formData.tipo,
                formData.categoria_id,
                formData.valor,
                formData.data_efetiva,
                formData.metodo_pagamento,
                formData.descricao,
                formData.cartao_id,
                formData.fatura_id,
                formData.numero_parcelas
            ], function(err) {
                if (err) {
                    console.error('Erro ao inserir transação:', err);
                    reject(err);
                    return;
                }
                resolve(this.lastID);
            });
        });
    }

    async processarParticipantes(transacaoId, formData) {
        console.log('Processando participantes para transação:', transacaoId);
        for (const participante of formData.participantes) {
            await this.insertParticipanteTransacao(transacaoId, participante);
            const contas = await this.getContasParticipante(participante.id);
            if (contas.length > 0) {
                await this.atualizarSaldosContas(contas, participante, formData.tipo);
            }
        }
    }

    async insertParticipanteTransacao(transacaoId, participante) {
        return new Promise((resolve, reject) => {
            const sql = `
                INSERT INTO transacoes_participantes (
                    transacao_id, participante_id, valor_devido
                ) VALUES (?, ?, ?)
            `;

            this.db.run(sql, [
                transacaoId,
                participante.id,
                participante.valor_devido
            ], err => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    async getContasParticipante(participanteId) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT c.id as conta_id
                FROM participantes p
                JOIN participantes_contas pc ON p.id = pc.participante_id
                JOIN contas c ON pc.conta_id = c.id
                WHERE p.id = ? AND p.usa_contas = 1
            `;
            
            this.db.all(sql, [participanteId], (err, contas) => {
                if (err) reject(err);
                else resolve(contas.map(c => c.conta_id));
            });
        });
    }

    async atualizarSaldosContas(contasIds, participante, tipo) {
        const valorPorConta = participante.valor_devido / contasIds.length;
        
        for (const contaId of contasIds) {
            await new Promise((resolve, reject) => {
                const sql = `
                    UPDATE contas 
                    SET saldo_atual = saldo_atual ${tipo === 'RECEITA' ? '+' : '-'} ?
                    WHERE id = ?
                `;

                this.db.run(sql, [valorPorConta, contaId], err => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        }
    }

    async atualizarFatura(formData) {
        return new Promise((resolve, reject) => {
            const sql = `
                UPDATE faturas 
                SET valor_total = valor_total + ?
                WHERE id = ?
            `;

            this.db.run(sql, [formData.valor, formData.fatura_id], err => {
                if (err) reject(err);
                else resolve();
            });
        });
    }
}

export default TransacoesDataManager;