console.log('Iniciando TransacoesController...');

// Definir o controller de transações no namespace APP
window.APP.controllers.transacoes = {
    // Função para carregar dados iniciais
    carregarDadosIniciais: function() {
        console.log('Iniciando carregamento de dados...');
        this.carregarContas();
        this.carregarCategorias();
        this.carregarTransacoes();
    },

    // Função para carregar contas no select
    carregarContas: function() {
        console.log('Tentando carregar contas...');
        APP.db.all('SELECT * FROM contas WHERE ativo = 1', [], (err, contas) => {
            if (err) {
                console.error('Erro ao carregar contas:', err);
                return;
            }

            console.log('Contas carregadas:', contas);
            const select = document.getElementById('conta_id');
            if (!select) {
                console.error('Elemento select "conta_id" não encontrado');
                return;
            }

            select.innerHTML = '<option value="">Selecione uma conta</option>';
            contas.forEach(conta => {
                const option = document.createElement('option');
                option.value = conta.id;
                option.textContent = conta.nome;
                select.appendChild(option);
            });
        });
    },

    // Função para carregar categorias no select
    carregarCategorias: function() {
        console.log('Tentando carregar categorias...');
        APP.db.all('SELECT * FROM categorias WHERE ativo = 1', [], (err, categorias) => {
            if (err) {
                console.error('Erro ao carregar categorias:', err);
                return;
            }

            console.log('Categorias carregadas:', categorias);
            const select = document.getElementById('categoria_id');
            if (!select) {
                console.error('Elemento select "categoria_id" não encontrado');
                return;
            }

            select.innerHTML = '<option value="">Selecione uma categoria</option>';
            categorias.forEach(categoria => {
                const option = document.createElement('option');
                option.value = categoria.id;
                option.textContent = categoria.nome;
                select.appendChild(option);
            });
        });
    },

    // Função para carregar transações
    carregarTransacoes: function() {
        console.log('Tentando carregar transações...');
        const sql = `
            SELECT t.*, c.nome as conta_nome, cat.nome as categoria_nome 
            FROM transacoes t 
            JOIN contas c ON t.conta_id = c.id 
            JOIN categorias cat ON t.categoria_id = cat.id 
            WHERE t.ativo = 1 
            ORDER BY t.data DESC
        `;

        APP.db.all(sql, [], (err, transacoes) => {
            if (err) {
                console.error('Erro ao carregar transações:', err);
                return;
            }

            console.log('Transações carregadas:', transacoes);
            const tbody = document.querySelector('#transacoesTable tbody');
            if (!tbody) {
                console.error('Elemento tbody não encontrado');
                return;
            }

            tbody.innerHTML = '';

            if (transacoes.length === 0) {
                const tr = document.createElement('tr');
                tr.innerHTML = '<td colspan="7">Nenhuma transação cadastrada</td>';
                tbody.appendChild(tr);
                return;
            }

            transacoes.forEach(transacao => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${APP.utils.formatarData(transacao.data)}</td>
                    <td>${transacao.conta_nome}</td>
                    <td>${transacao.categoria_nome}</td>
                    <td>${transacao.tipo}</td>
                    <td>${APP.utils.formatarMoeda(transacao.valor)}</td>
                    <td>${transacao.metodo_pagamento}</td>
                    <td>${transacao.descricao || '-'}</td>
                `;
                tbody.appendChild(tr);
            });
        });
    },

    // Função para lidar com mudança no tipo de transação
    handleTipoChange: function(tipo) {
        console.log('Tipo alterado:', tipo);
        const categoriaSelect = document.getElementById('categoria_id');
        
        if (!tipo) {
            console.log('Tipo não selecionado');
            return;
        }
        
        APP.db.all('SELECT * FROM categorias WHERE tipo = ? AND ativo = 1', [tipo], (err, categorias) => {
            if (err) {
                console.error('Erro ao filtrar categorias:', err);
                return;
            }

            console.log('Categorias filtradas:', categorias);
            if (!categoriaSelect) {
                console.error('Elemento select categoria não encontrado');
                return;
            }

            categoriaSelect.innerHTML = '<option value="">Selecione uma categoria</option>';
            categorias.forEach(categoria => {
                const option = document.createElement('option');
                option.value = categoria.id;
                option.textContent = categoria.nome;
                categoriaSelect.appendChild(option);
            });
        });
    },

    // Função para salvar transação
    handleSubmit: function(event) {
        event.preventDefault();
        console.log('Iniciando salvamento de transação...');
        
        const formData = {
            conta_id: document.getElementById('conta_id').value,
            tipo: document.getElementById('tipo').value,
            categoria_id: document.getElementById('categoria_id').value,
            valor: document.getElementById('valor').value,
            data: document.getElementById('data_transacao').value,
            metodo_pagamento: document.getElementById('metodo_pagamento').value,
            descricao: document.getElementById('descricao').value
        };

        console.log('Dados do formulário:', formData);

        // Validações básicas
        if (!formData.conta_id || !formData.tipo || !formData.categoria_id || !formData.valor || !formData.data) {
            alert('Por favor, preencha todos os campos obrigatórios');
            return false;
        }

        const valor = parseFloat(formData.valor);
        if (isNaN(valor)) {
            alert('Por favor, insira um valor válido');
            return false;
        }

        // Inserir transação
        const sql = `
            INSERT INTO transacoes (
                conta_id, tipo, categoria_id, valor, 
                data, metodo_pagamento, descricao
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        APP.db.run(sql, [
            formData.conta_id,
            formData.tipo,
            formData.categoria_id,
            valor,
            formData.data,
            formData.metodo_pagamento,
            formData.descricao
        ], function(err) {
            if (err) {
                console.error('Erro ao salvar transação:', err);
                alert('Erro ao salvar transação');
                return;
            }

            console.log('Transação salva com sucesso, atualizando saldo...');

            // Atualizar saldo da conta
            const sqlAtualizarSaldo = `
                UPDATE contas 
                SET saldo_atual = saldo_atual ${formData.tipo === 'RECEITA' ? '+' : '-'} ?
                WHERE id = ?
            `;

            APP.db.run(sqlAtualizarSaldo, [valor, formData.conta_id], function(err) {
                if (err) {
                    console.error('Erro ao atualizar saldo:', err);
                    alert('Erro ao atualizar saldo da conta');
                    return;
                }

                console.log('Saldo atualizado com sucesso');
                alert('Transação salva com sucesso!');
                document.getElementById('transacaoForm').reset();
                APP.controllers.transacoes.carregarDadosIniciais();
            });
        });

        return false;
    }
};

// Manter compatibilidade com o código existente
window.carregarDadosIniciais = function() {
    APP.controllers.transacoes.carregarDadosIniciais();
};

console.log('TransacoesController carregado completamente');