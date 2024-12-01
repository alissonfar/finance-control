console.log('Iniciando ParticipantesController...');

window.APP.controllers.participantes = {
    carregarDadosIniciais: function() {
        console.log('Iniciando carregamento de dados de participantes...');
        this.carregarParticipantes();
    },

    handleUsaContasChange: function(checked) {
        const contasDiv = document.getElementById('contas_vinculadas');
        if (checked) {
            contasDiv.style.display = 'block';
            this.carregarContasSelect();
        } else {
            contasDiv.style.display = 'none';
        }
    },

    carregarContasSelect: function() {
        APP.db.all('SELECT * FROM contas WHERE ativo = 1 ORDER BY nome', [], (err, contas) => {
            if (err) {
                console.error('Erro ao carregar contas:', err);
                return;
            }

            const select = document.getElementById('contas_select');
            if (!select) return;

            select.innerHTML = '';
            contas.forEach(conta => {
                const option = document.createElement('option');
                option.value = conta.id;
                option.textContent = conta.nome;
                select.appendChild(option);
            });
        });
    },

    carregarParticipantes: function() {
        console.log('Tentando carregar participantes...');
        const sql = `
            SELECT 
                p.*,
                GROUP_CONCAT(c.nome) as contas_vinculadas
            FROM participantes p
            LEFT JOIN participantes_contas pc ON p.id = pc.participante_id
            LEFT JOIN contas c ON pc.conta_id = c.id
            WHERE p.ativo = 1 
            GROUP BY p.id
            ORDER BY p.nome
        `;

        APP.db.all(sql, [], (err, participantes) => {
            if (err) {
                console.error('Erro ao carregar participantes:', err);
                return;
            }
    
            // Carrega o select de participantes
            const select = document.getElementById('participantes_select');
            if (select) {
                select.innerHTML = '';
                participantes.forEach(participante => {
                    const option = document.createElement('option');
                    option.value = participante.id;
                    option.textContent = participante.nome;
                    select.appendChild(option);
                });
                select.multiple = true;
            }
    
            // Carrega a tabela de participantes
            const tbody = document.querySelector('#participantesTable tbody');
            if (tbody) {
                tbody.innerHTML = '';
                
                if (participantes.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="5">Nenhum participante cadastrado</td></tr>';
                    return;
                }
    
                participantes.forEach(participante => {
                    const tr = document.createElement('tr');
                    const data = new Date(participante.data_criacao);
                    const dataFormatada = data.toLocaleDateString('pt-BR');
                    
                    tr.innerHTML = `
                        <td>${participante.nome}</td>
                        <td>${participante.descricao || '-'}</td>
                        <td>${participante.usa_contas ? 'Sim' : 'Não'}</td>
                        <td>${participante.contas_vinculadas || '-'}</td>
                        <td>${dataFormatada}</td>
                    `;
                    tbody.appendChild(tr);
                });
            }
        });
    },

    calcularDivisaoAutomatica: function(valor, numParticipantes) {
        const valorPorPessoa = valor / numParticipantes;
        return Number(valorPorPessoa.toFixed(2));
    },

    atualizarValoresParticipantes: function() {
        const participantesSelecionados = Array.from(document.getElementById('participantes_select').selectedOptions);
        const valor = parseFloat(document.getElementById('valor').value);
        const divParticipantes = document.getElementById('valores_participantes');
        
        if (participantesSelecionados.length === 0 || isNaN(valor)) {
            divParticipantes.innerHTML = '';
            return;
        }

        const valorPorPessoa = this.calcularDivisaoAutomatica(valor, participantesSelecionados.length);

        divParticipantes.innerHTML = '';
        participantesSelecionados.forEach((option, index) => {
            const div = document.createElement('div');
            div.className = 'form-group participante-valor';
            div.innerHTML = `
                <label for="participante_${option.value}">${option.textContent}:</label>
                <input type="number" 
                       id="participante_${option.value}" 
                       name="participante_${option.value}" 
                       value="${valorPorPessoa}"
                       data-participante-id="${option.value}"
                       step="0.01"
                       onblur="APP.controllers.participantes.validarSeNecessario(this, ${index === participantesSelecionados.length - 1})"
                       class="valor-participante">
            `;
            divParticipantes.appendChild(div);
        });
    },

    validarSeNecessario: function(input, isUltimoCampo) {
        if (isUltimoCampo) {
            const todosInputs = document.querySelectorAll('.valor-participante');
            let todosPreenchidos = true;
            
            todosInputs.forEach(inp => {
                if (!inp.value || inp.value === '') {
                    todosPreenchidos = false;
                }
            });

            if (todosPreenchidos) {
                this.validarValorTotal(input);
            }
        }
    },

    validarValorTotal: function(input) {
        const valorTotal = parseFloat(document.getElementById('valor').value);
        const todosInputs = document.querySelectorAll('.valor-participante');
        let somaValores = 0;
        
        todosInputs.forEach(inp => {
            somaValores += parseFloat(inp.value) || 0;
        });

        // Arredonda para 2 casas decimais
        somaValores = Number(somaValores.toFixed(2));
        
        if (somaValores !== valorTotal) {
            alert(`A soma dos valores (${somaValores}) deve ser igual ao valor total (${valorTotal})`);
            input.value = this.calcularDivisaoAutomatica(valorTotal, todosInputs.length);
            this.atualizarValoresParticipantes();
        }
    },

    coletarDadosParticipantes: function() {
        const participantes = [];
        document.querySelectorAll('.valor-participante').forEach(input => {
            participantes.push({
                id: input.dataset.participanteId,
                valor_devido: parseFloat(input.value)
            });
        });
        return participantes;
    },

    handleSubmit: function(event) {
        event.preventDefault();
        
        const formData = {
            nome: document.getElementById('nome_participante').value,
            descricao: document.getElementById('descricao_participante').value || null,
            usa_contas: document.getElementById('usa_contas').checked ? 1 : 0,
            data_criacao: new Date().toISOString()
        };
    
        if (!formData.nome) {
            alert('Por favor, preencha o nome do participante');
            return false;
        }

        // Se usa contas, validar seleção de contas
        if (formData.usa_contas) {
            const contasSelecionadas = Array.from(document.getElementById('contas_select').selectedOptions);
            if (contasSelecionadas.length === 0) {
                alert('Por favor, selecione pelo menos uma conta para o participante');
                return false;
            }
        }
    
        APP.db.run(
            'INSERT INTO participantes (nome, descricao, usa_contas, data_criacao) VALUES (?, ?, ?, ?)',
            [formData.nome, formData.descricao, formData.usa_contas, formData.data_criacao],
            function(err) {
                if (err) {
                    console.error('Erro ao salvar participante:', err);
                    alert('Erro ao salvar participante');
                    return;
                }
    
                const participanteId = this.lastID;
                
                // Se usa contas, salvar vínculos
                if (formData.usa_contas) {
                    const contasSelecionadas = Array.from(document.getElementById('contas_select').selectedOptions)
                        .map(option => option.value);

                    const stmt = APP.db.prepare(
                        'INSERT INTO participantes_contas (participante_id, conta_id) VALUES (?, ?)'
                    );

                    contasSelecionadas.forEach(contaId => {
                        stmt.run([participanteId, contaId], err => {
                            if (err) console.error('Erro ao vincular conta:', err);
                        });
                    });

                    stmt.finalize();
                }
    
                alert('Participante cadastrado com sucesso!');
                document.getElementById('participanteForm').reset();
                document.getElementById('contas_vinculadas').style.display = 'none';
                APP.controllers.participantes.carregarParticipantes();
            }
        );
    
        return false;
    }
};

window.carregarDadosIniciaisParticipantes = function() {
    APP.controllers.participantes.carregarDadosIniciais();
};

console.log('ParticipantesController carregado completamente');