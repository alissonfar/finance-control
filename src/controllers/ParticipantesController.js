console.log('Iniciando ParticipantesController...');

window.APP.controllers.participantes = {
    carregarDadosIniciais: function() {
        console.log('Iniciando carregamento de dados de participantes...');
        this.carregarParticipantes();
    },

    carregarParticipantes: function() {
        console.log('Tentando carregar participantes...');
        APP.db.all('SELECT * FROM participantes WHERE ativo = 1 ORDER BY nome', [], (err, participantes) => {
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
                    tbody.innerHTML = '<tr><td colspan="3">Nenhum participante cadastrado</td></tr>';
                    return;
                }
    
                participantes.forEach(participante => {
                    const tr = document.createElement('tr');
                    // Ajusta a data para o timezone local
                    const data = new Date(participante.data_criacao);
                    const dataFormatada = data.toLocaleDateString('pt-BR');
                    
                    tr.innerHTML = `
                        <td>${participante.nome}</td>
                        <td>${participante.descricao || '-'}</td>
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
        
        // Gera a data atual no formato ISO com timezone local
        const dataAtual = new Date().toISOString();
        
        const formData = {
            nome: document.getElementById('nome_participante').value,
            descricao: document.getElementById('descricao_participante').value || null,
            data_criacao: dataAtual
        };
    
        if (!formData.nome) {
            alert('Por favor, preencha o nome do participante');
            return false;
        }
    
        const sql = 'INSERT INTO participantes (nome, descricao, data_criacao) VALUES (?, ?, ?)';
        
        APP.db.run(sql, [formData.nome, formData.descricao, formData.data_criacao], function(err) {
            if (err) {
                console.error('Erro ao salvar participante:', err);
                alert('Erro ao salvar participante');
                return;
            }
    
            alert('Participante cadastrado com sucesso!');
            document.getElementById('nome_participante').value = '';
            document.getElementById('descricao_participante').value = '';
            APP.controllers.participantes.carregarParticipantes();
        });
    
        return false;
    }
};

window.carregarDadosIniciaisParticipantes = function() {
    APP.controllers.participantes.carregarDadosIniciais();
};

console.log('ParticipantesController carregado completamente');