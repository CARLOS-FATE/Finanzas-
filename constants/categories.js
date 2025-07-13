// constants/categories.js

export const EXPENSE_CATEGORIES = {
  'Gastos Fijos': [
    'Alquiler/Hipoteca',
    'Servicios (Luz)',
    'Servicios (Agua)',
    'Servicios (Gas)',
    'Servicios (Internet)',
    'Servicios (Teléfono)',
    'Suscripciones (Streaming)',
    'Suscripciones (Software)',
    'Seguros',
    'Cuotas Préstamos',
    'Impuestos/Tasas',
    'Otro Gasto Fijo',
  ],
  'Gastos Necesarios': [
    'Alimentos/Supermercado',
    'Transporte (Combustible)',
    'Transporte (Público)',
    'Salud/Medicamentos',
    'Educación',
    'Cuidado Personal',
    'Ropa',
    'Mantenimiento del Hogar',
    'Deudas (Tarjetas, Créditos)',
    'Mascotas',
    'Otro Gasto Necesario',
  ],
  'Gastos Ocasionales': [
    'Entretenimiento/Ocio',
    'Restaurantes/Comida Fuera',
    'Compras (Ropa, Electrónica, etc.)',
    'Viajes',
    'Regalos',
    'Hobbies',
    'Donaciones',
    'Otro Gasto Ocasional',
  ],
  'Ahorros': [ // Aunque es para ahorro, a veces se registra como un "gasto" desde la perspectiva de la cuenta
    'Ahorro para Meta',
    'Fondo de Emergencia',
    'Inversiones',
    'Otro Ahorro',
  ],
  // Puedes añadir más categorías principales si es necesario
  // Por ejemplo: 'Ingresos' si decides gestionar también los ingresos de esta forma
};

// Exporta también un array plano de todas las categorías principales para el Picker inicial si se necesita
export const PRIMARY_EXPENSE_CATEGORIES = Object.keys(EXPENSE_CATEGORIES);

// Puedes exportar una lista plana de todas las subcategorías si lo necesitas en algún otro lugar
export const ALL_SUBCATEGORIES = Object.values(EXPENSE_CATEGORIES).flat();