

class ValidationRule {
    constructor(name, validator, message, trigger = 'input') {
        this.name = name;
        this.validator = validator;
        this.message = message;
        this.trigger = trigger;
    }

    validate(value) {
        return this.validator(value);
    }

    getMessage() {
        return this.message;
    }
}

class ValidatorConfig {
    constructor(options = {}) {
        this.theme = options.theme || 'default';
        this.locale = options.locale || 'en';
        this.realTime = options.realTime !== false;
        this.accessibility = options.accessibility !== false;
        this.messages = {
            en: {
                required: 'This field is required',
                email: 'Please enter a valid email address',
                minLength: 'Minimum length is 5 characters'
            },
            lt: {
                required: 'Šis laukas yra privalomas',
                email: 'Įveskite teisingą el. pašto adresą',
                minLength: 'Minimalus ilgis yra 5 simboliai'
            }
        };
    }

    getLocaleMessage(key, params = {}) {
        let message = this.messages[this.locale][key] || this.messages.en[key] || key;
        Object.keys(params).forEach(param => {
            message = message.replace(`{${param}}`, params[param]);
        });
        return message;
    }

    applyTheme() {
        return `theme-${this.theme}`;
    }
}

class ValidationResult {
    constructor() {
        this.isValid = true;
        this.errors = [];
        this.warnings = [];
    }

    addError(message) {
        this.errors.push(message);
        this.isValid = false;
    }

    addWarning(message) {
        this.warnings.push(message);
    }

    hasErrors() {
        return this.errors.length > 0;
    }

    getFirstError() {
        return this.errors.length > 0 ? this.errors[0] : null;
    }

    getAllMessages() {
        return [...this.errors, ...this.warnings];
    }
}

class SmartValidator {
    constructor(element, config = {}) {
        if (!element || !element.nodeType) {
            throw new Error('Valid HTML element is required');
        }
        
        this.element = element;
        this.config = new ValidatorConfig(config);
        this.rules = [];
        this.state = 'idle';
        this.isDestroyed = false;
        
        this._setupEventListeners();
        this._applyInitialStyling();
    }

    addRule(ruleConfig) {
        if (!ruleConfig || typeof ruleConfig !== 'object') {
            throw new Error('Rule configuration object is required');
        }
        
        if (!ruleConfig.name || !ruleConfig.validator) {
            throw new Error('Rule must have name and validator function');
        }

        const rule = new ValidationRule(
            ruleConfig.name,
            ruleConfig.validator,
            ruleConfig.message || `Validation failed for ${ruleConfig.name}`,
            ruleConfig.trigger || 'input'
        );
        
        this.rules.push(rule);
        return this;
    }

    validate() {
        if (this.isDestroyed) {
            throw new Error('Validator has been destroyed');
        }

        const result = new ValidationResult();
        const value = this.element.value || '';

        this.rules.forEach(rule => {
            if (!rule.validate(value)) {
                result.addError(rule.getMessage());
            }
        });

        this._updateVisualFeedback(result);
        this._updateAccessibility(result);
        
        this.state = result.isValid ? 'valid' : 'invalid';
        return result;
    }

    reset() {
        if (this.isDestroyed) return;
        
        this.element.value = '';
        this._clearVisualFeedback();
        this._resetAccessibility();
        this.state = 'idle';
    }

    destroy() {
        if (this.isDestroyed) return;
        
        this._removeEventListeners();
        this._clearVisualFeedback();
        this._resetAccessibility();
        this.rules = [];
        this.isDestroyed = true;
        this.state = 'destroyed';
    }

    _setupEventListeners() {
        if (this.config.realTime) {
            this._inputHandler = () => this.validate();
            this._blurHandler = () => this.validate();
            
            this.element.addEventListener('input', this._inputHandler);
            this.element.addEventListener('blur', this._blurHandler);
        }
    }

    _removeEventListeners() {
        if (this._inputHandler) {
            this.element.removeEventListener('input', this._inputHandler);
        }
        if (this._blurHandler) {
            this.element.removeEventListener('blur', this._blurHandler);
        }
    }

    _applyInitialStyling() {
        this.element.classList.add('smart-validator-field');
        this.element.classList.add(this.config.applyTheme());
    }

