console.log('Iniciando TransacoesController...');

// Definir o controller de transações no namespace APP
window.APP.controllers.transacoes = {
    // Constantes do controller
    METODOS_PAGAMENTO: {
        DINHEIRO: 'DINHEIRO',
        DEBITO: 'DÉBITO',
        CREDITO: 'CRÉDITO',
        PIX: 'PIX',
        VA_VR: 'VA/VR',
        TRANSFERENCIA: 'TRANSFERÊNCIA'
    },

    // Função para carregar dados iniciais
    carregarDadosIniciais: function() {
        console.log('Iniciando carregamento de dados...');
        this.carregarContas();
        this.carregarCategorias();
        this.carregarTransacoes();
        this.inicializarMetodosPagamento();
    },

    // Inicializar select de métodos de pagamento
    inicializarMetodosPagamento: function() {
        const select = document.getElementById('metodo_pagamento');
        if (!select) return;

        select.innerHTML = '<option value="">Selecione o método</option>';
        Object.entries(this.METODOS_PAGAMENTO).forEach(([key, value]) => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = value;
            select.appendChild(option);
        });
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

    // Função para carregar cartões de crédito da conta selecionada
    carregarCartoes: function(contaId) {
        if (!contaId) return;
        
        console.log('Carregando cartões para conta:', contaId);
        const sql = 'SELECT * FROM cartoes_credito WHERE conta_id = ? AND ativo = 1';
        
        APP.db.all(sql, [contaId], (err, cartoes) => {
            if (err) {
                console.error('Erro ao carregar cartões:', err);
                return;
            }

            const select = document.getElementById('cartao_id');
            if (!select) return;

            select.innerHTML = '<option value="">Selecione um cartão</option>';
            cartoes.forEach(cartao => {
                const option = document.createElement('option');
                option.value = cartao.id;
                option.textContent = cartao.nome;
                select.appendChild(option);
            });
        });
    },

    // Função para carregar faturas do cartão selecionado
    carregarFaturas: function(cartaoId) {
        if (!cartaoId) return;
        
        console.log('Carregando faturas para cartão:', cartaoId);
        const sql = `
            SELECT * FROM faturas 
            WHERE cartao_id = ? 
            AND status = 'ABERTA' 
            AND ativo = 1
            ORDER BY data_vencimento DESC
        `;
        
        APP.db.all(sql, [cartaoId], (err, faturas) => {
            if (err) {
                console.error('Erro ao carregar faturas:', err);
                return;
            }

            const select = document.getElementById('fatura_id');
            if (!select) return;

            select.innerHTML = '<option value="">Selecione uma fatura</option>';
            faturas.forEach(fatura => {
                const option = document.createElement('option');
                option.value = fatura.id;
                option.textContent = `${fatura.mes_referencia} - Venc: ${APP.utils.formatarData(fatura.data_vencimento)}`;
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
            SELECT 
                t.*, 
                c.nome as conta_nome, 
                cat.nome as categoria_nome,
                cc.nome as cartao_nome
            FROM transacoes t 
            JOIN contas c ON t.conta_id = c.id 
            JOIN categorias cat ON t.categoria_id = cat.id 
            LEFT JOIN cartoes_credito cc ON t.cartao_id = cc.id
            WHERE t.ativo = 1 
            ORDER BY t.data_transacao DESC
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
                tr.innerHTML = '<td colspan="8">Nenhuma transação cadastrada</td>';
                tbody.appendChild(tr);
                return;
            }

            transacoes.forEach(transacao => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${APP.utils.formatarData(transacao.data_transacao)}</td>
                    <td>${transacao.conta_nome}</td>
                    <td>${transacao.categoria_nome}</td>
                    <td>${transacao.tipo}</td>
                    <td>${APP.utils.formatarMoeda(transacao.valor)}</td>
                    <td>${transacao.metodo_pagamento}</td>
                    <td>${transacao.cartao_nome || '-'}</td>
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

    // Função para lidar com mudança no método de pagamento
    handleMetodoPagamentoChange: function(metodo) {
        console.log('Método de pagamento alterado:', metodo);
        const camposCartao = document.getElementById('campos_cartao_credito');
        if (!camposCartao) return;

        if (metodo === this.METODOS_PAGAMENTO.CREDITO) {
            camposCartao.style.display = 'block';
            const contaId = document.getElementById('conta_id').value;
            this.carregarCartoes(contaId);
        } else {
            camposCartao.style.display = 'none';
        }
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
            data_transacao: document.getElementById('data_transacao').value,
            metodo_pagamento: document.getElementById('metodo_pagamento').value,
            descricao: document.getElementById('descricao').value,
            cartao_id: null,
            fatura_id: null,
            numero_parcelas: 1
        };

        console.log('Dados do formulário:', formData);

        // Validações básicas
        if (!formData.conta_id || !formData.tipo || !formData.categoria_id || 
            !formData.valor || !formData.data_transacao || !formData.metodo_pagamento) {
            alert('Por favor, preencha todos os campos obrigatórios');
            return false;
        }

        const valor = parseFloat(formData.valor);
        if (isNaN(valor)) {
            alert('Por favor, insira um valor válido');
            return false;
        }

        // Validações específicas para cartão de crédito
        if (formData.metodo_pagamento === this.METODOS_PAGAMENTO.CREDITO) {
            formData.cartao_id = document.getElementById('cartao_id').value;
            formData.fatura_id = document.getElementById('fatura_id').value;
            formData.numero_parcelas = parseInt(document.getElementById('numero_parcelas').value) || 1;

            if (!formData.cartao_id || !formData.fatura_id) {
                alert('Por favor, selecione o cartão e a fatura');
                return false;
            }
        }

        // Inserir transação
        const sql = `
            INSERT INTO transacoes (
                conta_id, tipo, categoria_id, valor, 
                data_transacao, metodo_pagamento, descricao,
                cartao_id, fatura_id, numero_parcelas
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        APP.db.run(sql, [
            formData.conta_id,
            formData.tipo,
            formData.categoria_id,
            valor,
            formData.data_transacao,
            formData.metodo_pagamento,
            formData.descricao,
            formData.cartao_id,
            formData.fatura_id,
            formData.numero_parcelas
        ], function(err) {
            if (err) {
                console.error('Erro ao salvar transação:', err);
                alert('Erro ao salvar transação');
                return;
            }

            console.log('Transação salva com sucesso, atualizando saldo...');

            // Se for cartão de crédito, atualiza o valor da fatura
            if (formData.metodo_pagamento === APP.controllers.transacoes.METODOS_PAGAMENTO.CREDITO) {
                const sqlAtualizarFatura = `
                    UPDATE faturas 
                    SET valor_total = valor_total + ?
                    WHERE id = ?
                `;

                APP.db.run(sqlAtualizarFatura, [valor, formData.fatura_id], function(err) {
                    if (err) {
                        console.error('Erro ao atualizar valor da fatura:', err);
                    }
                });
            } else {
                // Se não for cartão de crédito, atualiza o saldo da conta
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
                });
            }

            alert('Transação salva com sucesso!');
            carregarConteudo('transacoes');
        });

        return false;
    }
};

// Manter compatibilidade com o código existente
window.carregarDadosIniciais = function() {
    APP.controllers.transacoes.carregarDadosIniciais();
};

console.log('TransacoesController carregado completamente');