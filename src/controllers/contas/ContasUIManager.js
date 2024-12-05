// src/controllers/contas/ContasUIManager.js
export default class ContasUIManager {
    constructor(controller) {
        this.controller = controller;
        this.initializeElements();
    }

    initializeElements() {
        this.elements = {
            form: document.getElementById('contaForm'),
            nome: document.getElementById('nome'),
            saldoInicial: document.getElementById('saldo_inicial'),
            descricao: document.getElementById('descricao'),
            tbody: document.querySelector('#contasTable tbody')
        };
    }

    getFormData() {
        return {
            nome: this.elements.nome.value,
            saldo_inicial: parseFloat(this.elements.saldoInicial.value),
            descricao: this.elements.descricao.value
        };
    }

    resetForm() {
        this.elements.form.reset();
    }

    showSuccessMessage(message) {
        // Pode ser melhorado para usar um sistema de notificação mais moderno
        alert(message);
    }

    showErrorMessage(message) {
        // Pode ser melhorado para usar um sistema de notificação mais moderno
        alert(message);
    }

    renderContas(contas) {
        // Reinicializa elementos para garantir referências atualizadas após carregamento dinâmico
        this.initializeElements();

        if (!this.elements.tbody) {
            console.error('Elemento tbody não encontrado');
            return;
        }

        this.elements.tbody.innerHTML = '';

        if (contas.length === 0) {
            const tr = document.createElement('tr');
            tr.innerHTML = '<td colspan="5">Nenhuma conta cadastrada</td>';
            this.elements.tbody.appendChild(tr);
            return;
        }

        contas.forEach(conta => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${conta.nome}</td>
                <td>${window.APP.utils.formatarMoeda(conta.saldo_atual)}</td>
                <td>${window.APP.utils.formatarMoeda(conta.saldo_inicial)}</td>
                <td>${conta.descricao || '-'}</td>
                <td>${window.APP.utils.formatarData(conta.data_criacao)}</td>
            `;
            this.elements.tbody.appendChild(tr);
        });
    }
}