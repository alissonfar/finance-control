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
        this.carregarCategorias();
        this.carregarTransacoes();
        this.inicializarMetodosPagamento();
        this.setDataAtual();
        APP.controllers.participantes.carregarParticipantes();
    },

    setDataAtual: function() {
        const hoje = new Date();
        const dataFormatada = hoje.toISOString().split('T')[0];
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
                tr.setAttribute('data-transacao-id', transacao.id);
                tr.style.cursor = 'pointer';
                tr.onclick = () => this.mostrarModalParticipantes(transacao);
                
                tr.innerHTML = `
                    <td>${this.formatarDataHora(transacao.data_efetiva)}</td>
                    <td>${transacao.conta || '-'}</td>
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

    mostrarModalParticipantes: function(transacao) {
        console.log('Abrindo modal para transação:', transacao);
        
        const modal = document.getElementById('participantesModal');
        if (!modal) {
            console.error('Modal não encontrado');
            return;
        }
    
        const sql = `
            SELECT 
                p.nome,
                p.usa_contas,
                tp.valor_devido,
                GROUP_CONCAT(c.nome) as contas_nomes
            FROM transacoes_participantes tp
            JOIN participantes p ON tp.participante_id = p.id
            LEFT JOIN participantes_contas pc ON p.id = pc.participante_id
            LEFT JOIN contas c ON pc.conta_id = c.id
            WHERE tp.transacao_id = ?
            GROUP BY p.id, tp.valor_devido
        `;
    
        APP.db.all(sql, [transacao.id], (err, participantes) => {
            if (err) {
                console.error('Erro ao carregar participantes da transação:', err);
                return;
            }
    
            console.log('Participantes carregados:', participantes);
    

            modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Detalhes dos Participantes</h2>
                    <span class="close" onclick="document.getElementById('participantesModal').style.display='none'">&times;</span>
                </div>
                <div class="modal-body">
                    <div class="transacao-info">
                        <p><strong>Data:</strong> ${this.formatarDataHora(transacao.data_efetiva)}</p>
                        <p><strong>Valor Total:</strong> ${APP.utils.formatarMoeda(transacao.valor)}</p>
                    </div>
                    <div class="participantes-lista">
                        ${participantes.map(p => `
                            <div class="participante-item">
                                <div class="participante-nome">${p.nome}</div>
                                <div class="participante-valor">${APP.utils.formatarMoeda(p.valor_devido)}</div>
                                ${p.usa_contas ? 
                                    `<div class="participante-contas">${p.contas_nomes || 'Sem conta vinculada'}</div>` 
                                    : '<div class="participante-contas">Sem conta</div>'
                                }
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

            modal.style.display = 'block';
        });

        // Fechar modal quando clicar fora
        window.onclick = function(event) {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        };
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
        } else {
            camposCartao.style.display = 'none';
        }
    },

    handleSubmit: async function(event) {
        event.preventDefault();
        
        const formData = {
            tipo: document.getElementById('tipo').value,
            categoria_id: document.getElementById('categoria_id').value,
            valor: document.getElementById('valor').value,
            data_efetiva: document.getElementById('data_efetiva').value,
            metodo_pagamento: document.getElementById('metodo_pagamento').value,
            descricao: document.getElementById('descricao').value,
            cartao_id: null,
            fatura_id: null,
            numero_parcelas: 1,
            participantes: APP.controllers.participantes.coletarDadosParticipantes()
        };
     
        // Validações básicas
        if (!formData.tipo || !formData.categoria_id || 
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
     
        try {
            // Inserir transação
            const transacaoId = await new Promise((resolve, reject) => {
                const sql = `
                    INSERT INTO transacoes (
                        tipo, categoria_id, valor, 
                        data_efetiva, data_lancamento, metodo_pagamento, descricao,
                        cartao_id, fatura_id, numero_parcelas
                    ) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?, ?, ?)
                `;
                
                APP.db.run(sql, [
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
                        reject(err);
                        return;
                    }
                    resolve(this.lastID);
                });
            });
     
            // Processar participantes e suas contas
            if (formData.participantes && formData.participantes.length > 0) {
                for (const participante of formData.participantes) {
                    // 1. Salvar participante na transação
                    await new Promise((resolve, reject) => {
                        const sqlParticipantes = `
                            INSERT INTO transacoes_participantes (
                                transacao_id, participante_id, valor_devido
                            ) VALUES (?, ?, ?)
                        `;
     
                        APP.db.run(sqlParticipantes, [
                            transacaoId,
                            participante.id,
                            participante.valor_devido
                        ], function(err) {
                            if (err) {
                                reject(err);
                            } else {
                                resolve();
                            }
                        });
                    });
     
                    // 2. Verificar e atualizar contas do participante
                    const contasParticipante = await this.verificarContasParticipantes(participante.id);
                    
                    if (contasParticipante.length > 0) {
                        // Se participante tem mais de uma conta, divide o valor entre elas
                        const valorPorConta = participante.valor_devido / contasParticipante.length;
                        
                        for (const contaId of contasParticipante) {
                            await new Promise((resolve, reject) => {
                                const sqlAtualizarSaldo = `
                                    UPDATE contas 
                                    SET saldo_atual = saldo_atual ${formData.tipo === 'RECEITA' ? '+' : '-'} ?
                                    WHERE id = ?
                                `;
     
                                APP.db.run(sqlAtualizarSaldo, [valorPorConta, contaId], function(err) {
                                    if (err) {
                                        reject(err);
                                    } else {
                                        resolve();
                                    }
                                });
                            });
                        }
                    }
                }
            }
     
            // Atualizar fatura se for cartão de crédito
            if (formData.metodo_pagamento === this.METODOS_PAGAMENTO.CREDITO) {
                await new Promise((resolve, reject) => {
                    const sqlAtualizarFatura = `
                        UPDATE faturas 
                        SET valor_total = valor_total + ?
                        WHERE id = ?
                    `;
     
                    APP.db.run(sqlAtualizarFatura, [valor, formData.fatura_id], function(err) {
                        if (err) {
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
                });
            }
     
            alert('Transação salva com sucesso!');
            carregarConteudo('transacoes');
     
        } catch (error) {
            console.error('Erro ao processar transação:', error);
            alert('Erro ao salvar transação');
        }
     
        return false;
     },

    // Adicionar este novo método ao controller
    verificarContasParticipantes: async function(participanteId) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT c.id as conta_id
                FROM participantes p
                JOIN participantes_contas pc ON p.id = pc.participante_id
                JOIN contas c ON pc.conta_id = c.id
                WHERE p.id = ? AND p.usa_contas = 1
            `;
            
            APP.db.all(sql, [participanteId], (err, contas) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(contas.map(c => c.conta_id));
            });
        });
    },
};

window.carregarDadosIniciais = function() {
    APP.controllers.transacoes.carregarDadosIniciais();
};

console.log('TransacoesController carregado completamente');