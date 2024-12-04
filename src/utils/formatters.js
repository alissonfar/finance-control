// src/utils/formatters.js

export const formatters = {
    currency: (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    },
    
    date: (value) => {
        if (!value) return '';
        return new Date(value).toLocaleDateString('pt-BR');
    },
    
    dateTime: (value) => {
        if (!value) return '';
        return new Date(value).toLocaleString('pt-BR');
    },
    
    percentage: (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'percent',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value / 100);
    },
    
    decimal: (value, decimals = 2) => {
        return new Intl.NumberFormat('pt-BR', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(value);
    },
    
    cpf: (value) => {
        if (!value) return '';
        const cleaned = value.replace(/\D/g, '');
        return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    },
    
    cnpj: (value) => {
        if (!value) return '';
        const cleaned = value.replace(/\D/g, '');
        return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    },
    
    phone: (value) => {
        if (!value) return '';
        const cleaned = value.replace(/\D/g, '');
        if (cleaned.length === 11) {
            return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        }
        return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    },
    
    cep: (value) => {
        if (!value) return '';
        const cleaned = value.replace(/\D/g, '');
        return cleaned.replace(/(\d{5})(\d{3})/, '$1-$2');
    },
    
    shortText: (text, maxLength = 50) => {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    },
    
    capitalize: (text) => {
        if (!text) return '';
        return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
    },
    
    title: (text) => {
        if (!text) return '';
        return text.toLowerCase().split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    },
    
    number: (value) => {
        if (typeof value !== 'number') return '';
        return value.toLocaleString('pt-BR');
    },
    
    bytes: (bytes) => {
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        if (bytes === 0) return '0 Byte';
        const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
        return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
    },
    
    duration: (minutes) => {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours}h${remainingMinutes > 0 ? ` ${remainingMinutes}min` : ''}`;
    },
    
    list: (array, separator = ', ', finalSeparator = ' e ') => {
        if (!Array.isArray(array)) return '';
        if (array.length === 0) return '';
        if (array.length === 1) return array[0];
        
        const lastItem = array[array.length - 1];
        const otherItems = array.slice(0, -1);
        
        return otherItems.join(separator) + finalSeparator + lastItem;
    }
};

export default formatters;