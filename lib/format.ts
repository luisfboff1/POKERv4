export function formatCurrency(value: number | string, locale: string = 'pt-BR', currency: string = 'BRL') {
  const num = typeof value === 'string' ? Number(value) : value;
  if (isNaN(num)) return 'R$ 0,00';
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(num);
}