    _updateVisualFeedback(result) {
        this.element.classList.remove('sv-valid', 'sv-invalid');
        
        if (result.hasErrors()) {
            this.element.classList.add('sv-invalid');
        } else if (this.element.value) {
            this.element.classList.add('sv-valid');
        }

        this._updateErrorDisplay(result);
    }

    _updateErrorDisplay(result) {
        const errorContainer = document.querySelector(`[data-field="${this.element.name}"]`) || 
                             document.querySelector('.error-container');
        
        if (errorContainer) {
            errorContainer.innerHTML = result.hasErrors() ? 
                result.errors.map(error => `<span class="error-message">${error}</span>`).join('') : '';
        }
    }

    _clearVisualFeedback() {
        this.element.classList.remove('sv-valid', 'sv-invalid', 'smart-validator-field');
        this.element.className = this.element.className.replace(/theme-\w+/g, '').trim();
        this._updateErrorDisplay(new ValidationResult());
    }

    _updateAccessibility(result) {
        if (!this.config.accessibility) return;
        
        if (result.hasErrors()) {
            this.element.setAttribute('aria-invalid', 'true');
            this.element.setAttribute('aria-describedby', `${this.element.id}-error`);
        } else {
            this.element.setAttribute('aria-invalid', 'false');
            this.element.removeAttribute('aria-describedby');
        }
    }

    _resetAccessibility() {
        if (this.config.accessibility) {
            this.element.removeAttribute('aria-invalid');
            this.element.removeAttribute('aria-describedby');
        }
    }
}

