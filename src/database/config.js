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
                conta_id INTEGER NOT NULL,
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
        // Criar tabela participantes
        db.run(`
            CREATE TABLE IF NOT EXISTS participantes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            descricao TEXT,
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

        // Adicionar novas colunas na tabela transacoes
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