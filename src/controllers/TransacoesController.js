console.log('Iniciando TransacoesController...');

window.APP.controllers.transacoes = {
    METODOS_PAGAMENTO: {
        DINHEIRO: 'DINHEIRO',
        DEBITO: 'DÉBITO',
        CREDITO: 'CRÉDITO',
        PIX: 'PIX',
        VA_VR: 'VA/VR',
        TRANSFERENCIA: 'TRANSFERÊNCIA'
    },

    carregarDadosIniciais: function() {
        console.log('Iniciando carregamento de dados...');
        this.carregarContas();
        this.carregarCategorias();
        this.carregarTransacoes();
        this.inicializarMetodosPagamento();
        this.setDataAtual();
    },

    setDataAtual: function() {
        const hoje = new Date();
        const dataFormatada = hoje.toISOString().split('T')[0]; // Formato YYYY-MM-DD
        const inputDataEfetiva = document.getElementById('data_efetiva');
        if (inputDataEfetiva) {
            inputDataEfetiva.value = dataFormatada;
        }
    },
    
    formatarDataHora: function(dataString) {
        if (!dataString) return '-';
        const data = new Date(dataString);
        return data.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    },

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

    carregarContas: function() {
        console.log('Tentando carregar contas...');
        APP.db.all('SELECT * FROM contas WHERE ativo = 1', [], (err, contas) => {
            if (err) {
                console.error('Erro ao carregar contas:', err);
                return;
            }

            const select = document.getElementById('conta_id');
            if (!select) return;

            select.innerHTML = '<option value="">Selecione uma conta</option>';
            contas.forEach(conta => {
                const option = document.createElement('option');
                option.value = conta.id;
                option.textContent = conta.nome;
                select.appendChild(option);
            });
        });
    },

    carregarCartoes: function(contaId) {
        if (!contaId) return;
        
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

    carregarFaturas: function(cartaoId) {
        if (!cartaoId) return;
        
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
                option.textContent = `${fatura.mes_referencia} - Venc: ${this.formatarDataHora(fatura.data_vencimento)}`;
                select.appendChild(option);
            });
        });
    },

    carregarCategorias: function() {
        console.log('Tentando carregar categorias...');
        APP.db.all('SELECT * FROM categorias WHERE ativo = 1', [], (err, categorias) => {
            if (err) {
                console.error('Erro ao carregar categorias:', err);
                return;
            }

            const select = document.getElementById('categoria_id');
            if (!select) return;

            select.innerHTML = '<option value="">Selecione uma categoria</option>';
            categorias.forEach(categoria => {
                const option = document.createElement('option');
                option.value = categoria.id;
                option.textContent = categoria.nome;
                select.appendChild(option);
            });
        });
    },

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
            ORDER BY t.data_efetiva DESC
        `;

        APP.db.all(sql, [], (err, transacoes) => {
            if (err) {
                console.error('Erro ao carregar transações:', err);
                return;
            }

            const tbody = document.querySelector('#transacoesTable tbody');
            if (!tbody) return;

            tbody.innerHTML = '';

            if (transacoes.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8">Nenhuma transação cadastrada</td></tr>';
                return;
            }

            transacoes.forEach(transacao => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${this.formatarDataHora(transacao.data_efetiva)}</td>
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

    handleTipoChange: function(tipo) {
        const categoriaSelect = document.getElementById('categoria_id');
        
        if (!tipo) return;
        
        APP.db.all('SELECT * FROM categorias WHERE tipo = ? AND ativo = 1', [tipo], (err, categorias) => {
            if (err) {
                console.error('Erro ao filtrar categorias:', err);
                return;
            }

            if (!categoriaSelect) return;

            categoriaSelect.innerHTML = '<option value="">Selecione uma categoria</option>';
            categorias.forEach(categoria => {
                const option = document.createElement('option');
                option.value = categoria.id;
                option.textContent = categoria.nome;
                categoriaSelect.appendChild(option);
            });
        });
    },

    handleMetodoPagamentoChange: function(metodo) {
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

    handleSubmit: function(event) {
        event.preventDefault();
        
        const formData = {
            conta_id: document.getElementById('conta_id').value,
            tipo: document.getElementById('tipo').value,
            categoria_id: document.getElementById('categoria_id').value,
            valor: document.getElementById('valor').value,
            data_efetiva: document.getElementById('data_efetiva').value,
            metodo_pagamento: document.getElementById('metodo_pagamento').value,
            descricao: document.getElementById('descricao').value,
            cartao_id: null,
            fatura_id: null,
            numero_parcelas: 1
        };

        // Validações básicas
        if (!formData.conta_id || !formData.tipo || !formData.categoria_id || 
            !formData.valor || !formData.data_efetiva || !formData.metodo_pagamento) {
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
                    data_efetiva, data_lancamento, metodo_pagamento, descricao,
                    cartao_id, fatura_id, numero_parcelas
                ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?, ?, ?)
            `;
            
        APP.db.run(sql, [
            formData.conta_id,
            formData.tipo,
            formData.categoria_id,
            valor,
            formData.data_efetiva,
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
                });
            }

            alert('Transação salva com sucesso!');
            carregarConteudo('transacoes');
        });

        return false;
    }
};

window.carregarDadosIniciais = function() {
    APP.controllers.transacoes.carregarDadosIniciais();
};

console.log('TransacoesController carregado completamente');