describe('SmartValidator', () => {
    let mockElement;
    
    beforeEach(() => {
        mockElement = document.createElement('input');
        mockElement.type = 'email';
        mockElement.id = 'test-input';
        mockElement.name = 'email';
        document.body.appendChild(mockElement);
    });
    
    afterEach(() => {
        // but keeping the null check for safety
        if (mockElement && mockElement.parentNode) {
            mockElement.parentNode.removeChild(mockElement);
        }
    });

    describe('Constructor', () => {
        test('should create validator with valid element', () => {
            const validator = new SmartValidator(mockElement);
            expect(validator).toBeInstanceOf(SmartValidator);
            expect(validator.element).toBe(mockElement);
            expect(validator.state).toBe('idle');
        });

        test('should throw error with invalid element', () => {
            expect(() => new SmartValidator(null)).toThrow('Valid HTML element is required');
            expect(() => new SmartValidator({})).toThrow('Valid HTML element is required');
        });

        test('should apply default configuration', () => {
            const validator = new SmartValidator(mockElement);
            expect(validator.config.theme).toBe('default');
            expect(validator.config.locale).toBe('en');
            expect(validator.config.realTime).toBe(true);
            expect(validator.config.accessibility).toBe(true);
        });

        test('should apply custom configuration', () => {
            const config = {
                theme: 'material',
                locale: 'lt',
                realTime: false,
                accessibility: false
            };
            const validator = new SmartValidator(mockElement, config);
            expect(validator.config.theme).toBe('material');
            expect(validator.config.locale).toBe('lt');
            expect(validator.config.realTime).toBe(false);
            expect(validator.config.accessibility).toBe(false);
        });
    });

    describe('addRule method', () => {
        let validator;
        
        beforeEach(() => {
            validator = new SmartValidator(mockElement);
        });

        afterEach(() => {
            if (validator && !validator.isDestroyed) {
                validator.destroy();
            }
        });

        test('should add valid rule', () => {
            const rule = {
                name: 'required',
                validator: (value) => value.length > 0,
                message: 'Field is required'
            };
            
            validator.addRule(rule);
            expect(validator.rules).toHaveLength(1);
            expect(validator.rules[0].name).toBe('required');
        });

        test('should throw error for invalid rule config', () => {
            expect(() => validator.addRule(null)).toThrow('Rule configuration object is required');
            expect(() => validator.addRule({})).toThrow('Rule must have name and validator function');
        });

        test('should chain rule additions', () => {
            const result = validator
                .addRule({ name: 'rule1', validator: () => true })
                .addRule({ name: 'rule2', validator: () => true });
            
            expect(result).toBe(validator);
            expect(validator.rules).toHaveLength(2);
        });
    });

    describe('validate method', () => {
        let validator;
        
        beforeEach(() => {
            validator = new SmartValidator(mockElement, { realTime: false });
        });

        afterEach(() => {
            if (validator && !validator.isDestroyed) {
                validator.destroy();
            }
        });

        test('should return valid result for empty rules', () => {
            const result = validator.validate();
            expect(result).toBeInstanceOf(ValidationResult);
            expect(result.isValid).toBe(true);
            expect(result.hasErrors()).toBe(false);
        });

        test('should validate required field', () => {
            validator.addRule({
                name: 'required',
                validator: (value) => value.trim().length > 0,
                message: 'Field is required'
            });

            mockElement.value = '';
            let result = validator.validate();
            expect(result.isValid).toBe(false);
            expect(result.hasErrors()).toBe(true);
            expect(result.getFirstError()).toBe('Field is required');

            mockElement.value = 'test@example.com';
            result = validator.validate();
            expect(result.isValid).toBe(true);
            expect(result.hasErrors()).toBe(false);
        });

        test('should validate email format', () => {
            validator.addRule({
                name: 'email',
                validator: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
                message: 'Invalid email format'
            });

            mockElement.value = 'invalid-email';
            let result = validator.validate();
            expect(result.isValid).toBe(false);
            expect(result.getFirstError()).toBe('Invalid email format');

            mockElement.value = 'test@example.com';
            result = validator.validate();
            expect(result.isValid).toBe(true);
        });

        test('should validate multiple rules', () => {
            validator
                .addRule({
                    name: 'required',
                    validator: (value) => value.length > 0,
                    message: 'Required'
                })
                .addRule({
                    name: 'minLength',
                    validator: (value) => value.length >= 5,
                    message: 'Min 5 characters'
                });

            mockElement.value = '';
            let result = validator.validate();
            expect(result.errors).toHaveLength(2);

            mockElement.value = 'abc';
            result = validator.validate();
            expect(result.errors).toHaveLength(1);
            expect(result.getFirstError()).toBe('Min 5 characters');

            mockElement.value = 'abcdef';
            result = validator.validate();
            expect(result.isValid).toBe(true);
        });

        test('should throw error when validator is destroyed', () => {
            validator.destroy();
            expect(() => validator.validate()).toThrow('Validator has been destroyed');
        });
    });

    describe('reset method', () => {
        let validator;
        
        beforeEach(() => {
            validator = new SmartValidator(mockElement);
        });

        afterEach(() => {
            if (validator && !validator.isDestroyed) {
                validator.destroy();
            }
        });

        test('should reset element value and state', () => {
            mockElement.value = 'test value';
            validator.state = 'invalid';
            
            validator.reset();
            
            expect(mockElement.value).toBe('');
            expect(validator.state).toBe('idle');
        });

        test('should not throw error when destroyed', () => {
            validator.destroy();
            expect(() => validator.reset()).not.toThrow();
        });
    });

    describe('destroy method', () => {
        let validator;
        
        beforeEach(() => {
            validator = new SmartValidator(mockElement);
        });

        test('should mark validator as destroyed', () => {
            validator.destroy();
            expect(validator.isDestroyed).toBe(true);
            expect(validator.state).toBe('destroyed');
        });

        test('should clear rules', () => {
            validator.addRule({ name: 'test', validator: () => true });
            validator.destroy();
            expect(validator.rules).toHaveLength(0);
        });

        test('should be idempotent', () => {
            validator.destroy();
            validator.destroy(); // Should not throw
            expect(validator.isDestroyed).toBe(true);
        });
    });
});

describe('ValidationRule', () => {
    test('should create rule with all parameters', () => {
        const rule = new ValidationRule(
            'email',
            (value) => value.includes('@'),
            'Invalid email',
            'blur'
        );
        
        expect(rule.name).toBe('email');
        expect(rule.message).toBe('Invalid email');
        expect(rule.trigger).toBe('blur');
    });

    test('should validate values correctly', () => {
        const rule = new ValidationRule(
            'minLength',
            (value) => value.length >= 3,
            'Too short'
        );
        
        expect(rule.validate('ab')).toBe(false);
        expect(rule.validate('abc')).toBe(true);
        expect(rule.validate('abcd')).toBe(true);
    });

    test('should return correct message', () => {
        const rule = new ValidationRule('test', () => true, 'Test message');
        expect(rule.getMessage()).toBe('Test message');
    });
});

