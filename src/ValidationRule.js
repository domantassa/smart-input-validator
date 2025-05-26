
/**
 * Validacijos taisyklės klasė
 * @class ValidationRule
 * @param {string} name - Taisyklės pavadinimas (pvz., 'required', 'email')
 * @param {Function} validator - Validacijos funkcija, kuri priima lauko reikšmę ir grąžina `true` (validu) arba `false` (nevalidu).
 * @param {string} message - Klaidų pranešimo šablonas. Gali būti paprastas tekstas arba raktažodis lokalizacijai.
 * @param {string} [trigger='input'] - Įvykis, kuris aktyvuoja validaciją ('input', 'blur', 'change').
 */
class ValidationRule {
    constructor(name, validator, message, trigger = 'input') {
        this.name = name;
        this.validator = validator;
        this.message = message;
        this.trigger = trigger;
    }

    /**
     * Patikrina, ar reikšmė atitinka taisyklę
     * @param {*} value - Laukė reikšmė (gali būti string, number, etc.)
     * @returns {boolean} `true` jei validu, `false` priešingu atveju
     */
    validate(value) {
        return this.validator(value);
    }

    /**
     * Grąžina klaidų pranešimą šiai taisyklei
     * @returns {string} Klaidų pranešimas
     */
    getMessage() {
        return this.message;
    }
}

export { ValidationRule };