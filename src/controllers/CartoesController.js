console.log('Iniciando CartoesController...');

window.APP.controllers.cartoes = {
    carregarDadosIniciais: function() {
        console.log('Iniciando carregamento de dados...');
        this.carregarContas();
        this.carregarCartoes();
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

    carregarCartoes: function() {
        console.log('Tentando carregar cartões...');
        const sql = `
            SELECT cc.*, c.nome as conta_nome
            FROM cartoes_credito cc
            JOIN contas c ON cc.conta_id = c.id
            WHERE cc.ativo = 1
            ORDER BY cc.nome
        `;

        APP.db.all(sql, [], (err, cartoes) => {
            if (err) {
                console.error('Erro ao carregar cartões:', err);
                return;
            }

            const tbody = document.querySelector('#cartoesTable tbody');
            if (!tbody) return;

            tbody.innerHTML = '';

            if (cartoes.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6">Nenhum cartão cadastrado</td></tr>';
                return;
            }

            cartoes.forEach(cartao => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${cartao.nome}</td>
                    <td>${cartao.conta_nome}</td>
                    <td>${APP.utils.formatarMoeda(cartao.limite)}</td>
                    <td>${cartao.dia_fechamento}</td>
                    <td>${cartao.dia_vencimento}</td>
                    <td class="acoes-cartao">
                        <button onclick="window.APP.controllers.cartoes.gerarFatura(${cartao.id})" class="btn-gerar-fatura">
                            Gerar Fatura
                        </button>
                        <button onclick="window.APP.controllers.cartoes.verFaturas(${cartao.id})" class="btn-ver-faturas">
                            Ver Faturas
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        });
    },

    handleSubmit: function(event) {
        event.preventDefault();
        console.log('Iniciando salvamento de cartão...');

        const formData = {
            conta_id: document.getElementById('conta_id').value,
            nome: document.getElementById('nome').value,
            limite: document.getElementById('limite').value,
            dia_fechamento: document.getElementById('dia_fechamento').value,
            dia_vencimento: document.getElementById('dia_vencimento').value
        };

        if (!formData.conta_id || !formData.nome || !formData.limite || 
            !formData.dia_fechamento || !formData.dia_vencimento) {
            alert('Por favor, preencha todos os campos');
            return false;
        }

        if (formData.dia_fechamento < 1 || formData.dia_fechamento > 31 ||
            formData.dia_vencimento < 1 || formData.dia_vencimento > 31) {
            alert('Os dias devem estar entre 1 e 31');
            return false;
        }

        const sql = `
            INSERT INTO cartoes_credito (
                conta_id, nome, limite, 
                dia_fechamento, dia_vencimento
            ) VALUES (?, ?, ?, ?, ?)
        `;

        APP.db.run(sql, [
            formData.conta_id,
            formData.nome,
            formData.limite,
            formData.dia_fechamento,
            formData.dia_vencimento
        ], (err) => {
            if (err) {
                console.error('Erro ao salvar cartão:', err);
                alert('Erro ao salvar cartão');
                return;
            }

            alert('Cartão salvo com sucesso!');
            document.getElementById('cartaoForm').reset();
            this.carregarCartoes();
        });

        return false;
    },

    formatarDataSQL: function(data) {
        const ano = data.getFullYear();
        const mes = String(data.getMonth() + 1).padStart(2, '0');
        const dia = String(data.getDate()).padStart(2, '0');
        return `${ano}-${mes}-${dia}`;
    },

    gerarFatura: function(cartaoId) {
        if (!confirm('Deseja gerar uma nova fatura para este cartão?')) return;

        APP.db.get('SELECT * FROM cartoes_credito WHERE id = ?', [cartaoId], (err, cartao) => {
            if (err || !cartao) {
                console.error('Erro ao buscar cartão:', err);
                alert('Erro ao gerar fatura');
                return;
            }

            const hoje = new Date();
            const proximoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1);
            const mesDoFechamento = new Date(proximoMes.getFullYear(), proximoMes.getMonth() + 1, 1);
            
            const fechamento = new Date(mesDoFechamento.getFullYear(), mesDoFechamento.getMonth(), 1);
            fechamento.setHours(12, 0, 0, 0);
            
            const vencimento = new Date(mesDoFechamento.getFullYear(), mesDoFechamento.getMonth(), 7);
            vencimento.setHours(12, 0, 0, 0);
            
            const mesReferencia = `${fechamento.getFullYear()}-${String(fechamento.getMonth() + 1).padStart(2, '0')}`;

            const sql = `
                INSERT INTO faturas (
                    cartao_id, mes_referencia, 
                    data_fechamento, data_vencimento
                ) VALUES (?, ?, ?, ?)
            `;

            APP.db.run(sql, [
                cartaoId,
                mesReferencia,
                this.formatarDataSQL(fechamento),
                this.formatarDataSQL(vencimento)
            ], (err) => {
                if (err) {
                    console.error('Erro ao gerar fatura:', err);
                    alert('Erro ao gerar fatura');
                    return;
                }

                alert('Fatura gerada com sucesso!');
                this.verFaturas(cartaoId);
            });
        });
    },

    verFaturas: function(cartaoId) {
        const sql = `
            SELECT f.*, cc.nome as cartao_nome
            FROM faturas f
            JOIN cartoes_credito cc ON f.cartao_id = cc.id
            WHERE f.cartao_id = ? AND f.ativo = 1
            ORDER BY f.data_vencimento DESC
        `;

        APP.db.all(sql, [cartaoId], (err, faturas) => {
            if (err) {
                console.error('Erro ao carregar faturas:', err);
                alert('Erro ao carregar faturas');
                return;
            }

            const modalAnterior = document.getElementById('modalFaturas');
            if (modalAnterior) {
                modalAnterior.remove();
            }

            let html = `
                <div id="modalFaturas" class="modal" style="display: block;">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3>Faturas do Cartão</h3>
                            <span class="close" onclick="document.getElementById('modalFaturas').remove()">&times;</span>
                        </div>
                        <div class="modal-body">
                            <table class="faturas-table">
                                <thead>
                                    <tr>
                                        <th>Mês</th>
                                        <th>Fechamento</th>
                                        <th>Vencimento</th>
                                        <th>Valor</th>
                                        <th>Status</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
            `;

            faturas.forEach(fatura => {
                html += `
                    <tr>
                        <td>${fatura.mes_referencia}</td>
                        <td>${APP.utils.formatarData(fatura.data_fechamento)}</td>
                        <td>${APP.utils.formatarData(fatura.data_vencimento)}</td>
                        <td>${APP.utils.formatarMoeda(fatura.valor_total || 0)}</td>
                        <td>${fatura.status || 'ABERTA'}</td>
                        <td>
                            <button onclick="APP.controllers.cartoes.verDetalhesFatura(${fatura.id})" class="btn-detalhes">
                                Ver Detalhes
                            </button>
                        </td>
                    </tr>
                `;
            });

            html += `
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', html);
        });
    },

    verDetalhesFatura: function(faturaId) {
        const sql = `
            SELECT 
                f.*,
                cc.nome as cartao_nome,
                t.id as transacao_id,
                t.descricao,
                t.valor as valor_total,
                t.data_efetiva,
                t.metodo_pagamento,
                cat.nome as categoria_nome,
                GROUP_CONCAT(COALESCE(p.nome, '')) as participantes_nomes,
                GROUP_CONCAT(COALESCE(tp.valor_devido, 0)) as participantes_valores
            FROM faturas f
            JOIN cartoes_credito cc ON f.cartao_id = cc.id
            LEFT JOIN transacoes t ON t.fatura_id = f.id AND t.ativo = 1
            LEFT JOIN categorias cat ON t.categoria_id = cat.id
            LEFT JOIN transacoes_participantes tp ON t.id = tp.transacao_id
            LEFT JOIN participantes p ON tp.participante_id = p.id
            WHERE f.id = ?
            GROUP BY t.id
            ORDER BY t.data_efetiva DESC
        `;

        APP.db.all(sql, [faturaId], (err, rows) => {
            if (err) {
                console.error('Erro ao carregar detalhes da fatura:', err);
                alert('Erro ao carregar detalhes da fatura');
                return;
            }

            if (rows.length === 0) return;

            const panelAnterior = document.getElementById('faturaSidePanel');
            if (panelAnterior) {
                panelAnterior.remove();
            }

            const fatura = rows[0];

            let html = `
                <div id="faturaSidePanel" class="side-panel">
                    <div class="side-panel-header">
                        <h3>Detalhes da Fatura</h3>
                        <span class="side-panel-close" onclick="APP.controllers.cartoes.fecharPainelFatura()">&times;</span>
                    </div>
                    <div class="side-panel-content">
                        <div class="fatura-resumo">
                            <h4>${fatura.cartao_nome} - ${fatura.mes_referencia}</h4>
                            <p>Fechamento: ${APP.utils.formatarData(fatura.data_fechamento)}</p>
                            <p>Vencimento: ${APP.utils.formatarData(fatura.data_vencimento)}</p>
                            <p>Valor Total: ${APP.utils.formatarMoeda(fatura.valor_total || 0)}</p>
                            <p>Status: ${fatura.status || 'ABERTA'}</p>
                        </div>

                        <h4>Transações da Fatura</h4>
            `;

            if (!rows[0].transacao_id) {
                html += '<p>Nenhuma transação registrada</p>';
            } else {
                rows.forEach(row => {
                    if (row.transacao_id) {
                        const nomes = row.participantes_nomes ? row.participantes_nomes.split(',').filter(n => n !== '') : [];
                        const valores = row.participantes_valores ? row.participantes_valores.split(',').filter(v => v !== '') : [];
                        const participantes = nomes.map((nome, index) => ({
                            nome,
                            valor: parseFloat(valores[index]) || 0
                        }));

                        html += `
                            <div class="transacao-item">
                                <div class="transacao-detalhes">
                                    <strong>${row.descricao}</strong>
                                    <small>${row.categoria_nome || 'Sem categoria'}</small>
                                    <small>${APP.utils.formatarData(row.data_efetiva)}</small>
                                    ${participantes.length > 0 ? `
                                        <div class="divisao-detalhes">
                                            <small class="divisao-titulo">Divisão:</small>
                                            ${participantes.map(p => `
                                                <div class="participante-divisao">
                                                    <span>${p.nome}</span>
                                                    <span>${APP.utils.formatarMoeda(p.valor)}</span>
                                                </div>
                                            `).join('')}
                                        </div>
                                    ` : ''}
                                </div>
                                <div class="transacao-valor">
                                    <div class="valor-total">${APP.utils.formatarMoeda(row.valor_total)}</div>
                                    ${participantes.length > 1 ? `
                                        <small class="valor-dividido">Dividido entre ${participantes.length}</small>
                                    ` : ''}
                                </div>
                            </div>
                        `;
                    }
                });
            }

            html += `
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', html);
            
            // Adiciona o CSS necessário se ainda não existir
            if (!document.getElementById('participantesStyle')) {
                const style = document.createElement('style');
                style.id = 'participantesStyle';
                style.textContent = `
                    .divisao-detalhes {
                        margin-top: 8px;
                        font-size: 0.9em;
                        border-top: 1px solid #eee;
                        padding-top: 8px;
                    }
                    .divisao-titulo {
                        display: block;
                        margin-bottom: 4px;
                        color: #666;
                    }
                    .participante-divisao {
                        display: flex;
                        justify-content: space-between;
                        margin: 2px 0;
                        padding: 2px 0;
                    }
                    .valor-dividido {
                        display: block;
                        text-align: right;
                        color: #666;
                        font-size: 0.8em;
                    }
                `;
                document.head.appendChild(style);
            }

            setTimeout(() => {
                document.getElementById('faturaSidePanel').classList.add('open');
            }, 50);
        });
    },
    
    fecharPainelFatura: function() {
        const panel = document.getElementById('faturaSidePanel');
        if (panel) {
            panel.classList.remove('open');
            setTimeout(() => panel.remove(), 300);
        }
    }
};

window.carregarDadosIniciais = function() {
    APP.controllers.cartoes.carregarDadosIniciais();
};

console.log('CartoesController carregado completamente');