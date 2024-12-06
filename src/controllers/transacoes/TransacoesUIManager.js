class TransacoesUIManager {
    constructor() {
        this.elements = this.cacheElements();
    }

    cacheElements() {
        return {
            form: document.getElementById('transacaoForm'),
            tipo: document.getElementById('tipo'),
            categoriaSelect: document.getElementById('categoria_id'),
            valor: document.getElementById('valor'),
            dataEfetiva: document.getElementById('data_efetiva'),
            metodoPagamento: document.getElementById('metodo_pagamento'),
            descricao: document.getElementById('descricao'),
            camposCartao: document.getElementById('campos_cartao_credito'),
            cartaoSelect: document.getElementById('cartao_id'),
            faturaSelect: document.getElementById('fatura_id'),
            numeroParcelas: document.getElementById('numero_parcelas'),
            transacoesTable: document.querySelector('#transacoesTable tbody'),
            modal: document.getElementById('participantesModal')
        };
    }

    inicializarMetodosPagamento(metodos) {
        if (!this.elements.metodoPagamento) {
            console.error('Elemento metodo_pagamento não encontrado');
            return;
        }

        this.elements.metodoPagamento.innerHTML = '<option value="">Selecione o método</option>';
        Object.entries(metodos).forEach(([key, value]) => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = value;
            this.elements.metodoPagamento.appendChild(option);
        });
    }

    setDataAtual() {
        if (this.elements.dataEfetiva) {
            const hoje = new Date();
            this.elements.dataEfetiva.value = hoje.toISOString().split('T')[0];
        }
    }

    updateCategorias(categorias) {
        if (!this.elements.categoriaSelect) {
            console.error('Elemento categoria_id não encontrado');
            return;
        }

        this.elements.categoriaSelect.innerHTML = '<option value="">Selecione uma categoria</option>';
        if (Array.isArray(categorias)) {
            categorias.forEach(categoria => {
                const option = document.createElement('option');
                option.value = categoria.id;
                option.textContent = categoria.nome;
                this.elements.categoriaSelect.appendChild(option);
            });
        }
    }

    updateCartoes(cartoes) {
        if (!this.elements.cartaoSelect) return;

        this.elements.cartaoSelect.innerHTML = '<option value="">Selecione um cartão</option>';
        cartoes.forEach(cartao => {
            const option = document.createElement('option');
            option.value = cartao.id;
            option.textContent = cartao.nome;
            this.elements.cartaoSelect.appendChild(option);
        });
    }

    updateFaturas(faturas) {
        if (!this.elements.faturaSelect) return;

        this.elements.faturaSelect.innerHTML = '<option value="">Selecione a fatura</option>';
        faturas.forEach(fatura => {
            const option = document.createElement('option');
            option.value = fatura.id;
            option.textContent = `${fatura.mes_referencia} (Venc: ${this.formatarData(fatura.data_vencimento)})`;
            this.elements.faturaSelect.appendChild(option);
        });
    }

    updateTransacoesTable(transacoes) {
        if (!this.elements.transacoesTable) {
            console.error('Tabela de transações não encontrada');
            return;
        }

        this.elements.transacoesTable.innerHTML = '';

        if (!Array.isArray(transacoes) || transacoes.length === 0) {
            this.elements.transacoesTable.innerHTML = '<tr><td colspan="8">Nenhuma transação cadastrada</td></tr>';
            return;
        }

        transacoes.forEach(transacao => {
            const tr = document.createElement('tr');
            tr.setAttribute('data-transacao-id', transacao.id);
            tr.style.cursor = 'pointer';
            tr.onclick = () => window.APP.controllers.transacoes.mostrarModalParticipantes(transacao);
            
            tr.innerHTML = `
                <td>${this.formatarData(transacao.data_efetiva)}</td>
                <td>${transacao.conta || '-'}</td>
                <td>${transacao.categoria_nome}</td>
                <td>${transacao.tipo}</td>
                <td>${this.formatarMoeda(transacao.valor)}</td>
                <td>${transacao.metodo_pagamento}</td>
                <td>${transacao.cartao_nome || '-'}</td>
                <td>${transacao.descricao || '-'}</td>
            `;
            this.elements.transacoesTable.appendChild(tr);
        });
    }

    showTransacaoModal(detalhes) {
        if (!this.elements.modal || !detalhes) return;

        this.elements.modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Detalhes dos Participantes</h2>
                    <span class="close">&times;</span>
                </div>
                <div class="modal-body">
                    <div class="transacao-info">
                        <p><strong>Data:</strong> ${this.formatarData(detalhes.data_efetiva)}</p>
                        <p><strong>Valor Total:</strong> ${this.formatarMoeda(detalhes.valor)}</p>
                    </div>
                    <div class="participantes-lista">
                        ${detalhes.participantes.map(p => `
                            <div class="participante-item">
                                <div class="participante-nome">${p.nome}</div>
                                <div class="participante-valor">${this.formatarMoeda(p.valor_devido)}</div>
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

        this.elements.modal.style.display = 'block';
        this.setupModalEventListeners();
    }

    setupModalEventListeners() {
        const closeBtn = this.elements.modal.querySelector('.close');
        if (closeBtn) {
            closeBtn.onclick = () => this.elements.modal.style.display = 'none';
        }

        window.onclick = (event) => {
            if (event.target === this.elements.modal) {
                this.elements.modal.style.display = 'none';
            }
        };
    }

    showCamposCartao() {
        if (this.elements.camposCartao) {
            this.elements.camposCartao.style.display = 'block';
        }
    }

    hideCamposCartao() {
        if (this.elements.camposCartao) {
            this.elements.camposCartao.style.display = 'none';
            if (this.elements.cartaoSelect) this.elements.cartaoSelect.value = '';
            if (this.elements.faturaSelect) this.elements.faturaSelect.value = '';
            if (this.elements.numeroParcelas) this.elements.numeroParcelas.value = '1';
        }
    }

    getFormData() {
        return {
            tipo: this.elements.tipo?.value,
            categoria_id: this.elements.categoriaSelect?.value,
            valor: this.elements.valor?.value,
            data_efetiva: this.elements.dataEfetiva?.value,
            metodo_pagamento: this.elements.metodoPagamento?.value,
            descricao: this.elements.descricao?.value,
            cartao_id: this.elements.cartaoSelect?.value,
            fatura_id: this.elements.faturaSelect?.value,
            numero_parcelas: parseInt(this.elements.numeroParcelas?.value) || 1,
            participantes: window.APP.controllers.participantes.coletarDadosParticipantes()
        };
    }

    formatarData(dataString) {
        if (!dataString) return '-';
        return new Date(dataString).toLocaleDateString('pt-BR');
    }

    formatarMoeda(valor) {
        if (!valor) return 'R$ 0,00';
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(valor);
    }
}

export default TransacoesUIManager;