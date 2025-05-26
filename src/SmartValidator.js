import { ValidationRule } from './ValidationRule.js';
import { ValidatorConfig } from './ValidatorConfig.js';
import { ValidationResult } from './ValidationResult.js';

/**
 * Smart Input Validator - pažangus formos laukų validatorius
 * @class SmartValidator
 * @param {HTMLElement} element - HTML elementas, kuriam taikoma validacija
 * @param {Object} config - Validatoriaus konfigūracija
 * @param {string} [config.theme='default'] - Vizualios temos pavadinimas ('default', 'minimal', 'material')
 * @param {string} [config.locale='en'] - Kalbos kodas pranešimams ('lt', 'en')
 * @param {boolean} [config.realTime=true] - Ar įjungti realaus laiko validaciją
 * @param {boolean} [config.accessibility=true] - Ar įjungti pritaikymo neįgaliesiems funkcijas
 * @param {Object} [config.messages] - Pasirinktiniai lokalizuoti pranešimai, kurie perrašo numatytuosius
 */
class SmartValidator {
    constructor(element, config = {}) {
        if (!(element instanceof HTMLElement)) {
            throw new Error('SmartValidator: Provided element is not a valid HTML element.');
        }

        this.element = element;
        this.config = new ValidatorConfig(config);
        this.rules = [];
        this.state = {
            isValid: true,
            errors: [],
            warnings: []
        };
        this.errorContainer = this.element.nextElementSibling &&
                              this.element.nextElementSibling.matches(`[data-field="${this.element.id}"]`)
            ? this.element.nextElementSibling
            : null;

        this.boundValidateOnEvent = this.validate.bind(this);
        this.initialize();
    }

    initialize() {
        this.config.applyTheme(this.element);

        if (this.config.realTime) {
            this.element.addEventListener('input', this.boundValidateOnEvent);
            this.element.addEventListener('change', this.boundValidateOnEvent);
            this.element.addEventListener('blur', this.boundValidateOnEvent);
        }
        this.updateAccessibilityAttributes();
    }

    /**
     * Prideda naują validacijos taisyklę
     * @param {Object} rule - Taisyklės objektas
     * @param {string} rule.name - Taisyklės pavadinimas (pvz., 'required', 'email')
     * @param {Function} rule.validator - Validacijos funkcija, kuri priima lauko reikšmę ir grąžina `true` (validu) arba `false` (nevalidu).
     * @param {string} rule.message - Klaidų pranešimo šablonas. Gali būti paprastas tekstas arba raktažodis lokalizacijai.
     * @param {string} [rule.trigger='input'] - Įvykis, kuris aktyvuoja validaciją ('input', 'blur', 'change').
     */
    addRule(rule) {
        if (!rule || typeof rule.name !== 'string' || typeof rule.validator !== 'function' || typeof rule.message !== 'string') {
            console.warn('SmartValidator: Invalid rule format. Rule must have name, validator, and message properties.', rule);
            return;
        }
        this.rules.push(new ValidationRule(rule.name, rule.validator, rule.message, rule.trigger));
    }

    /**
     * Atlieka elemento validaciją pagal visas taisykles
     * @returns {ValidationResult} Validacijos rezultatas
     */
    validate() {
        const value = this.element.value;
        const currentErrors = [];

        for (const rule of this.rules) {
            if (!rule.validate(value)) {
                currentErrors.push(this.config.getLocaleMessage(rule.message));
            }
        }

        this.state.isValid = currentErrors.length === 0;
        this.state.errors = currentErrors;

        this.updateVisualFeedback(); 
        this.updateAccessibilityAttributes();

        return new ValidationResult(this.state.isValid, this.state.errors, this.state.warnings);
    }

    /**
     * Atkuria elemento būseną į pradinę (pašalina klaidų pranešimus ir stilius)
     */
    reset() {
        this.element.value = '';
        this.state.isValid = true;
        this.state.errors = [];
        this.state.warnings = [];
        this.updateVisualFeedback(); 
        this.updateAccessibilityAttributes();
    }

    /**
     * Sunaikina validatorių ir atlaisvina resursus (pašalina įvykių klausytojus, DOM pakeitimus)
     */
    destroy() {
        if (this.config.realTime) {
            this.element.removeEventListener('input', this.boundValidateOnEvent);
            this.element.removeEventListener('change', this.boundValidateOnEvent);
            this.element.removeEventListener('blur', this.boundValidateOnEvent);
        }
        this.element.classList.remove('is-valid', 'is-invalid', `smart-validator-theme-${this.config.theme}`);
        if (this.errorContainer) {
            this.errorContainer.textContent = '';
            this.errorContainer.removeAttribute('id');
        }
        this.element.removeAttribute('aria-describedby');
        this.element.removeAttribute('aria-invalid');
    }

    /**
     * Atnaujina elemento vizualinį grįžtamąjį ryšį (CSS klases ir klaidų pranešimus)
     * @private
     */
    updateVisualFeedback() {
        if (this.state.isValid) {
            this.element.classList.remove('is-invalid');
            this.element.classList.add('is-valid');
            if (this.errorContainer) {
                this.errorContainer.textContent = '';
            }
        } else {
            this.element.classList.remove('is-valid');
            this.element.classList.add('is-invalid');
            if (this.errorContainer && this.state.errors.length > 0) {
                this.errorContainer.textContent = this.state.errors[0];
            }
        }
    }

    /**
     * Atnaujina pritaikymo atributus
     * @private
     */
    updateAccessibilityAttributes() {
        if (this.config.accessibility) {
            if (this.state.errors.length > 0) {
                this.element.setAttribute('aria-invalid', 'true');
                if (this.errorContainer) {
                    const errorId = `${this.element.id}-error`;
                    this.errorContainer.id = errorId;
                    this.element.setAttribute('aria-describedby', errorId);
                }
            } else {
                this.element.removeAttribute('aria-invalid');
                if (this.errorContainer) {
                    this.element.removeAttribute('aria-describedby'); 
                }
            }
        } else {
            this.element.removeAttribute('aria-invalid');
            this.element.removeAttribute('aria-describedby');
            if (this.errorContainer) {
                this.errorContainer.removeAttribute('id'); 
            }
        }
    }
}

export { SmartValidator };