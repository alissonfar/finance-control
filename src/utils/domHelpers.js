// src/utils/domHelpers.js

export const domHelpers = {
    createElement: (tag, attributes = {}, children = []) => {
        const element = document.createElement(tag);
        
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'className') {
                element.className = value;
            } else if (key === 'style' && typeof value === 'object') {
                Object.assign(element.style, value);
            } else if (key.startsWith('on') && typeof value === 'function') {
                const eventName = key.toLowerCase().substring(2);
                element.addEventListener(eventName, value);
            } else {
                element.setAttribute(key, value);
            }
        });
        
        if (typeof children === 'string') {
            element.textContent = children;
        } else {
            children.forEach(child => {
                if (typeof child === 'string') {
                    element.appendChild(document.createTextNode(child));
                } else if (child instanceof Node) {
                    element.appendChild(child);
                }
            });
        }
        
        return element;
    },
    
    removeElement: (element) => {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }
        if (element && element.parentNode) {
            element.parentNode.removeChild(element);
        }
    },
    
    empty: (element) => {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }
        while (element && element.firstChild) {
            element.removeChild(element.firstChild);
        }
    },
    
    show: (element) => {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }
        if (element) {
            element.style.display = '';
        }
    },
    
    hide: (element) => {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }
        if (element) {
            element.style.display = 'none';
        }
    },
    
    toggle: (element) => {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }
        if (element) {
            if (element.style.display === 'none') {
                element.style.display = '';
            } else {
                element.style.display = 'none';
            }
        }
    },
    
    addClass: (element, className) => {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }
        if (element) {
            element.classList.add(className);
        }
    },
    
    removeClass: (element, className) => {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }
        if (element) {
            element.classList.remove(className);
        }
    },
    
    toggleClass: (element, className) => {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }
        if (element) {
            element.classList.toggle(className);
        }
    },
    
    hasClass: (element, className) => {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }
        return element ? element.classList.contains(className) : false;
    },
    
    closest: (element, selector) => {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }
        return element ? element.closest(selector) : null;
    },
    
    matches: (element, selector) => {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }
        return element ? element.matches(selector) : false;
    },
    
    find: (element, selector) => {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }
        return element ? element.querySelectorAll(selector) : [];
    },
    
    findOne: (element, selector) => {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }
        return element ? element.querySelector(selector) : null;
    },
    
    getParent: (element) => {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }
        return element ? element.parentNode : null;
    },
    
    getChildren: (element) => {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }
        return element ? Array.from(element.children) : [];
    },
    
    getSiblings: (element) => {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }
        if (!element || !element.parentNode) return [];
        return Array.from(element.parentNode.children).filter(child => child !== element);
    },
    
    insertAfter: (newElement, referenceElement) => {
        if (typeof referenceElement === 'string') {
            referenceElement = document.querySelector(referenceElement);
        }
        if (referenceElement && referenceElement.parentNode) {
            referenceElement.parentNode.insertBefore(newElement, referenceElement.nextSibling);
        }
    },
    
    insertBefore: (newElement, referenceElement) => {
        if (typeof referenceElement === 'string') {
            referenceElement = document.querySelector(referenceElement);
        }
        if (referenceElement && referenceElement.parentNode) {
            referenceElement.parentNode.insertBefore(newElement, referenceElement);
        }
    },
    
    replaceElement: (oldElement, newElement) => {
        if (typeof oldElement === 'string') {
            oldElement = document.querySelector(oldElement);
        }
        if (oldElement && oldElement.parentNode) {
            oldElement.parentNode.replaceChild(newElement, oldElement);
        }
    },
    
    createFragment: (html) => {
        const template = document.createElement('template');
        template.innerHTML = html.trim();
        return template.content;
    },
    
    setAttributes: (element, attributes = {}) => {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }
        if (element) {
            Object.entries(attributes).forEach(([key, value]) => {
                element.setAttribute(key, value);
            });
        }
    },
    
    removeAttributes: (element, attributes = []) => {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }
        if (element) {
            attributes.forEach(attr => {
                element.removeAttribute(attr);
            });
        }
    },
    
    getData: (element, key) => {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }
        return element ? element.dataset[key] : null;
    },
    
    setData: (element, key, value) => {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }
        if (element) {
            element.dataset[key] = value;
        }
    },
    
    removeData: (element, key) => {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }
        if (element) {
            delete element.dataset[key];
        }
    },
    
    getPosition: (element) => {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }
        if (!element) return { top: 0, left: 0 };
        
        const rect = element.getBoundingClientRect();
        return {
            top: rect.top + window.scrollY,
            left: rect.left + window.scrollX
        };
    },
    
    getSize: (element) => {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }
        if (!element) return { width: 0, height: 0 };
        
        const computedStyle = window.getComputedStyle(element);
        return {
            width: element.offsetWidth,
            height: element.offsetHeight,
            innerWidth: element.clientWidth,
            innerHeight: element.clientHeight,
            marginLeft: parseInt(computedStyle.marginLeft),
            marginRight: parseInt(computedStyle.marginRight),
            marginTop: parseInt(computedStyle.marginTop),
            marginBottom: parseInt(computedStyle.marginBottom)
        };
    },
    
    isVisible: (element) => {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }
        if (!element) return false;
        
        const style = window.getComputedStyle(element);
        return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
    }
};

export default domHelpers;