// screens/BudgetsScreen.js
import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, Button, FlatList, ActivityIndicator, ScrollView, Alert, TouchableOpacity, Modal, TextInput, Platform } from 'react-native'; // <-- ¡Asegúrate de que 'Platform' esté AQUÍ!
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker'; // Asegúrate de que esté importado
import { PRIMARY_EXPENSE_CATEGORIES } from '../constants/categories'; // <-- ¡IMPORTA LAS CATEGORÍAS PRINCIPALES!
import { loadCurrencySymbol, getCurrencySymbol } from '../constants/currencyUtils';
// import i18n from '../constants/i18n';

export default function BudgetsScreen({ navigation }) {
  const [budgets, setBudgets] = useState({});
  // Cambia 'category' por 'selectedCategory' para usar el Picker
  const [selectedCategory, setSelectedCategory] = useState(PRIMARY_EXPENSE_CATEGORIES[0] || ''); // Valor por defecto
  const [budgetAmount, setBudgetAmount] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [currencySymbol, setCurrencySymbol] = useState(getCurrencySymbol()); // Estado para el símbolo de moneda

  const BUDGETS_KEY = '@myApp:budgets';
  const EXPENSES_KEY = '@myApp:expenses';

  const [expenses, setExpenses] = useState([]);

  // ... (loadBudgets, saveBudgets, getExpenses - estas funciones no cambian) ...
  const loadBudgets = async () => {
    try {

      const storedCurrency = await loadCurrencySymbol(); // <-- Cargar moneda
      setCurrencySymbol(storedCurrency);

      const jsonValue = await AsyncStorage.getItem(BUDGETS_KEY);
      const loadedBudgets = jsonValue != null ? JSON.parse(jsonValue) : {};
      setBudgets(loadedBudgets);
    } catch (error) {
      console.error('Error al cargar presupuestos:', error);
      Alert.alert('Error', 'No se pudieron cargar los presupuestos.');
    }
  };

  const saveBudgets = async (budgetsToSave) => {
    try {
      await AsyncStorage.setItem(BUDGETS_KEY, JSON.stringify(budgetsToSave));
      setBudgets(budgetsToSave);
      Alert.alert('Éxito', 'Presupuesto guardado.');
      // Después de guardar, si estás editando, resetea los campos
      if (editingCategory) {
          setEditingCategory(null);
          setSelectedCategory(PRIMARY_EXPENSE_CATEGORIES[0] || '');
          setBudgetAmount('');
      }
    } catch (error) {
      console.error('Error al guardar presupuesto:', error);
      Alert.alert('Error', 'Hubo un problema al guardar el presupuesto.');
    }
  };

  const getExpenses = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem(EXPENSES_KEY);
      const loadedExpenses = jsonValue != null ? JSON.parse(jsonValue) : [];
      setExpenses(loadedExpenses);
    } catch (error) {
      console.error('Error al leer gastos para presupuestos:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadBudgets();
      getExpenses();
      // Asegurar que el picker tenga un valor inicial válido al cargar la pantalla
      if (PRIMARY_EXPENSE_CATEGORIES.length > 0) {
        setSelectedCategory(PRIMARY_EXPENSE_CATEGORIES[0]);
      }
    }, [])
  );


  // --- Lógica de la aplicación ---

  const handleSetBudget = async () => {
    // Usar selectedCategory en lugar de category
    if (selectedCategory.trim() === '' || budgetAmount.trim() === '' || isNaN(parseFloat(budgetAmount)) || parseFloat(budgetAmount) <= 0) {
      Alert.alert('Error', 'Por favor, selecciona una categoría y un monto de presupuesto válido.');
      return;
    }

    const newBudgets = {
      ...budgets,
      // Guarda con el nombre de la categoría principal
      [selectedCategory.trim().toLowerCase()]: parseFloat(budgetAmount),
    };
    await saveBudgets(newBudgets);
    // Limpia solo si no estabas en modo de edición al guardar, o maneja la limpieza en saveBudgets
    // setNewCategory(''); // Esto se manejará mejor en saveBudgets
    // setBudgetAmount('');
    // setEditingCategory(null);
  };

  const handleEditBudget = (cat, amount) => {
    setEditingCategory(cat);
    setSelectedCategory(cat); // Pre-rellena la categoría en el Picker
    setBudgetAmount(amount.toString()); // Pre-rellena el monto
  };

  const handleDeleteBudget = (cat) => {
    Alert.alert(
      'Confirmar Eliminación',
      `¿Estás seguro de que quieres eliminar el presupuesto para "${cat}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', onPress: async () => {
            const newBudgets = { ...budgets };
            delete newBudgets[cat];
            await saveBudgets(newBudgets);
            if (editingCategory === cat) {
                setSelectedCategory(PRIMARY_EXPENSE_CATEGORIES[0] || ''); // Resetea el picker
                setBudgetAmount('');
                setEditingCategory(null);
            }
            Alert.alert('Eliminado', `Presupuesto para "${cat}" eliminado.`);
          }
        },
      ]
    );
  };

  // Función para obtener el gasto actual de una categoría principal para el mes
  // Asegúrate de que esta lógica compare con expense.mainCategory
  const getCurrentMonthExpensesByCategory = (cat) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    let totalSpent = 0;

    expenses.forEach(expense => {
      const expenseDate = new Date(expense.date);
      if (expenseDate.getMonth() === currentMonth &&
          expenseDate.getFullYear() === currentYear &&
          expense.mainCategory && expense.mainCategory.toLowerCase() === cat.toLowerCase()) {
        totalSpent += expense.amount;
      }
    });
    return totalSpent;
  };

  const renderBudgetItem = ({ item }) => {
    const [cat, amount] = item;
    const spent = getCurrentMonthExpensesByCategory(cat);
    const remaining = amount - spent;
    const progressPercentage = (spent / amount) * 100;

    const progressBarColor = progressPercentage >= 100 ? '#e53935' :
                             progressPercentage >= 75 ? '#ffb300' :
                             '#4caf50';

    return (
      <View style={styles.budgetItem}>
        <View style={styles.budgetItemHeader}>
          <Text style={styles.budgetCategory}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</Text>
          <View style={styles.budgetActions}>
            <TouchableOpacity onPress={() => handleEditBudget(cat, amount)} style={styles.actionButton}>
              <Text style={styles.editButtonText}>Editar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDeleteBudget(cat)} style={styles.actionButton}>
              <Text style={styles.deleteButtonText}>Eliminar</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.budgetAmountText}>Presupuesto: {currencySymbol}{amount.toFixed(2)}</Text> {/* ¡Usar currencySymbol! */}
        <Text style={styles.budgetSpentText}>Gastado: {currencySymbol}{spent.toFixed(2)}</Text>
        <Text style={[styles.budgetRemainingText, remaining < 0 && styles.negativeRemaining]}>
          {remaining >= 0 ? `Restante: ${currencySymbol}${remaining.toFixed(2)}` : `Excedido: ${currencySymbol}${Math.abs(remaining).toFixed(2)}`}
        </Text>
        <View style={styles.progressBarBackground}>
          <View style={[styles.progressBarFill, { width: `${Math.min(100, progressPercentage)}%`, backgroundColor: progressBarColor }]} />
        </View>
        <Text style={styles.progressPercentageText}>{progressPercentage.toFixed(1)}% Gastado</Text>
      </View>
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Gestionar Presupuestos</Text>
      <Text style={styles.subtitle}>Define límites de gasto por categoría principal.</Text> {/* Subtítulo más claro */}

      {/* Sección para Añadir/Editar Presupuesto */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {editingCategory ? `Editar Presupuesto para: ${editingCategory.charAt(0).toUpperCase() + editingCategory.slice(1)}` : 'Añadir Nuevo Presupuesto'}
        </Text>
        <View style={styles.inputGroup}> {/* Para el Picker de categoría */}
          <Text style={styles.label}>Categoría:</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedCategory}
              onValueChange={(itemValue) => setSelectedCategory(itemValue)}
              style={styles.picker}
              enabled={!editingCategory} // Deshabilita el Picker en modo edición
            >
              {PRIMARY_EXPENSE_CATEGORIES.map((cat) => (
                <Picker.Item key={cat} label={cat} value={cat} />
              ))}
            </Picker>
          </View>
        </View>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          placeholder="Monto de presupuesto (ej. 300)"
          value={budgetAmount}
          onChangeText={setBudgetAmount}
        />
        <Button
          title={editingCategory ? 'Guardar Cambios' : 'Establecer Presupuesto'}
          onPress={handleSetBudget}
          color={editingCategory ? '#ff9800' : '#4CAF50'}
        />
        {editingCategory && (
            <View style={{marginTop: 10}}>
                <Button title="Cancelar Edición" onPress={() => {
                    setEditingCategory(null);
                    setSelectedCategory(PRIMARY_EXPENSE_CATEGORIES[0] || ''); // Resetea el picker
                    setBudgetAmount('');
                }} color="#6c757d" />
            </View>
        )}
      </View>

      {/* Lista de Presupuestos Existentes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tus Presupuestos Actuales</Text>
        {Object.keys(budgets).length === 0 ? (
          <Text style={styles.noBudgetsText}>Aún no tienes presupuestos establecidos.</Text>
        ) : (
          <FlatList
            data={Object.entries(budgets)}
            renderItem={renderBudgetItem}
            keyExtractor={(item) => item[0]}
            style={styles.budgetsList}
            scrollEnabled={false}
          />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
    minHeight: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#004d40',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#00796b',
    textAlign: 'center',
    marginBottom: 30,
  },
  section: {
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    fontSize: 16,
  },
  noBudgetsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
  },
  budgetsList: {
    marginTop: 10,
  },
  budgetItem: {
    backgroundColor: '#f0f4c3',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 5,
    borderLeftColor: '#8bc34a',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  budgetItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  budgetCategory: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  budgetActions: {
    flexDirection: 'row',
  },
  actionButton: {
    marginLeft: 10,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 5,
    backgroundColor: '#e0e0e0',
  },
  editButtonText: {
    color: '#007bff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  deleteButtonText: {
    color: '#dc3545',
    fontWeight: 'bold',
    fontSize: 12,
  },
  budgetAmountText: {
    fontSize: 16,
    color: '#555',
    marginBottom: 5,
  },
  budgetSpentText: {
    fontSize: 16,
    color: '#555',
    marginBottom: 5,
  },
  budgetRemainingText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#28a745',
    marginBottom: 8,
  },
  negativeRemaining: {
    color: '#dc3545',
  },
  progressBarBackground: {
    height: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    overflow: 'hidden',
    marginTop: 5,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  progressPercentageText: {
    fontSize: 12,
    color: '#777',
    textAlign: 'right',
    marginTop: 5,
  },
  inputGroup: { // Añadido para el Picker
    width: '100%',
    marginBottom: 10,
  },
  label: { // Añadido para el Picker
    fontSize: 16,
    marginBottom: 5,
    color: '#333',
    fontWeight: 'bold',
  },
  pickerContainer: { // Añadido para el Picker
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  picker: { // Añadido para el Picker
    height: Platform.OS === 'ios' ? 180 : 50,
    width: '100%',
  },
});