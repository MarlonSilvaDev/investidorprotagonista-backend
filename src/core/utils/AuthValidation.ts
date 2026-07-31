const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Mín. 8, 1 maiúscula, 1 número e 1 especial entre @ # $ * */
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[@#$*]).{8,}$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
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
