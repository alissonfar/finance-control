// src/utils/validators.js

export const validators = {
    required: (value) => {
        if (value === null || value === undefined) return false;
        if (typeof value === 'string') return value.trim().length > 0;
        if (Array.isArray(value)) return value.length > 0;
        return true;
    },
    
    minLength: (value, min) => {
        if (!value) return false;
        return String(value).length >= min;
    },
    
    maxLength: (value, max) => {
        if (!value) return true;
        return String(value).length <= max;
    },
    
    email: (value) => {
        if (!value) return true;
        const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return regex.test(value);
    },
    
    number: (value) => {
        if (!value) return true;
        return !isNaN(parseFloat(value)) && isFinite(value);
    },
    
    integer: (value) => {
        if (!value) return true;
        return Number.isInteger(Number(value));
    },
    
    positive: (value) => {
        if (!value) return true;
        return Number(value) > 0;
    },
    
    negative: (value) => {
        if (!value) return true;
        return Number(value) < 0;
    },
    
    min: (value, min) => {
        if (!value) return true;
        return Number(value) >= min;
    },
    
    max: (value, max) => {
        if (!value) return true;
        return Number(value) <= max;
    },
    
    between: (value, min, max) => {
        if (!value) return true;
        const num = Number(value);
        return num >= min && num <= max;
    },
    
    cpf: (value) => {
        if (!value) return true;
        
        const cleaned = value.replace(/\D/g, '');
        if (cleaned.length !== 11) return false;
        
        if (/^(\d)\1{10}$/.test(cleaned)) return false;
        
        let sum = 0;
        for (let i = 0; i < 9; i++) {
            sum += parseInt(cleaned.charAt(i)) * (10 - i);
        }
        let rest = sum % 11;
        const digit1 = rest < 2 ? 0 : 11 - rest;
        
        sum = 0;
        for (let i = 0; i < 10; i++) {
            sum += parseInt(cleaned.charAt(i)) * (11 - i);
        }
        rest = sum % 11;
        const digit2 = rest < 2 ? 0 : 11 - rest;
        
        return cleaned.slice(-2) === `${digit1}${digit2}`;
    },
    
    cnpj: (value) => {
        if (!value) return true;
        
        const cleaned = value.replace(/\D/g, '');
        if (cleaned.length !== 14) return false;
        
        if (/^(\d)\1{13}$/.test(cleaned)) return false;
        
        let length = cleaned.length - 2;
        let numbers = cleaned.substring(0, length);
        const digits = cleaned.substring(length);
        let sum = 0;
        let pos = length - 7;
        
        for (let i = length; i >= 1; i--) {
            sum += numbers.charAt(length - i) * pos--;
            if (pos < 2) pos = 9;
        }
        
        let result = sum % 11 < 2 ? 0 : 11 - sum % 11;
        if (result !== parseInt(digits.charAt(0))) return false;
        
        length = length + 1;
        numbers = cleaned.substring(0, length);
        sum = 0;
        pos = length - 7;
        
        for (let i = length; i >= 1; i--) {
            sum += numbers.charAt(length - i) * pos--;
            if (pos < 2) pos = 9;
        }
        
        result = sum % 11 < 2 ? 0 : 11 - sum % 11;
        
        return result === parseInt(digits.charAt(1));
    },
    
    date: (value) => {
        if (!value) return true;
        const date = new Date(value);
        return date instanceof Date && !isNaN(date);
    },
    
    futureDate: (value) => {
        if (!value) return true;
        const date = new Date(value);
        const now = new Date();
        return date > now;
    },
    
    pastDate: (value) => {
        if (!value) return true;
        const date = new Date(value);
        const now = new Date();
        return date < now;
    },
    
    url: (value) => {
        if (!value) return true;
        try {
            new URL(value);
            return true;
        } catch {
            return false;
        }
    },
    
    creditCard: (value) => {
        if (!value) return true;
        
        const cleaned = value.replace(/\D/g, '');
        if (cleaned.length < 13 || cleaned.length > 19) return false;
        
        let sum = 0;
        let isEven = false;
        
        for (let i = cleaned.length - 1; i >= 0; i--) {
            let digit = parseInt(cleaned.charAt(i));
            
            if (isEven) {
                digit *= 2;
                if (digit > 9) {
                    digit -= 9;
                }
            }
            
            sum += digit;
            isEven = !isEven;
        }
        
        return sum % 10 === 0;
    },
    
    phone: (value) => {
        if (!value) return true;
        const cleaned = value.replace(/\D/g, '');
        return cleaned.length >= 10 && cleaned.length <= 11;
    },
    
    cep: (value) => {
        if (!value) return true;
        const cleaned = value.replace(/\D/g, '');
        return cleaned.length === 8;
    },
    
    matchesPattern: (value, pattern) => {
        if (!value) return true;
        const regex = new RegExp(pattern);
        return regex.test(value);
    },
    
    equalTo: (value, comparison) => {
        return value === comparison;
    }
};

export default validators;