describe('ValidatorConfig', () => {
    test('should create with default values', () => {
        const config = new ValidatorConfig();
        expect(config.theme).toBe('default');
        expect(config.locale).toBe('en');
        expect(config.realTime).toBe(true);
        expect(config.accessibility).toBe(true);
    });

    test('should create with custom values', () => {
        const config = new ValidatorConfig({
            theme: 'material',
            locale: 'lt',
            realTime: false,
            accessibility: false
        });
        
        expect(config.theme).toBe('material');
        expect(config.locale).toBe('lt');
        expect(config.realTime).toBe(false);
        expect(config.accessibility).toBe(false);
    });

    test('should get localized messages', () => {
        const config = new ValidatorConfig({ locale: 'lt' });
        expect(config.getLocaleMessage('required')).toBe('Šis laukas yra privalomas');
        
        config.locale = 'en';
        expect(config.getLocaleMessage('required')).toBe('This field is required');
    });

    test('should handle message parameters', () => {
        const config = new ValidatorConfig({ locale: 'en' });
        const message = config.getLocaleMessage('minLength', { min: 5 });
        expect(message).toBe('Minimum length is 5 characters');
    });

    test('should apply theme', () => {
        const config = new ValidatorConfig({ theme: 'material' });
        expect(config.applyTheme()).toBe('theme-material');
    });
});

describe('ValidationResult', () => {
    test('should create valid result by default', () => {
        const result = new ValidationResult();
        expect(result.isValid).toBe(true);
        expect(result.hasErrors()).toBe(false);
        expect(result.errors).toHaveLength(0);
        expect(result.warnings).toHaveLength(0);
    });

    test('should handle errors', () => {
        const result = new ValidationResult();
        result.addError('First error');
        result.addError('Second error');
        
        expect(result.isValid).toBe(false);
        expect(result.hasErrors()).toBe(true);
        expect(result.errors).toHaveLength(2);
        expect(result.getFirstError()).toBe('First error');
    });

    test('should handle warnings', () => {
        const result = new ValidationResult();
        result.addWarning('Warning message');
        
        expect(result.isValid).toBe(true);
        expect(result.hasErrors()).toBe(false);
        expect(result.warnings).toHaveLength(1);
    });

    test('should get all messages', () => {
        const result = new ValidationResult();
        result.addError('Error 1');
        result.addWarning('Warning 1');
        result.addError('Error 2');
        
        const messages = result.getAllMessages();
        expect(messages).toHaveLength(3);
        expect(messages).toContain('Error 1');
        expect(messages).toContain('Warning 1');
        expect(messages).toContain('Error 2');
    });
});

describe('Integration Tests', () => {
    let mockElement, validator;
    
    beforeEach(() => {
        mockElement = document.createElement('input');
        mockElement.type = 'email';
        mockElement.id = 'integration-test';
        mockElement.name = 'email';
        document.body.appendChild(mockElement);
        
        const errorContainer = document.createElement('div');
        errorContainer.setAttribute('data-field', 'email');
        errorContainer.className = 'error-container';
        document.body.appendChild(errorContainer);
    });
    
    afterEach(() => {
        if (validator && !validator.isDestroyed) {
            validator.destroy();
        }
    });

    test('complete email validation workflow', () => {
        validator = new SmartValidator(mockElement, {
            theme: 'material',
            locale: 'en',
            realTime: false,
            accessibility: true
        });

        validator
            .addRule({
                name: 'required',
                validator: (value) => value.trim().length > 0,
                message: 'Email is required'
            })
            .addRule({
                name: 'email',
                validator: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
                message: 'Please enter a valid email address'
            })
            .addRule({
                name: 'domain',
                validator: (value) => value.endsWith('@company.com'),
                message: 'Email must be from company.com domain'
            });

        mockElement.value = '';
        let result = validator.validate();
        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(3);

        mockElement.value = 'invalid-email';
        result = validator.validate();
        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(2);

        mockElement.value = 'user@example.com';
        result = validator.validate();
        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.getFirstError()).toBe('Email must be from company.com domain');

        mockElement.value = 'user@company.com';
        result = validator.validate();
        expect(result.isValid).toBe(true);
        expect(result.hasErrors()).toBe(false);
    });

    test('real-time validation with events', (done) => {
        validator = new SmartValidator(mockElement, {
            realTime: true,
            accessibility: true
        });

        validator.addRule({
            name: 'minLength',
            validator: (value) => value.length >= 3,
            message: 'Minimum 3 characters'
        });

        mockElement.value = 'ab';
        const inputEvent = new Event('input', { bubbles: true });
        mockElement.dispatchEvent(inputEvent);

        setTimeout(() => {
            expect(validator.state).toBe('invalid');
            expect(mockElement.getAttribute('aria-invalid')).toBe('true');
            
            mockElement.value = 'abc';
            mockElement.dispatchEvent(inputEvent);
            
            setTimeout(() => {
                expect(validator.state).toBe('valid');
                expect(mockElement.getAttribute('aria-invalid')).toBe('false');
                done();
            }, 10);
        }, 10);
    });

    test('accessibility features', () => {
        validator = new SmartValidator(mockElement, {
            accessibility: true
        });

        validator.addRule({
            name: 'required',
            validator: (value) => value.length > 0,
            message: 'Required field'
        });

        mockElement.value = '';
        validator.validate();
        expect(mockElement.getAttribute('aria-invalid')).toBe('true');
        expect(mockElement.getAttribute('aria-describedby')).toBe('integration-test-error');

        mockElement.value = 'valid input';
        validator.validate();
        expect(mockElement.getAttribute('aria-invalid')).toBe('false');
        expect(mockElement.hasAttribute('aria-describedby')).toBe(false);
    });
});

