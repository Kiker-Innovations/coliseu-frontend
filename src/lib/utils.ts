import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================
// CNPJ Functions
// ============================================

/**
 * Remove a formatação do CNPJ e retorna apenas os números
 */
export function unformatCnpj(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Valida um CNPJ (verifica dígitos verificadores)
 */
export function isValidCnpj(cnpj: string): boolean {
  const numbers = unformatCnpj(cnpj);

  // Deve ter 14 dígitos
  if (numbers.length !== 14) return false;

  // Verifica se todos os dígitos são iguais (inválido)
  if (/^(\d)\1+$/.test(numbers)) return false;

  // Calcula o primeiro dígito verificador
  let sum = 0;
  let weight = 5;
  for (let i = 0; i < 12; i++) {
    sum += Number.parseInt(numbers[i], 10) * weight;
    weight = weight === 2 ? 9 : weight - 1;
  }
  let digit = sum % 11;
  const firstDigit = digit < 2 ? 0 : 11 - digit;

  if (Number.parseInt(numbers[12], 10) !== firstDigit) return false;

  // Calcula o segundo dígito verificador
  sum = 0;
  weight = 6;
  for (let i = 0; i < 13; i++) {
    sum += Number.parseInt(numbers[i], 10) * weight;
    weight = weight === 2 ? 9 : weight - 1;
  }
  digit = sum % 11;
  const secondDigit = digit < 2 ? 0 : 11 - digit;

  return Number.parseInt(numbers[13], 10) === secondDigit;
}

// ============================================
// CPF Functions
// ============================================

/**
 * Remove a formatação do CPF e retorna apenas os números
 */
export function unformatCpf(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Valida um CPF (verifica dígitos verificadores)
 */
export function isValidCpf(cpf: string): boolean {
  const numbers = unformatCpf(cpf);

  // Deve ter 11 dígitos
  if (numbers.length !== 11) return false;

  // Verifica se todos os dígitos são iguais (inválido)
  if (/^(\d)\1+$/.test(numbers)) return false;

  // Calcula o primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += Number.parseInt(numbers[i], 10) * (10 - i);
  }
  let digit = (sum * 10) % 11;
  const firstDigit = digit === 10 ? 0 : digit;

  if (Number.parseInt(numbers[9], 10) !== firstDigit) return false;

  // Calcula o segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += Number.parseInt(numbers[i], 10) * (11 - i);
  }
  digit = (sum * 10) % 11;
  const secondDigit = digit === 10 ? 0 : digit;

  return Number.parseInt(numbers[10], 10) === secondDigit;
}

/**
 * Formata um valor para moeda brasileira (R$ X.XXX,XX)
 */
export function formatCurrency(value: string | number): string {
  // Se for número, converte para string
  const stringValue = typeof value === "number" ? value.toString() : value;

  // Remove tudo que não é número
  const numbers = stringValue.replace(/\D/g, "");

  if (!numbers) return "";

  // Converte para número e divide por 100 para ter os centavos
  const numericValue = Number.parseInt(numbers, 10) / 100;

  // Formata como moeda brasileira
  return numericValue.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/**
 * Remove a formatação de moeda e retorna o valor numérico
 */
export function unformatCurrency(value: string): number {
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, "");

  if (!numbers) return 0;

  // Converte para número e divide por 100 para ter os centavos
  return Number.parseInt(numbers, 10) / 100;
}

/**
 * Formata apenas números para input de moeda (sem prefixo R$)
 */
export function formatCurrencyInput(value: string): string {
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, "");

  if (!numbers) return "";

  // Converte para número e divide por 100 para ter os centavos
  const numericValue = Number.parseInt(numbers, 10) / 100;

  // Formata como moeda brasileira sem o símbolo
  return numericValue.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// ============================================
// Date/Time Functions
// ============================================

/**
 * Retorna a data e hora mínima permitida (5 minutos a partir de agora)
 * no formato YYYY-MM-DDTHH:mm para input datetime-local
 */
export function getMinDateTimeForInput(): string {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 5);

  // Formato: YYYY-MM-DDTHH:mm
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Retorna a data mínima permitida (hoje)
 * no formato YYYY-MM-DD para input date
 */
export function getMinDateForInput(): string {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/**
 * Valida se uma data/hora é pelo menos 5 minutos no futuro
 */
export function isDateTimeAtLeast5MinutesInFuture(dateString: string): boolean {
  const date = new Date(dateString);
  const now = new Date();
  const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

  return date >= fiveMinutesFromNow;
}

/**
 * Valida se uma data (apenas dia) é hoje ou no futuro
 * @deprecated Use isDateTimeAtLeast5MinutesInFuture para validações com hora
 */
export function isDateTodayOrFuture(dateString: string): boolean {
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  return date >= today;
}

/**
 * Converte uma data no formato datetime-local para ISO string
 */
export function dateTimeLocalToISO(dateTimeLocal: string): string {
  return new Date(dateTimeLocal).toISOString();
}

/**
 * Formata uma data ISO para exibição em português
 */
export function formatDateTimeBR(dateString: string): string {
  return new Date(dateString).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
