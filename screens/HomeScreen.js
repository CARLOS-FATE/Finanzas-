// screens/HomeScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, Button, FlatList, ActivityIndicator, ScrollView, Alert, TouchableOpacity, Modal, TextInput, Platform } from 'react-native'; 
import { Picker } from '@react-native-picker/picker'; // Para el selector en el modal de edición
import Ionicons from '@expo/vector-icons/Ionicons'; // Importa Ionicons para los iconos de advertencia y otros
import { PRIMARY_EXPENSE_CATEGORIES } from '../constants/categories'; // Para las categorías en el modal de edición
import { loadCurrencySymbol, getCurrencySymbol } from '../constants/currencyUtils'; // <-- ¡IMPORTA ESTO!
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';


export default function HomeScreen({ navigation }) {
  const [expenses, setExpenses] = useState([]);
  const [savingsGoals, setSavingsGoals] = useState([]);
  const [budgets, setBudgets] = useState({});
  const [loading, setLoading] = useState(true);
  const [totalExpensesMonth, setTotalExpensesMonth] = useState(0);
  const [currentSavingsTotal, setCurrentSavingsTotal] = useState(0);
  const [balance, setBalance] = useState(0);

  // Estados para el modal de edición de gastos
  const [isEditModalVisible, setEditModalVisible] = useState(false);
  const [currentEditingExpense, setCurrentEditingExpense] = useState(null);
  const [editedAmount, setEditedAmount] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [currencySymbol, setCurrencySymbol] = useState(getCurrencySymbol()); // Estado para el símbolo de moneda

  // Para el modal de edición, usaremos la categoría principal del gasto si existe, o la combinada
  const [editedMainCategory, setEditedMainCategory] = useState('');
  const [editedSubCategory, setEditedSubCategory] = useState('');


  // Claves para AsyncStorage
  const EXPENSES_KEY = '@myApp:expenses';
  const SAVINGS_KEY = '@myApp:savingsGoals';
  const BUDGETS_KEY = '@myApp:budgets';

  // --- Funciones de Carga y Guardado de Datos ---
  const getExpenses = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem(EXPENSES_KEY);
      return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (error) {
      console.error('Error al leer los gastos desde Home:', error);
      return [];
    }
  };

  const getSavingsGoals = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem(SAVINGS_KEY);
      return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (error) {
      console.error('Error al leer las metas de ahorro desde Home:', error);
      return [];
    }
  };

  const getBudgets = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem(BUDGETS_KEY);
      return jsonValue != null ? JSON.parse(jsonValue) : {};
    } catch (error) {
      console.error('Error al leer presupuestos desde Home:', error);
      return {};
    }
  };

  // Función genérica para guardar gastos (usada por edición/eliminación)
  const saveExpenses = async (expensesToSave) => {
    try {
      await AsyncStorage.setItem(EXPENSES_KEY, JSON.stringify(expensesToSave));
      setExpenses(expensesToSave);
      loadAllData(); // Recargar todos los datos para actualizar los resúmenes después de guardar
    } catch (error) {
      console.error('Error al guardar gastos:', error);
      Alert.alert('Error', 'Hubo un problema al guardar los cambios.');
    }
  };

  // Carga todos los datos necesarios (gastos, ahorros, presupuestos)
  const loadAllData = async () => {
    setLoading(true);
    const loadedExpenses = await getExpenses();
    const loadedSavingsGoals = await getSavingsGoals();
    const loadedBudgets = await getBudgets();
    const loadedCurrencySymbol = await loadCurrencySymbol(); // <-- Cargar moneda
    setCurrencySymbol(loadedCurrencySymbol); // <-- Actualizar estado de moneda

    setExpenses(loadedExpenses);
    setSavingsGoals(loadedSavingsGoals);
    setBudgets(loadedBudgets);

    // Calcular total de gastos del mes actual
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let monthExpensesTotal = 0;
    loadedExpenses.forEach(exp => {
      const expDate = new Date(exp.date);
      if (expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear) {
        monthExpensesTotal += exp.amount;
      }
    });
    setTotalExpensesMonth(monthExpensesTotal);

    // Calcular total ahorrado acumulado
    let totalSaved = 0;
    loadedSavingsGoals.forEach(goal => {
      totalSaved += goal.currentAmount;
    });
    setCurrentSavingsTotal(totalSaved);

    // Balance simplificado (solo gastos por ahora, faltaría sumar ingresos)
    setBalance(-monthExpensesTotal);

    setLoading(false);
  };

  // Hook que carga todos los datos cada vez que la pantalla entra en foco
  useFocusEffect(
    useCallback(() => {
      loadAllData();
    }, [])
  );

  // --- Funciones de Edición y Eliminación de Gastos ---

  const handleEditExpense = (expense) => {
    setCurrentEditingExpense(expense);
    setEditedAmount(expense.amount.toString());
    setEditedDescription(expense.description);
    // Usar la mainCategory si existe, si no, usar la categoría combinada para compatibilidad
    setEditedMainCategory(expense.mainCategory || expense.category.split(' - ')[0] || PRIMARY_EXPENSE_CATEGORIES[0]);
    setEditedSubCategory(expense.subCategory || expense.category.split(' - ')[1] || ''); // Precargar subcategoría si existe
    setEditModalVisible(true);
  };

  const handleSaveEditedExpense = async () => {
    if (!currentEditingExpense) return;

    if (editedAmount === '' || isNaN(parseFloat(editedAmount)) || parseFloat(editedAmount) <= 0) {
      Alert.alert('Error', 'Por favor, introduce un monto válido.');
      return;
    }
    if (editedDescription.trim() === '') {
      Alert.alert('Error', 'Por favor, introduce una descripción.');
      return;
    }

    const updatedExpenses = expenses.map(exp =>
      exp.id === currentEditingExpense.id
        ? {
            ...exp,
            amount: parseFloat(editedAmount),
            description: editedDescription.trim(),
            // Actualizar mainCategory y subCategory, y la 'category' combinada
            mainCategory: editedMainCategory,
            subCategory: editedSubCategory,
            category: `${editedMainCategory} - ${editedSubCategory || editedDescription.trim() || 'Sin subcategoría'}`,
          }
        : exp
    );
    await saveExpenses(updatedExpenses);
    setEditModalVisible(false);
    setCurrentEditingExpense(null);
    Alert.alert('Éxito', 'Gasto actualizado correctamente.');
  };

  const handleDeleteExpense = (id) => {
    Alert.alert(
      'Confirmar Eliminación',
      '¿Estás seguro de que quieres eliminar este gasto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          onPress: async () => {
            const updatedExpenses = expenses.filter(exp => exp.id !== id);
            await saveExpenses(updatedExpenses);
            Alert.alert('Éxito', 'Gasto eliminado correctamente.');
          },
        },
      ]
    );
  };

  // Función para obtener el gasto actual de una categoría para el mes (para presupuestos)
  const getCurrentMonthExpensesByCategory = (cat) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    let totalSpent = 0;

    expenses.forEach(expense => {
      const expenseDate = new Date(expense.date);
      // Asegurarse de comparar con mainCategory, ya que los presupuestos se definen así
      if (expenseDate.getMonth() === currentMonth &&
          expenseDate.getFullYear() === currentYear &&
          expense.mainCategory && expense.mainCategory.toLowerCase() === cat.toLowerCase()) {
        totalSpent += expense.amount;
      }
    });
    return totalSpent;
  };

  // --- Renderizado de Items de Gastos Recientes ---
  const renderItem = ({ item }) => (
    <View style={styles.expenseItem}>
      <View style={styles.expenseDetails}>
        {/* Muestra mainCategory y subCategory para mayor detalle */}
        <Text style={styles.expenseDescription}>{item.description}</Text>
        <Text style={styles.expenseCategory}>Categoría: {item.mainCategory} {item.subCategory ? `(${item.subCategory})` : ''}</Text>
        <Text style={styles.expenseAmount}>Monto: S/{item.amount.toFixed(2)}</Text> {/* Símbolo Soles */}
        <Text style={styles.expenseDate}>Fecha: {new Date(item.date).toLocaleDateString()}</Text>
      </View>
      <View style={styles.expenseActions}>
        <TouchableOpacity onPress={() => handleEditExpense(item)} style={[styles.actionButton, styles.editButton]}>
          <Text style={styles.actionButtonText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDeleteExpense(item.id)} style={[styles.actionButton, styles.deleteButton]}>
          <Text style={styles.actionButtonText}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

// Renderizado de ítems de presupuesto en el resumen (dashboard)
const renderBudgetItem = ([category, amount]) => {
  const spent = getCurrentMonthExpensesByCategory(category);
  const remaining = amount - spent;
  const progressPercentage = (spent / amount) * 100;

  let progressBarColor;
  if (progressPercentage >= 100) {
    progressBarColor = '#e53935';
  } else if (progressPercentage >= 85) {
    progressBarColor = '#ffb300';
  } else {
    progressBarColor = '#4caf50';
  }
  const showAlertIcon = remaining < 0;

  return (
    <View key={category} style={styles.budgetProgressItem}>
      <View style={styles.budgetProgressHeader}>
        <Text style={styles.budgetProgressCategory}>{category.charAt(0).toUpperCase() + category.slice(1)}</Text>
        {showAlertIcon && <Ionicons name="warning" size={20} color="#e53935" style={styles.warningIcon} />}
      </View>
      <Text style={styles.budgetProgressValues}>
        Gastado: {currencySymbol}{spent.toFixed(2)} / Presupuesto: {currencySymbol}{amount.toFixed(2)}
      </Text>
      <View style={styles.progressBarBackground}>
        <View style={[styles.progressBarFill, { width: `${Math.min(100, progressPercentage)}%`, backgroundColor: progressBarColor }]} />
      </View>
      <Text style={[styles.budgetProgressRemaining, remaining < 0 && styles.negativeRemainingProgress]}>
        {remaining >= 0 ? `Restante: ${currencySymbol}${remaining.toFixed(2)}` : `Excedido: ${currencySymbol}${Math.abs(remaining).toFixed(2)}`}
      </Text>
    </View>
  );
};

  return (
    <ScrollView style={styles.scrollViewContainer} contentContainerStyle={styles.container}>
      <Text style={styles.title}>Panel de Finanzas del Hogar</Text>
      <Text style={styles.subtitle}>Resumen Rápido</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" style={styles.loadingIndicator} />
      ) : (
        <>
          {/* Tarjetas de Resumen Global */}
          <View style={styles.summaryCardsContainer}>
            <View style={[styles.summaryCard, styles.balanceCard]}>
              <Text style={styles.summaryCardTitle}>Balance Mensual</Text>
              <Text style={[styles.summaryCardValue, balance < 0 ? styles.negativeBalance : styles.positiveBalance]}>
                {currencySymbol}{balance.toFixed(2)} {/* ¡Usar currencySymbol! */}
              </Text>
              <Text style={styles.summaryCardSubtitle}>(Gastos este mes)</Text>
            </View>

            <View style={[styles.summaryCard, styles.expensesCard]}>
              <Text style={styles.summaryCardTitle}>Gastos del Mes</Text>
              <Text style={styles.summaryCardValue}>{currencySymbol}{totalExpensesMonth.toFixed(2)}</Text> {/* ¡Usar currencySymbol! */}
              <Text style={styles.summaryCardSubtitle}>({new Date().toLocaleString('es-ES', { month: 'long', year: 'numeric' })})</Text>
            </View>

            <View style={[styles.summaryCard, styles.savingsCard]}>
              <Text style={styles.summaryCardTitle}>Ahorro Total</Text>
              <Text style={styles.summaryCardValue}>{currencySymbol}{currentSavingsTotal.toFixed(2)}</Text> {/* ¡Usar currencySymbol! */}
              <Text style={styles.summaryCardSubtitle}>(acumulado en metas)</Text>
            </View>
          </View>

          {/* Sección de Progreso de Presupuestos (solo si hay presupuestos definidos) */}
          {Object.keys(budgets).length > 0 && (
            <View style={styles.budgetsOverviewContainer}>
              <Text style={styles.sectionTitle}>Progreso de Presupuestos ({new Date().toLocaleString('es-ES', { month: 'long' })})</Text>
              {Object.entries(budgets).map(renderBudgetItem)}
              <Button
                title="Gestionar Presupuestos"
                onPress={() => navigation.navigate('BudgetsTab')}
                color="#00796b"
                style={styles.manageBudgetsButton}
              />
            </View>
          )}
        </>
      )}

      {/* Botones de Navegación de Acciones Rápidas */}
      <View style={styles.buttonContainer}>
        <Button
          title="Añadir Nuevo Gasto"
          onPress={() => navigation.navigate('AddExpenseTab')}
          color="#007bff"
        />
        <Button
          title="Ver Mis Ahorros"
          onPress={() => navigation.navigate('SavingsTab')}
          color="#28a745"
        />
        <Button
          title="Ver Reportes Mensuales"
          onPress={() => navigation.navigate('ReportsTab')}
          color="#ff9800"
        />
        <Button
          title="Ver Reportes Anuales"
          onPress={() => navigation.navigate('AnnualReportsTab')}
          color="#8a2be2"
        />
        <Button
          title="Gestionar Presupuestos"
          onPress={() => navigation.navigate('BudgetsTab')}
          color="#00796b"
        />
      </View>

      <Text style={styles.sectionTitle}>Tus Últimos Gastos:</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : expenses.length === 0 ? (
        <Text style={styles.noExpensesText}>Aún no has registrado ningún gasto.</Text>
      ) : (
        <FlatList
          data={expenses.slice(0, 5)}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          style={styles.expensesList}
          scrollEnabled={false}
          contentContainerStyle={styles.listContentContainer}
        />
      )}
      {expenses.length > 5 && (
        <Button
          title="Ver Todos los Gastos"
          onPress={() => navigation.navigate('ReportsTab')}
          color="#6c757d"
        />
      )}

      {/* Modal para Editar Gasto */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isEditModalVisible}
        onRequestClose={() => {
          setEditModalVisible(!isEditModalVisible);
        }}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Editar Gasto</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Monto ({currencySymbol}):</Text> {/* Símbolo Soles */}
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={editedAmount}
                onChangeText={setEditedAmount}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Descripción:</Text>
              <TextInput
                style={styles.input}
                value={editedDescription}
                onChangeText={setEditedDescription}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Categoría Principal:</Text> {/* Etiqueta actualizada */}
              <View style={styles.pickerContainer}>
                {/* Picker para editar la CATEGORÍA PRINCIPAL */}
                <Picker
                    selectedValue={editedMainCategory}
                    onValueChange={(itemValue) => {
                      setEditedMainCategory(itemValue);
                      // Si cambias la categoría principal, puedes intentar resetear o actualizar la subcategoría aquí si el modal fuera más complejo
                    }}
                    style={styles.picker}
                >
                    {PRIMARY_EXPENSE_CATEGORIES.map(cat => (
                        <Picker.Item key={cat} label={cat} value={cat} />
                    ))}
                </Picker>
              </View>
            </View>
            {/* Si quieres también editar la subcategoría en el modal, añadirías otro picker aquí
                y su lógica sería más compleja, cargando las subcategorías según editedMainCategory.
                Por ahora, solo editamos mainCategory y la descripción.
            */}

            <View style={styles.modalButtonContainer}>
              <Button title="Guardar Cambios" onPress={handleSaveEditedExpense} color="#28a745" />
              <Button title="Cancelar" onPress={() => setEditModalVisible(false)} color="#dc3545" />
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollViewContainer: {
    flex: 1,
    backgroundColor: '#e0f7fa',
  },
  container: {
    padding: 20,
    alignItems: 'center',
    paddingBottom: 50,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#263238',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#455a64',
    textAlign: 'center',
    marginBottom: 20,
  },
  loadingIndicator: {
    marginTop: 50,
  },
  summaryCardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 30,
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 15,
    margin: 5,
    width: '45%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  balanceCard: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196f3',
    borderWidth: 1,
  },
  expensesCard: {
    backgroundColor: '#ffebee',
    borderColor: '#ef5350',
    borderWidth: 1,
  },
  savingsCard: {
    backgroundColor: '#e8f5e9',
    borderColor: '#4caf50',
    borderWidth: 1,
  },
  summaryCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
    textAlign: 'center',
  },
  summaryCardValue: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  positiveBalance: {
    color: '#4CAF50',
  },
  negativeBalance: {
    color: '#D32F2F',
  },
  summaryCardSubtitle: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  buttonContainer: {
    width: '80%',
    justifyContent: 'space-around',
    height: 300,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
    alignSelf: 'flex-start',
    width: '100%',
  },
  noExpensesText: {
    fontSize: 16,
    color: '#666',
    marginTop: 20,
  },
  expensesList: {
    width: '100%',
  },
  listContentContainer: {
    paddingBottom: 10,
  },
  expenseItem: {
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expenseDetails: {
    flex: 1,
  },
  expenseDescription: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  expenseCategory: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 3,
  },
  expenseDate: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
  },
  expenseActions: {
    flexDirection: 'row',
    marginLeft: 10,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
    marginLeft: 8,
  },
  editButton: {
    backgroundColor: '#ffc107',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
  },
  actionButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
  },

  // Estilos del Modal
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '90%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  inputGroup: {
    width: '100%',
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: '#333',
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  picker: {
    height: Platform.OS === 'ios' ? 180 : 50,
    width: '100%',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
  },
  // Estilos para la sección de progreso de presupuestos en Home
  budgetsOverviewContainer: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  budgetProgressItem: {
    backgroundColor: '#f9fbe7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#cddc39',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  budgetProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  budgetProgressCategory: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  warningIcon: {
    marginLeft: 10,
  },
  budgetProgressValues: {
    fontSize: 14,
    color: '#555',
    marginTop: 2,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginTop: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  budgetProgressRemaining: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#28a745',
    textAlign: 'right',
    marginTop: 5,
  },
  negativeRemainingProgress: {
    color: '#dc3545',
  },
  manageBudgetsButton: {
    marginTop: 15,
  },
});