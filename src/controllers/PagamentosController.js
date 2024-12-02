console.log('Iniciando PagamentosController...');

window.APP.controllers.pagamentos = {
    STATUS: {
        PENDENTE: 'PENDENTE',
        CONFIRMADO: 'CONFIRMADO',
        CANCELADO: 'CANCELADO'
    },

    carregarDadosIniciais: function() {
        console.log('Iniciando carregamento de dados de pagamentos...');
        this.carregarPagamentos();
        this.carregarParticipantesSelect();
        this.setDataAtual();
    },

    setDataAtual: function() {
        const hoje = new Date();
        const dataFormatada = hoje.toISOString().split('T')[0];
        const inputDataPagamento = document.getElementById('data_pagamento');
        if (inputDataPagamento) {
            inputDataPagamento.value = dataFormatada;
        }
    },

    carregarParticipantesSelect: function() {
        const sql = 'SELECT id, nome FROM participantes WHERE ativo = 1 ORDER BY nome';
        
        APP.db.all(sql, [], (err, participantes) => {
            if (err) {
                console.error('Erro ao carregar participantes:', err);
                return;
            }

            // Preenche o select de pagador
            const pagadorSelect = document.getElementById('pagador_id');
            if (pagadorSelect) {
                pagadorSelect.innerHTML = '<option value="">Selecione o pagador</option>';
                participantes.forEach(participante => {
                    const option = document.createElement('option');
                    option.value = participante.id;
                    option.textContent = participante.nome;
                    pagadorSelect.appendChild(option);
                });
            }

            // Preenche o select de recebedor
            const recebedorSelect = document.getElementById('recebedor_id');
            if (recebedorSelect) {
                recebedorSelect.innerHTML = '<option value="">Selecione o recebedor</option>';
                participantes.forEach(participante => {
                    const option = document.createElement('option');
                    option.value = participante.id;
                    option.textContent = participante.nome;
                    recebedorSelect.appendChild(option);
                });
            }
        });
    },

    carregarPagamentos: function() {
        const sql = `
            SELECT 
                pp.*,
                pag.nome as pagador_nome,
                rec.nome as recebedor_nome,
                co.nome as conta_origem_nome,
                cd.nome as conta_destino_nome
            FROM pagamentos_participantes pp
            JOIN participantes pag ON pp.pagador_id = pag.id
            JOIN participantes rec ON pp.recebedor_id = rec.id
            LEFT JOIN contas co ON pp.conta_origem_id = co.id
            LEFT JOIN contas cd ON pp.conta_destino_id = cd.id
            WHERE pp.ativo = 1
            ORDER BY pp.data_pagamento DESC
        `;

        APP.db.all(sql, [], (err, pagamentos) => {
            if (err) {
                console.error('Erro ao carregar pagamentos:', err);
                return;
            }

            const tbody = document.querySelector('#pagamentosTable tbody');
            if (!tbody) return;

            tbody.innerHTML = '';
            if (pagamentos.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7">Nenhum pagamento registrado</td></tr>';
                return;
            }

            pagamentos.forEach(pagamento => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${APP.controllers.transacoes.formatarDataHora(pagamento.data_pagamento)}</td>
                    <td>${pagamento.pagador_nome}</td>
                    <td>${pagamento.recebedor_nome}</td>
                    <td>${APP.utils.formatarMoeda(pagamento.valor)}</td>
                    <td>${pagamento.conta_origem_nome || '-'}</td>
                    <td>${pagamento.conta_destino_nome || '-'}</td>
                    <td>
                        <span class="status-${pagamento.status.toLowerCase()}">${pagamento.status}</span>
                        ${this.gerarBotoesAcao(pagamento)}
                    </td>
                `;
                tbody.appendChild(tr);
            });
        });
    },

    gerarBotoesAcao: function(pagamento) {
        if (pagamento.status === this.STATUS.PENDENTE) {
            return `
                <button onclick="APP.controllers.pagamentos.confirmarPagamento(${pagamento.id})" class="btn-confirmar">
                    Confirmar
                </button>
                <button onclick="APP.controllers.pagamentos.cancelarPagamento(${pagamento.id})" class="btn-cancelar">
                    Cancelar
                </button>
            `;
        }
        return '';
    },

    carregarContasParticipante: function(participanteId, targetSelectId) {
        if (!participanteId) {
            const select = document.getElementById(targetSelectId);
            if (select) {
                select.innerHTML = '<option value="">Selecione uma conta</option>';
            }
            return;
        }

        const sql = `
            SELECT c.* 
            FROM contas c
            JOIN participantes_contas pc ON c.id = pc.conta_id
            JOIN participantes p ON pc.participante_id = p.id
            WHERE p.id = ? AND p.usa_contas = 1 AND c.ativo = 1
            ORDER BY c.nome
        `;

        APP.db.all(sql, [participanteId], (err, contas) => {
            if (err) {
                console.error('Erro ao carregar contas do participante:', err);
                return;
            }

            const select = document.getElementById(targetSelectId);
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

    handlePagadorChange: function(pagadorId) {
        this.carregarContasParticipante(pagadorId, 'conta_origem_id');
        this.validarParticipantes();
    },

    handleRecebedorChange: function(recebedorId) {
        this.carregarContasParticipante(recebedorId, 'conta_destino_id');
        this.validarParticipantes();
    },

    validarParticipantes: function() {
        const pagadorId = document.getElementById('pagador_id').value;
        const recebedorId = document.getElementById('recebedor_id').value;

        if (pagadorId && recebedorId && pagadorId === recebedorId) {
            alert('O pagador e o recebedor não podem ser a mesma pessoa');
            document.getElementById('recebedor_id').value = '';
        }
    },

    handleSubmit: async function(event) {
        event.preventDefault();
        
        const formData = {
            pagador_id: document.getElementById('pagador_id').value,
            recebedor_id: document.getElementById('recebedor_id').value,
            valor: document.getElementById('valor').value,
            data_pagamento: document.getElementById('data_pagamento').value,
            conta_origem_id: document.getElementById('conta_origem_id').value,
            conta_destino_id: document.getElementById('conta_destino_id').value,
            descricao: document.getElementById('descricao').value
        };

        // Validações básicas
        if (!formData.pagador_id || !formData.recebedor_id || 
            !formData.valor || !formData.data_pagamento) {
            alert('Por favor, preencha todos os campos obrigatórios');
            return false;
        }

        // Verifica se o pagador usa contas
        const pagador = await new Promise((resolve, reject) => {
            APP.db.get('SELECT usa_contas FROM participantes WHERE id = ?', 
                [formData.pagador_id], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
        });

        // Se o pagador usa contas, valida a conta de origem
        if (pagador.usa_contas && !formData.conta_origem_id) {
            alert('Por favor, selecione uma conta de origem');
            return false;
        }

        try {
            const pagamentoId = await this.inserirPagamento(formData);
            await this.registrarHistorico(pagamentoId, null, this.STATUS.PENDENTE, 'Pagamento registrado');
            
            alert('Pagamento registrado com sucesso!');
            document.getElementById('pagamentoForm').reset();
            this.carregarPagamentos();
            this.setDataAtual();

        } catch (error) {
            console.error('Erro ao processar pagamento:', error);
            alert('Erro ao registrar pagamento');
        }

        return false;
    },

    inserirPagamento: function(dados) {
        return new Promise((resolve, reject) => {
            const sql = `
                INSERT INTO pagamentos_participantes (
                    pagador_id, recebedor_id, valor, 
                    data_pagamento, status, conta_origem_id,
                    conta_destino_id, descricao
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const params = [
                dados.pagador_id,
                dados.recebedor_id,
                dados.valor,
                dados.data_pagamento,
                this.STATUS.PENDENTE,
                dados.conta_origem_id || null,
                dados.conta_destino_id || null,
                dados.descricao || null
            ];

            APP.db.run(sql, params, function(err) {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(this.lastID);
            });
        });
    },

    registrarHistorico: function(pagamentoId, statusAnterior, statusNovo, observacao) {
        return new Promise((resolve, reject) => {
            const sql = `
                INSERT INTO pagamentos_historico (
                    pagamento_id, status_anterior, 
                    status_novo, observacao
                ) VALUES (?, ?, ?, ?)
            `;

            APP.db.run(sql, [pagamentoId, statusAnterior, statusNovo, observacao], (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve();
            });
        });
    },

    confirmarPagamento: async function(pagamentoId) {
        try {
            const pagamento = await this.buscarPagamento(pagamentoId);
            if (!pagamento) {
                throw new Error('Pagamento não encontrado');
            }

            await this.atualizarStatusPagamento(pagamentoId, this.STATUS.CONFIRMADO);
            await this.atualizarSaldosContas(pagamento);
            await this.registrarHistorico(
                pagamentoId, 
                pagamento.status, 
                this.STATUS.CONFIRMADO, 
                'Pagamento confirmado'
            );

            alert('Pagamento confirmado com sucesso!');
            this.carregarPagamentos();

        } catch (error) {
            console.error('Erro ao confirmar pagamento:', error);
            alert('Erro ao confirmar pagamento');
        }
    },

    cancelarPagamento: async function(pagamentoId) {
        try {
            const pagamento = await this.buscarPagamento(pagamentoId);
            if (!pagamento) {
                throw new Error('Pagamento não encontrado');
            }

            await this.atualizarStatusPagamento(pagamentoId, this.STATUS.CANCELADO);
            await this.registrarHistorico(
                pagamentoId, 
                pagamento.status, 
                this.STATUS.CANCELADO, 
                'Pagamento cancelado'
            );

            alert('Pagamento cancelado com sucesso!');
            this.carregarPagamentos();

        } catch (error) {
            console.error('Erro ao cancelar pagamento:', error);
            alert('Erro ao cancelar pagamento');
        }
    },

    buscarPagamento: function(pagamentoId) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM pagamentos_participantes WHERE id = ?`;
            APP.db.get(sql, [pagamentoId], (err, row) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(row);
            });
        });
    },

    atualizarStatusPagamento: function(pagamentoId, novoStatus) {
        return new Promise((resolve, reject) => {
            const sql = `UPDATE pagamentos_participantes SET status = ? WHERE id = ?`;
            APP.db.run(sql, [novoStatus, pagamentoId], (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve();
            });
        });
    },

    atualizarSaldosContas: async function(pagamento) {
        // Primeiro verificamos se o recebedor e pagador usam contas
        const verificacaoParticipantes = await new Promise((resolve, reject) => {
            const sql = `
                SELECT 
                    p.id, 
                    p.usa_contas,
                    p.nome
                FROM participantes p
                WHERE p.id IN (?, ?)
            `;
            
            APP.db.all(sql, [pagamento.pagador_id, pagamento.recebedor_id], (err, rows) => {
                if (err) {
                    reject(err);
                    return;
                }
                const result = {
                    pagador: rows.find(r => r.id === pagamento.pagador_id),
                    recebedor: rows.find(r => r.id === pagamento.recebedor_id)
                };
                resolve(result);
            });
        });

        // Array para armazenar as operações de atualização necessárias
        const atualizacoes = [];

        // Se o pagador usa contas e tem conta de origem definida, debita o valor
        if (verificacaoParticipantes.pagador.usa_contas && pagamento.conta_origem_id) {
            atualizacoes.push({
                contaId: pagamento.conta_origem_id,
                sql: 'UPDATE contas SET saldo_atual = saldo_atual - ? WHERE id = ?'
            });
        }

        // Se o recebedor usa contas e tem conta de destino definida, credita o valor
        if (verificacaoParticipantes.recebedor.usa_contas && pagamento.conta_destino_id) {
            atualizacoes.push({
                contaId: pagamento.conta_destino_id,
                sql: 'UPDATE contas SET saldo_atual = saldo_atual + ? WHERE id = ?'
            });
        }

      // Executa as atualizações necessárias
      for (const atualizacao of atualizacoes) {
        await new Promise((resolve, reject) => {
            APP.db.run(atualizacao.sql, [pagamento.valor, atualizacao.contaId], (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve();
            });
        });
    }
}
};

window.carregarDadosIniciaisPagamentos = function() {
APP.controllers.pagamentos.carregarDadosIniciais();
};

console.log('PagamentosController carregado completamente');