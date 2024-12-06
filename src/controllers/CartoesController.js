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

            // Pegar data atual
            const hoje = new Date();
            
            // Ir para o primeiro dia do mês que vem (dezembro)
            const proximoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1);
            
            // Ir para o próximo mês (janeiro)
            const mesDoFechamento = new Date(proximoMes.getFullYear(), proximoMes.getMonth() + 1, 1);
            
            // Data de fechamento (dia 1 de janeiro)
            const fechamento = new Date(mesDoFechamento.getFullYear(), mesDoFechamento.getMonth(), 1);
            fechamento.setHours(12, 0, 0, 0);
            
            // Data de vencimento (dia 7 de janeiro)
            const vencimento = new Date(mesDoFechamento.getFullYear(), mesDoFechamento.getMonth(), 7);
            vencimento.setHours(12, 0, 0, 0);
            
            // Mês de referência será janeiro/2025
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
    
            // Remove modal anterior se existir
            const modalAnterior = document.getElementById('modalFaturas');
            if (modalAnterior) {
                modalAnterior.remove();
            }
    
            let html = `
                <div id="modalFaturas" class="modal" style="display: block;">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h2>Faturas do Cartão</h2>
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
    }
};

window.carregarDadosIniciais = function() {
    APP.controllers.cartoes.carregarDadosIniciais();
};

console.log('CartoesController carregado completamente');