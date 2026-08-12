export declare function isValidEmail(email: string): boolean;
/** Normaliza CPF para 11 dígitos (identificador da conta). */
export declare function normalizeCpf(cpf: string): string;
/** Valida CPF brasileiro (dígitos verificadores + rejeita sequências). */
export declare function isValidCpf(cpf: string): boolean;
export declare function validateCpf(cpf: string): string | null;
export declare function normalizeCnpj(cnpj: string): string;
export declare function isValidCnpj(cnpj: string): boolean;
export declare function validateCnpj(cnpj: string): string | null;
export declare function validateDocument(country: string, userType: string, documentNumber: string): string | null;
export declare function validatePassword(password: string): string | null;
//# sourceMappingURL=AuthValidation.d.ts.map