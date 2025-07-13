// constants/currencyUtils.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CURRENCY_KEY, DEFAULT_CURRENCY_SYMBOL } from './currency';

let currentCurrencySymbol = DEFAULT_CURRENCY_SYMBOL; // Valor inicial

// Función para obtener el símbolo de moneda guardado
export const loadCurrencySymbol = async () => {
  try {
    const storedCurrency = await AsyncStorage.getItem(CURRENCY_KEY);
    if (storedCurrency !== null) {
      currentCurrencySymbol = storedCurrency;
    } else {
      currentCurrencySymbol = DEFAULT_CURRENCY_SYMBOL; // Si no hay nada guardado, usar el por defecto
    }
  } catch (error) {
    console.error('Error al cargar el símbolo de moneda:', error);
    currentCurrencySymbol = DEFAULT_CURRENCY_SYMBOL;
  }
  return currentCurrencySymbol;
};

// Función para obtener el símbolo actual (útil para JSX)
export const getCurrencySymbol = () => {
  return currentCurrencySymbol;
};

// Función para actualizar el símbolo en memoria (llamada después de guardar en Settings)
export const setCurrencySymbol = (symbol) => {
  currentCurrencySymbol = symbol;
};