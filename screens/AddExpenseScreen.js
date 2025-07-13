// screens/AddExpenseScreen.js
import React, { useState, useEffect } from 'react'; // Añadir useEffect
import { StyleSheet, Text, View, Button, Alert, TextInput, Platform, ScrollView, TouchableOpacity, Modal } from 'react-native'; 
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PRIMARY_EXPENSE_CATEGORIES, EXPENSE_CATEGORIES } from '../constants/categories'; // <-- ¡Importa tus categorías!
import { loadCurrencySymbol, getCurrencySymbol } from '../constants/currencyUtils';
import { Picker } from '@react-native-picker/picker';

export default function AddExpenseScreen({ navigation }) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [mainCategory, setMainCategory] = useState(PRIMARY_EXPENSE_CATEGORIES[0]); // Categoría principal
  const [subCategory, setSubCategory] = useState(''); // Subcategoría
  const [currencySymbol, setCurrencySymbol] = useState(getCurrencySymbol()); 

  // Efecto para establecer la subcategoría inicial cuando cambia la categoría principal
  useEffect(() => {
    if (EXPENSE_CATEGORIES[mainCategory] && EXPENSE_CATEGORIES[mainCategory].length > 0) {
      setSubCategory(EXPENSE_CATEGORIES[mainCategory][0]); // Seleccionar la primera subcategoría por defecto
    } else {
      setSubCategory(''); // Si no hay subcategorías, limpiar
    }
    loadCurrencySymbol().then(symbol => setCurrencySymbol(symbol));
  }, [mainCategory]); // Se ejecuta cada vez que mainCategory cambia

  const EXPENSES_KEY = '@myApp:expenses';

  // Función para guardar un gasto individual en AsyncStorage
  const saveExpense = async (expense) => {
    try {
      const existingExpenses = await getExpenses();
      const updatedExpenses = [...existingExpenses, expense];
      await AsyncStorage.setItem(EXPENSES_KEY, JSON.stringify(updatedExpenses));
      console.log('Gasto guardado con éxito:', expense);
    } catch (error) {
      console.error('Error al guardar el gasto:', error);
      Alert.alert('Error', 'Hubo un problema al guardar el gasto.');
    }
  };

  // Función para obtener todos los gastos de AsyncStorage
  const getExpenses = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem(EXPENSES_KEY);
      return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (error) {
      console.error('Error al leer los gastos:', error);
      return [];
    }
  };

  // Función para manejar el guardado del gasto
  const handleSaveExpense = async () => {
    if (amount === '' || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Por favor, introduce un monto válido para el gasto.');
      return;
    }
    // Si la descripción es la subcategoría (para el caso de servicios, etc.) y está vacía, no es un error
    // Pero si el usuario borró la subcategoría y no hay descripción, sí
    if (description.trim() === '' && subCategory.trim() === '') {
      Alert.alert('Error', 'Por favor, introduce una descripción o selecciona una subcategoría.');
      return;
    }

    const finalDescription = description.trim() === '' ? subCategory : description.trim(); // Usa subcategoría si no hay descripción manual

    const newExpense = {
      id: Date.now().toString(),
      amount: parseFloat(amount),
      description: finalDescription, // Usa la descripción final
      mainCategory: mainCategory, // Guarda la categoría principal
      subCategory: subCategory, // Guarda la subcategoría
      category: `${mainCategory} - ${subCategory}`, // Para compatibilidad con reportes actuales, puedes ajustar esto más adelante
      date: new Date().toISOString(),
    };

    await saveExpense(newExpense);

    Alert.alert(
      'Gasto Guardado',
      `Monto: ${currencySymbol}${newExpense.amount}\nCategoría Principal: ${newExpense.mainCategory}\nSubcategoría: ${newExpense.subCategory}\nDescripción: ${newExpense.description}\nFecha: ${new Date(newExpense.date).toLocaleDateString()}`,
      [
        {
          text: 'OK',
          onPress: () => {
            setAmount('');
            setDescription('');
            setMainCategory(PRIMARY_EXPENSE_CATEGORIES[0]); // Resetear a la primera categoría principal
            // subCategory se reseteará automáticamente por el useEffect
            navigation.goBack();
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Añadir Nuevo Gasto</Text>

      {/* Campo de Monto */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Monto ({currencySymbol}):</Text> 
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          placeholder="Ej: 50.00"
          value={amount}
          onChangeText={setAmount}
        />
      </View>

      {/* Selector de Categoría Principal */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Categoría Principal:</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={mainCategory}
            onValueChange={(itemValue) => setMainCategory(itemValue)}
            style={styles.picker}
          >
            {PRIMARY_EXPENSE_CATEGORIES.map((cat) => (
              <Picker.Item key={cat} label={cat} value={cat} />
            ))}
          </Picker>
        </View>
      </View>

      {/* Selector de Subcategoría (condicional) */}
      {EXPENSE_CATEGORIES[mainCategory] && EXPENSE_CATEGORIES[mainCategory].length > 0 && (
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Subcategoría:</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={subCategory}
              onValueChange={(itemValue) => setSubCategory(itemValue)}
              style={styles.picker}
            >
              {EXPENSE_CATEGORIES[mainCategory].map((subCat) => (
                <Picker.Item key={subCat} label={subCat} value={subCat} />
              ))}
            </Picker>
          </View>
        </View>
      )}

      {/* Campo de Descripción (opcional, para detalles adicionales) */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Descripción Adicional (Opcional):</Text>
        <TextInput
          style={styles.input}
          placeholder="Detalles adicionales (ej: marca de producto)"
          value={description}
          onChangeText={setDescription}
        />
      </View>

      {/* Botón para Guardar Gasto */}
      <Button
        title="Guardar Gasto"
        onPress={handleSaveExpense}
        color="#007bff"
      />

      {/* Botón Volver a Inicio (mantenido para fácil navegación) */}
      <View style={{ marginTop: 20 }}>
        <Button
          title="Volver a Inicio"
          onPress={() => navigation.navigate('Home')}
          color="#6c757d"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff3e0',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#e65100',
  },
  inputGroup: {
    width: '100%',
    marginBottom: 20,
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
    padding: Platform.OS === 'ios' ? 15 : 10,
    fontSize: 16,
    backgroundColor: '#fff',
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
});