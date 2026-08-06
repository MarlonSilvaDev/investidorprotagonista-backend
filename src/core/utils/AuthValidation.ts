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
