// src/core/managers/ValidationManager.js

class ValidationManager {
    static instance = null;

    constructor() {
        if (ValidationManager.instance) {
            return ValidationManager.instance;
        }
        this.rules = new Map();
        ValidationManager.instance = this;
    }

    static getInstance() {
        if (!ValidationManager.instance) {
            ValidationManager.instance = new ValidationManager();
        }
        return ValidationManager.instance;
    }

    addRule(name, validator, message) {
        this.rules.set(name, { validator, message });
    }

    removeRule(name) {
        this.rules.delete(name);
    }

    validate(name, value, customMessage = '') {
        const rule = this.rules.get(name);
        if (!rule) {
            throw new Error(`Validation rule '${name}' not found`);
        }

        const isValid = rule.validator(value);
        if (!isValid) {
            throw new Error(customMessage || rule.message);
        }

        return true;
    }

    validateAll(validations) {
        const errors = [];

        for (const [value, rules] of Object.entries(validations)) {
            for (const rule of rules) {
                try {
                    this.validate(rule, value);
                } catch (error) {
                    errors.push(error.message);
                }
            }
        }

        if (errors.length > 0) {
            throw new Error(errors.join('\n'));
        }

        return true;
    }
}

// Adiciona regras padrão
const validationManager = ValidationManager.getInstance();

validationManager.addRule('required', 
    value => value !== undefined && value !== null && value !== '',
    'Campo obrigatório'
);

validationManager.addRule('number',
    value => !isNaN(parseFloat(value)) && isFinite(value),
    'Deve ser um número válido'
);

validationManager.addRule('positive',
    value => parseFloat(value) > 0,
    'Deve ser um número positivo'
);

validationManager.addRule('date',
    value => !isNaN(Date.parse(value)),
    'Data inválida'
);

validationManager.addRule('email',
    value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    'E-mail inválido'
);

validationManager.addRule('minLength',
    (value, min) => String(value).length >= min,
    'Comprimento mínimo não atingido'
);

validationManager.addRule('maxLength',
    (value, max) => String(value).length <= max,
    'Comprimento máximo excedido'
);

export default ValidationManager;