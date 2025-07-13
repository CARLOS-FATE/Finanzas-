// constants/currency.js

export const CURRENCY_OPTIONS = [
  { label: 'Soles (S/)', value: 'S/' },
  { label: 'Dólares ($)', value: '$' },
  { label: 'Euros (€)', value: '€' },
  { label: 'Pesos Mexicanos (MXN$)', value: 'MXN$' },
  // Añade más opciones si lo deseas
];

export const DEFAULT_CURRENCY_SYMBOL = 'S/'; // Moneda por defecto
export const CURRENCY_KEY = '@myApp:currencySymbol'; // Clave para AsyncStorage