console.log('Iniciando ContasController...');

// Definir o controller de contas no namespace APP
window.APP.controllers.contas = {
    // Função para lidar com o submit do formulário
    handleSubmit: function(event) {
        event.preventDefault();
        console.log('Formulário submetido');
        this.salvarConta();
        return false;
    },

    // Função para salvar nova conta
    salvarConta: function() {
        try {
            const nome = document.getElementById('nome').value;
            const saldo_inicial = parseFloat(document.getElementById('saldo_inicial').value);
            const descricao = document.getElementById('descricao').value;

            console.log('Iniciando salvamento da conta:', { nome, saldo_inicial, descricao });

            const sql = `
                INSERT INTO contas (nome, saldo_atual, saldo_inicial, descricao)
                VALUES (?, ?, ?, ?)
            `;

            APP.db.run(sql, [nome, saldo_inicial, saldo_inicial, descricao], function(err) {
                if (err) {
                    console.error('Erro ao salvar:', err);
                    alert('Erro ao salvar conta: ' + err.message);
                    return;
                }

                console.log('Conta salva. ID:', this.lastID);
                alert('Conta salva com sucesso!');
                document.getElementById('contaForm').reset();
                APP.controllers.contas.carregarContas();
            });
        } catch (error) {
            console.error('Erro geral:', error);
            alert('Erro ao processar: ' + error.message);
        }
    },

    // Função para carregar contas
    carregarContas: function() {
        console.log('Iniciando carregamento de contas');
        
        APP.db.all('SELECT * FROM contas WHERE ativo = 1 ORDER BY data_criacao DESC', [], (err, rows) => {
            if (err) {
                console.error('Erro ao carregar contas:', err);
                return;
            }

            console.log('Contas encontradas:', rows);

            const tbody = document.querySelector('#contasTable tbody');
            if (!tbody) {
                console.error('Elemento tbody não encontrado');
                return;
            }

            tbody.innerHTML = '';

            if (rows.length === 0) {
                const tr = document.createElement('tr');
                tr.innerHTML = '<td colspan="5">Nenhuma conta cadastrada</td>';
                tbody.appendChild(tr);
                return;
            }

            rows.forEach(conta => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${conta.nome}</td>
                    <td>${APP.utils.formatarMoeda(conta.saldo_atual)}</td>
                    <td>${APP.utils.formatarMoeda(conta.saldo_inicial)}</td>
                    <td>${conta.descricao || '-'}</td>
                    <td>${APP.utils.formatarData(conta.data_criacao)}</td>
                `;
                tbody.appendChild(tr);
            });
        });
    }
};

// Manter compatibilidade com o código existente
window.carregarContas = function() {
    APP.controllers.contas.carregarContas();
};

window.handleSubmitConta = function(event) {
    return APP.controllers.contas.handleSubmit(event);
};

console.log('ContasController carregado');