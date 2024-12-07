const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.db');
console.log('Caminho do banco de dados:', dbPath);

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err);
    } else {
        console.log('Conectado ao banco de dados SQLite');
        initDatabase();
    }
});

function initDatabase() {
    db.serialize(() => {
        // Criar tabela contas
        db.run(`
            CREATE TABLE IF NOT EXISTS contas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nome TEXT NOT NULL,
                saldo_atual DECIMAL(10,2) NOT NULL,
                saldo_inicial DECIMAL(10,2) NOT NULL,
                descricao TEXT,
                data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
                ativo INTEGER DEFAULT 1
            )
        `, (err) => {
            if (err) {
                console.error('Erro ao criar tabela:', err);
            } else {
                console.log('Tabela contas criada/verificada');
                
                // Verificar se a tabela foi criada
                db.get("SELECT COUNT(*) as count FROM contas", [], (err, row) => {
                    if (err) {
                        console.error('Erro ao verificar tabela:', err);
                    } else {
                        console.log('Tabela contas OK. Registros:', row.count);
                    }
                });
            }
        });

        // Criar tabela categorias
        db.run(`
            CREATE TABLE IF NOT EXISTS categorias (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nome TEXT NOT NULL,
                tipo TEXT NOT NULL CHECK (tipo IN ('RECEITA', 'DESPESA')),
                ativo INTEGER DEFAULT 1
            )
        `, (err) => {
            if (err) {
                console.error('Erro ao criar tabela categorias:', err);
            } else {
                console.log('Tabela categorias verificada/criada');
                // Verificar se já existem categorias
                db.get('SELECT COUNT(*) as count FROM categorias', [], (err, row) => {
                    if (err) {
                        console.error('Erro ao verificar categorias:', err);
                        return;
                    }
                    
                    if (row.count === 0) {
                        // Inserir categorias padrão apenas se não existirem
                        const categoriasPadrao = [
                            ['Salário', 'RECEITA'],
                            ['Alimentação', 'DESPESA'],
                            ['Transporte', 'DESPESA'],
                            ['Lazer', 'DESPESA'],
                            ['Moradia', 'DESPESA'],
                            ['Outros', 'DESPESA'],
                            ['Outros', 'RECEITA']
                        ];

                        const stmt = db.prepare('INSERT INTO categorias (nome, tipo) VALUES (?, ?)');
                        categoriasPadrao.forEach(cat => {
                            stmt.run(cat, (err) => {
                                if (err) console.error('Erro ao inserir categoria:', cat, err);
                            });
                        });
                        stmt.finalize();
                        console.log('Categorias padrão inseridas');
                    }
                });
            }
        });

        // Criar tabela transacoes
        db.run(`
            CREATE TABLE IF NOT EXISTS transacoes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                conta_id INTEGER,
                categoria_id INTEGER NOT NULL,
                tipo TEXT NOT NULL CHECK (tipo IN ('RECEITA', 'DESPESA')),
                valor DECIMAL(10,2) NOT NULL,
                data_efetiva DATE NOT NULL,        -- Data que a transação ocorreu
                data_lancamento DATETIME DEFAULT CURRENT_TIMESTAMP,  -- Data que foi registrada no sistema
                descricao TEXT,
                metodo_pagamento TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'CONFIRMADO',
                ativo INTEGER DEFAULT 1,
                cartao_id INTEGER REFERENCES cartoes_credito(id),
                fatura_id INTEGER REFERENCES faturas(id),
                numero_parcelas INTEGER DEFAULT 1,
                FOREIGN KEY (conta_id) REFERENCES contas(id),
                FOREIGN KEY (categoria_id) REFERENCES categorias(id)
            )
            
        `, (err) => {
            if (err) {
                console.error('Erro ao criar tabela transacoes:', err);
            } else {
                console.log('Tabela transacoes verificada/criada');
            }
        });

        // Criar tabela cartoes_credito
        db.run(`
            CREATE TABLE IF NOT EXISTS cartoes_credito (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                conta_id INTEGER NOT NULL,
                nome TEXT NOT NULL,
                limite DECIMAL(10,2) NOT NULL,
                dia_fechamento INTEGER NOT NULL,
                dia_vencimento INTEGER NOT NULL,
                data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
                ativo INTEGER DEFAULT 1,
                FOREIGN KEY (conta_id) REFERENCES contas(id)
            )
        `, (err) => {
            if (err) {
                console.error('Erro ao criar tabela cartoes_credito:', err);
            } else {
                console.log('Tabela cartoes_credito verificada/criada');
            }
        });

        // Criar tabela faturas
        db.run(`
            CREATE TABLE IF NOT EXISTS faturas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                cartao_id INTEGER NOT NULL,
                mes_referencia TEXT NOT NULL,
                data_fechamento DATE NOT NULL,
                data_vencimento DATE NOT NULL,
                valor_total DECIMAL(10,2) DEFAULT 0,
                status TEXT DEFAULT 'ABERTA',
                data_pagamento DATE,
                data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
                ativo INTEGER DEFAULT 1,
                FOREIGN KEY (cartao_id) REFERENCES cartoes_credito(id)
            )
        `, (err) => {
            if (err) {
                console.error('Erro ao criar tabela faturas:', err);
            } else {
                console.log('Tabela faturas verificada/criada');
            }
        })

        // Criar tabela participantes com nova coluna usa_contas
        db.run(`
            CREATE TABLE IF NOT EXISTS participantes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nome TEXT NOT NULL,
                descricao TEXT,
                usa_contas INTEGER DEFAULT 0,
                ativo INTEGER DEFAULT 1,
                data_criacao TEXT NOT NULL
            )
        `, (err) => {
            if (err) {
                console.error('Erro ao criar tabela participantes:', err);
            } else {
                console.log('Tabela participantes verificada/criada');
            }
        });

        // Criar tabela participantes_contas
        db.run(`
            CREATE TABLE IF NOT EXISTS participantes_contas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                participante_id INTEGER NOT NULL,
                conta_id INTEGER NOT NULL,
                data_vinculo DATETIME DEFAULT CURRENT_TIMESTAMP,
                ativo INTEGER DEFAULT 1,
                FOREIGN KEY (participante_id) REFERENCES participantes(id),
                FOREIGN KEY (conta_id) REFERENCES contas(id)
            )
        `, (err) => {
            if (err) {
                console.error('Erro ao criar tabela participantes_contas:', err);
            } else {
                console.log('Tabela participantes_contas verificada/criada');
            }
        });

            // Criar tabela de pagamentos entre participantes
        db.run(`
            CREATE TABLE IF NOT EXISTS pagamentos_participantes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                pagador_id INTEGER NOT NULL,
                recebedor_id INTEGER NOT NULL,
                valor DECIMAL(10,2) NOT NULL,
                data_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
                data_pagamento DATETIME NOT NULL,
                status TEXT NOT NULL CHECK (status IN ('PENDENTE', 'CONFIRMADO', 'CANCELADO')),
                descricao TEXT,
                conta_origem_id INTEGER,
                conta_destino_id INTEGER,
                transacao_origem_id INTEGER,
                ativo INTEGER DEFAULT 1,
                FOREIGN KEY (pagador_id) REFERENCES participantes(id),
                FOREIGN KEY (recebedor_id) REFERENCES participantes(id),
                FOREIGN KEY (conta_origem_id) REFERENCES contas(id),
                FOREIGN KEY (conta_destino_id) REFERENCES contas(id),
                FOREIGN KEY (transacao_origem_id) REFERENCES transacoes(id)
            )
        `, (err) => {
            if (err) {
                console.error('Erro ao criar tabela pagamentos_participantes:', err);
            } else {
                console.log('Tabela pagamentos_participantes verificada/criada');
            }
        });

        // Criar tabela de histórico de pagamentos
        db.run(`
            CREATE TABLE IF NOT EXISTS pagamentos_historico (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                pagamento_id INTEGER NOT NULL,
                status_anterior TEXT,
                status_novo TEXT NOT NULL,
                data_alteracao DATETIME DEFAULT CURRENT_TIMESTAMP,
                observacao TEXT,
                FOREIGN KEY (pagamento_id) REFERENCES pagamentos_participantes(id)
            )
        `, (err) => {
            if (err) {
                console.error('Erro ao criar tabela pagamentos_historico:', err);
            } else {
                console.log('Tabela pagamentos_historico verificada/criada');
            }
        });

        // Criar índices para otimização
        db.run(`CREATE INDEX IF NOT EXISTS idx_pagamentos_pagador ON pagamentos_participantes(pagador_id)`, err => {
            if (err) console.log('Índice pagador já existe ou erro:', err);
        });

        db.run(`CREATE INDEX IF NOT EXISTS idx_pagamentos_recebedor ON pagamentos_participantes(recebedor_id)`, err => {
            if (err) console.log('Índice recebedor já existe ou erro:', err);
        });

        db.run(`CREATE INDEX IF NOT EXISTS idx_pagamentos_status ON pagamentos_participantes(status)`, err => {
            if (err) console.log('Índice status já existe ou erro:', err);
        });

        db.run(`CREATE INDEX IF NOT EXISTS idx_pagamentos_datas ON pagamentos_participantes(data_pagamento, data_registro)`, err => {
            if (err) console.log('Índice datas já existe ou erro:', err);
        });


        // Criar tabela transacoes_participantes
        db.run(`
            CREATE TABLE IF NOT EXISTS transacoes_participantes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                transacao_id INTEGER NOT NULL,
                participante_id INTEGER NOT NULL,
                valor_devido DECIMAL(10,2) NOT NULL,
                data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (transacao_id) REFERENCES transacoes(id),
                FOREIGN KEY (participante_id) REFERENCES participantes(id)
            )
        `, (err) => {
            if (err) {
                console.error('Erro ao criar tabela transacoes_participantes:', err);
            } else {
                console.log('Tabela transacoes_participantes verificada/criada');
            }
        });

        // Adicionar novas colunas e índices
        const alteracoes = [
            {
                sql: `ALTER TABLE transacoes ADD COLUMN cartao_id INTEGER REFERENCES cartoes_credito(id)`,
                mensagem: 'Coluna cartao_id já existe ou erro:'
            },
            {
                sql: `ALTER TABLE transacoes ADD COLUMN fatura_id INTEGER REFERENCES faturas(id)`,
                mensagem: 'Coluna fatura_id já existe ou erro:'
            },
            {
                sql: `ALTER TABLE transacoes ADD COLUMN numero_parcelas INTEGER DEFAULT 1`,
                mensagem: 'Coluna numero_parcelas já existe ou erro:'
            },
            {
                sql: `CREATE INDEX IF NOT EXISTS idx_participantes_contas_participante ON participantes_contas(participante_id)`,
                mensagem: 'Índice participantes_contas_participante já existe ou erro:'
            },
            {
                sql: `CREATE INDEX IF NOT EXISTS idx_participantes_contas_conta ON participantes_contas(conta_id)`,
                mensagem: 'Índice participantes_contas_conta já existe ou erro:'
            }
        ];

        alteracoes.forEach(alteracao => {
            db.run(alteracao.sql, (err) => {
                if (err) {
                    console.log(alteracao.mensagem, err);
                }
            });
        });
    });
}

process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('Erro ao fechar banco:', err);
        } else {
            console.log('Conexão com banco fechada');
        }
        process.exit(0);
    });
});

module.exports = db;