describe('Performance Tests', () => {
    test('should handle large number of rules efficiently', () => {
        const mockElement = document.createElement('input');
        document.body.appendChild(mockElement);
        const validator = new SmartValidator(mockElement);
        
        const start = performance.now();
        
        for (let i = 0; i < 100; i++) {
            validator.addRule({
                name: `rule${i}`,
                validator: (value) => value.length > i % 10,
                message: `Rule ${i} failed`
            });
        }
        
        mockElement.value = 'test value';
        validator.validate();
        
        const end = performance.now();
        
        expect(end - start).toBeLessThan(100);
        expect(validator.rules).toHaveLength(100);
        
        validator.destroy();
    });

    test('should handle rapid validation calls', () => {
        const mockElement = document.createElement('input');
        document.body.appendChild(mockElement);
        const validator = new SmartValidator(mockElement);
        
        validator.addRule({
            name: 'test',
            validator: (value) => value.length > 5,
            message: 'Too short'
        });
        
        const start = performance.now();
        
        for (let i = 0; i < 1000; i++) {
            mockElement.value = `test${i}`;
            validator.validate();
        }
        
        const end = performance.now();
        
        expect(end - start).toBeLessThan(500);
        
        validator.destroy();
    });
});

describe('Edge Cases', () => {
    test('should handle null and undefined values', () => {
        const mockElement = document.createElement('input');
        const validator = new SmartValidator(mockElement);
        
        validator.addRule({
            name: 'notNull',
            validator: (value) => value != null && value !== undefined,
            message: 'Value cannot be null'
        });
        
        mockElement.value = '';
        const result = validator.validate();
        
        expect(result).toBeInstanceOf(ValidationResult);
        
        validator.destroy();
    });

    test('should handle special characters in values', () => {
        const mockElement = document.createElement('input');
        const validator = new SmartValidator(mockElement);
        
        validator.addRule({
            name: 'special',
            validator: (value) => !/[<>"]/.test(value),
            message: 'No special HTML characters allowed'
        });
        
        mockElement.value = '<script>alert("xss")</script>';
        const result = validator.validate();
        
        expect(result.hasErrors()).toBe(true);
        expect(result.getFirstError()).toBe('No special HTML characters allowed');
        
        validator.destroy();
    });

    test('should handle very long input values', () => {
        const mockElement = document.createElement('input');
        const validator = new SmartValidator(mockElement);
        
        validator.addRule({
            name: 'maxLength',
            validator: (value) => value.length <= 1000,
            message: 'Too long'
        });
        
        const longString = 'a'.repeat(2000);
        mockElement.value = longString;
        
        const result = validator.validate();
        expect(result.hasErrors()).toBe(true);
        
        validator.destroy();
    });
});