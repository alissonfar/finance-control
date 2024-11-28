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

        db.run(`
            CREATE TABLE IF NOT EXISTS transacoes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                conta_id INTEGER NOT NULL,
                categoria_id INTEGER NOT NULL,
                tipo TEXT NOT NULL CHECK (tipo IN ('RECEITA', 'DESPESA')),
                valor DECIMAL(10,2) NOT NULL,
                data_transacao DATE NOT NULL,
                descricao TEXT,
                metodo_pagamento TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'CONFIRMADO',
                data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
                ativo INTEGER DEFAULT 1,
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