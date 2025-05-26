
/**
 * Validacijos rezultato klasė
 * @class ValidationResult
 * @property {boolean} isValid - Ar validacija pavyko be klaidų
 * @property {string[]} errors - Klaidų pranešimų sąrašas
 * @property {string[]} warnings - Įspėjimų pranešimų sąrašas
 */
class ValidationResult {
    constructor(isValid, errors = [], warnings = []) {
        this.isValid = isValid;
        this.errors = errors;
        this.warnings = warnings;
    }

    /**
     * Tikrina, ar yra validacijos klaidų
     * @returns {boolean} `true` jei yra klaidų, `false` priešingu atveju
     */
    hasErrors() {
        return this.errors.length > 0;
    }

    /**
     * Grąžina pirmą rastą klaidą
     * @returns {string|null} Pirmas klaidų pranešimas arba `null` jei klaidų nėra
     */
    getFirstError() {
        return this.errors.length > 0 ? this.errors[0] : null;
    }

    /**
     * Grąžina visus pranešimus (klaidas ir įspėjimus)
     * @returns {string[]} Visų pranešimų sąrašas
     */
    getAllMessages() {
        return [...this.errors, ...this.warnings];
    }
}

export { ValidationResult };