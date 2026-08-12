const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Mín. 8, 1 maiúscula, 1 número e 1 especial entre @ # $ * */
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[@#$*]).{8,}$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
}

/** Normaliza CPF para 11 dígitos (identificador da conta). */
export function normalizeCpf(cpf: string): string {
  return String(cpf || '').replace(/\D/g, '');
}

/** Valida CPF brasileiro (dígitos verificadores + rejeita sequências). */
export function isValidCpf(cpf: string): boolean {
  const digits = normalizeCpf(cpf);
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;

  const calcDigit = (base: string, factor: number): number => {
    let sum = 0;
    for (let i = 0; i < base.length; i += 1) {
      sum += Number(base[i]) * (factor - i);
    }
    const mod = (sum * 10) % 11;
    return mod === 10 ? 0 : mod;
  };

  const d1 = calcDigit(digits.slice(0, 9), 10);
  const d2 = calcDigit(digits.slice(0, 10), 11);
  return d1 === Number(digits[9]) && d2 === Number(digits[10]);
}

export function validateCpf(cpf: string): string | null {
  const digits = normalizeCpf(cpf);
  if (!digits) {
    return 'CPF é obrigatório';
  }
  if (!isValidCpf(digits)) {
    return 'CPF inválido';
  }
  return null;
}

export function normalizeCnpj(cnpj: string): string {
  return String(cnpj || '').replace(/\D/g, '');
}

export function isValidCnpj(cnpj: string): boolean {
  const digits = normalizeCnpj(cnpj);
  if (digits.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(digits)) return false;

  const calcDigit = (base: string, weights: number[]): number => {
    let sum = 0;
    for (let i = 0; i < base.length; i += 1) {
      sum += Number(base[i]) * (weights[i] ?? 0);
    }
    const mod = sum % 11;
    return mod < 2 ? 0 : 11 - mod;
  };

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  const d1 = calcDigit(digits.slice(0, 12), weights1);
  const d2 = calcDigit(digits.slice(0, 13), weights2);
  return d1 === Number(digits[12]) && d2 === Number(digits[13]);
}

export function validateCnpj(cnpj: string): string | null {
  const digits = normalizeCnpj(cnpj);
  if (!digits) {
    return 'CNPJ é obrigatório';
  }
  if (!isValidCnpj(digits)) {
    return 'CNPJ inválido';
  }
  return null;
}

export function validateDocument(
  country: string,
  userType: string,
  documentNumber: string
): string | null {
  const doc = String(documentNumber || '').trim();
  if (country === 'BR') {
    if (userType === 'empresa') {
      return validateCnpj(doc);
    }
    return validateCpf(doc);
  }
  if (!doc || doc.length < 3) {
    return 'Documento é obrigatório e deve ter no mínimo 3 caracteres';
  }
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password || password.length < 8) {
    return 'A senha deve ter no mínimo 8 caracteres';
  }
  if (!/[A-Z]/.test(password)) {
    return 'A senha deve conter ao menos 1 letra maiúscula';
  }
  if (!/\d/.test(password)) {
    return 'A senha deve conter ao menos 1 número';
  }
  if (!/[@#$*]/.test(password)) {
    return 'A senha deve conter ao menos 1 caractere especial (@, #, $ ou *)';
  }
  if (!PASSWORD_REGEX.test(password)) {
    return 'Senha inválida';
  }
  return null;
}
