const DEFAULT_LOCALES = {
    en: {
        'required': 'This field is required',
        'email': 'Please enter a valid email address',
        'minlength': 'Please enter more characters',
        'maxlength': 'Please enter less characters',
        'number': 'Please enter a valid number',
        'url': 'Please enter a valid URL',
        'minAge': 'Age is too small',
        'uppercase': 'Must contain at least one uppercase letter',
        'domain': 'Email must be in @company.com domain'
    },
    lt: {
        'required': 'Šis laukas yra privalomas',
        'email': 'Įveskite teisingą el. pašto adresą',
        'minlength': 'Per mažai simbolių',
        'maxlength': 'Per daug simbolių',
        'number': 'Įveskite teisingą skaičių',
        'url': 'Įveskite teisingą URL adresą',
        'minAge': 'Per mažas amžius',
        'uppercase': 'Turi būti bent viena didžioji raidė',
        'domain': 'El. paštas turi būti @company.com domene'
    }
};

/**
 * Validatoriaus konfigūracijos klasė
 * @class ValidatorConfig
 * @property {string} theme - Aktyvios temos pavadinimas
 * @property {string} locale - Aktyvi kalba
 * @property {boolean} realTime - Realaus laiko validacijos būsena
 * @property {boolean} accessibility - ARIA palaikymo būsena
 * @property {Object} messages - Visų pranešimų objektas, įskaitant numatytuosius ir vartotojo pateiktus
 */
class ValidatorConfig {
    constructor(config) {
        this.theme = config.theme || 'default';
        this.locale = config.locale || 'en';
        this.realTime = typeof config.realTime === 'boolean' ? config.realTime : true;
        this.accessibility = typeof config.accessibility === 'boolean' ? config.accessibility : true;

        this.messages = {
            ...(DEFAULT_LOCALES[this.locale] || DEFAULT_LOCALES['en']),
            ...(config.messages || {})
        };
    }

    /**
     * Grąžina lokalizuotą pranešimą pagal raktą.
     * Jei pranešimas nėra lokalizuotas, grąžina originalų pranešimo tekstą.
     * Gali apdoroti šablonus su "{key}" pakeitimais.
     * @param {string} key - Pranešimo raktas (pvz., 'required', 'email') arba tiesioginis pranešimas
     * @param {Object} [placeholders={}] - Objektas su šablono pakeitimais (pvz., { min: 6 })
     * @returns {string} Lokalizuotas arba originalus pranešimas su pakeistais šablonais
     */
    getLocaleMessage(key, placeholders = {}) {
        let message = this.messages[key] || key;

        for (const placeholderKey in placeholders) {
            if (Object.prototype.hasOwnProperty.call(placeholders, placeholderKey)) {
                message = message.replace(new RegExp(`{${placeholderKey}}`, 'g'), placeholders[placeholderKey]);
            }
        }
        return message;
    }

    /**
     * Pritaiko vizualų temą duotam elementui.
     * Pašalina visas ankstesnes temas ir prideda naują.
     * @param {HTMLElement} element - HTML elementas, kuriam taikoma tema.
     */
    applyTheme(element) {
        element.classList.forEach(cls => {
            if (cls.startsWith('smart-validator-theme-')) {
                element.classList.remove(cls);
            }
        });
        element.classList.add(`smart-validator-theme-${this.theme}`);
    }
}

export { ValidatorConfig };