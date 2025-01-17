type InputNumberValue = string | number | null;

type Options = Intl.NumberFormatOptions;

interface Locale {
  code: string;
}

const DEFAULT_LOCALE: Locale = { code: 'en-US' };

const formatNumberLocale = () => DEFAULT_LOCALE;

const processInput = (input: InputNumberValue): number | null => {
  if (input === null) return null;
  const num = typeof input === 'string' ? Number(input) : input;
  return Number.isNaN(num) ? null : num;
};

export function fShortenNumber(inputValue: InputNumberValue, options?: Options) {
  const locale = formatNumberLocale() || DEFAULT_LOCALE;

  const number = processInput(inputValue);
  if (number === null) return '';

  const fm = new Intl.NumberFormat(locale.code, {
    notation: 'compact',
    maximumFractionDigits: 2,
    ...options,
  }).format(number);

  return fm.replace(/[A-Z]/g, (match) => match.toLowerCase());
}
