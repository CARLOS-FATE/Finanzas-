// screens/SavingsScreen.js
import React, { useState, useCallback } from 'react';
import { StyleSheet,KeyboardAvoidingView, Text, View, Button, FlatList, ActivityIndicator, ScrollView, Alert, TouchableOpacity, Modal, TextInput, Platform } from 'react-native'; 
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import Ionicons from '@expo/vector-icons/Ionicons';
import { loadCurrencySymbol, getCurrencySymbol } from '../constants/currencyUtils';

export default function SavingsScreen({ navigation }) {
  const [savingsGoals, setSavingsGoals] = useState([]); // Estado para la lista de metas de ahorro
  const [newGoalName, setNewGoalName] = useState(''); // Estado para el nombre de la nueva meta
  const [newGoalAmount, setNewGoalAmount] = useState(''); // Estado para el monto objetivo de la nueva meta
  const [contributionAmount, setContributionAmount] = useState(''); // Estado para el monto de la aportación
  const [selectedGoalId, setSelectedGoalId] = useState(null); // ID de la meta seleccionada para aportar
  const [currencySymbol, setCurrencySymbol] = useState(getCurrencySymbol());
  // --- Funciones para AsyncStorage ---

  const SAVINGS_KEY = '@myApp:savingsGoals'; // Clave para AsyncStorage

  // Cargar metas de ahorro
  const loadSavingsGoals = async () => {
    try {
      const storedCurrency = await loadCurrencySymbol(); // <-- Cargar moneda
      setCurrencySymbol(storedCurrency);

      const jsonValue = await AsyncStorage.getItem(SAVINGS_KEY);
      const loadedGoals = jsonValue != null ? JSON.parse(jsonValue) : [];
      setSavingsGoals(loadedGoals);
    } catch (error) {
      console.error('Error al cargar metas de ahorro:', error);
      Alert.alert('Error', 'No se pudieron cargar las metas de ahorro.');
    }
  };

  // Guardar metas de ahorro
  const saveSavingsGoals = async (goalsToSave) => {
    try {
      await AsyncStorage.setItem(SAVINGS_KEY, JSON.stringify(goalsToSave));
      setSavingsGoals(goalsToSave); // Actualiza el estado con la lista guardada
    } catch (error) {
      console.error('Error al guardar metas de ahorro:', error);
      Alert.alert('Error', 'Hubo un problema al guardar las metas de ahorro.');
    }
  };

  // --- Manejo de la pantalla ---

  useFocusEffect(
    useCallback(() => {
      loadSavingsGoals();
      // Limpiar campos de aportación y selección al volver a la pantalla
      setSelectedGoalId(null);
      setContributionAmount('');
    }, [])
  );

  // --- Lógica de la aplicación ---

  const handleAddGoal = async () => {
    if (newGoalName.trim() === '' || newGoalAmount.trim() === '' || isNaN(parseFloat(newGoalAmount)) || parseFloat(newGoalAmount) <= 0) {
      Alert.alert('Error', 'Por favor, introduce un nombre y un monto objetivo válido para la meta.');
      return;
    }

    const newGoal = {
      id: Date.now().toString(),
      name: newGoalName.trim(),
      targetAmount: parseFloat(newGoalAmount),
      currentAmount: 0, // Inicia con 0 ahorrado
      contributions: [], // Para guardar un historial de aportaciones (opcional pero útil)
      createdAt: new Date().toISOString(),
    };

    const updatedGoals = [...savingsGoals, newGoal];
    await saveSavingsGoals(updatedGoals);
    setNewGoalName('');
    setNewGoalAmount('');
    Alert.alert('Éxito', `Meta "${newGoal.name}" añadida.`);
  };

  const handleAddContribution = async () => {
    if (!selectedGoalId) {
      Alert.alert('Error', 'Por favor, selecciona una meta para añadir la aportación.');
      return;
    }
    if (contributionAmount.trim() === '' || isNaN(parseFloat(contributionAmount)) || parseFloat(contributionAmount) <= 0) {
      Alert.alert('Error', 'Por favor, introduce un monto de aportación válido.');
      return;
    }

    const amountToAdd = parseFloat(contributionAmount);
    const updatedGoals = savingsGoals.map(goal => {
      if (goal.id === selectedGoalId) {
        const newCurrentAmount = goal.currentAmount + amountToAdd;
        return {
          ...goal,
          currentAmount: newCurrentAmount,
          contributions: [...goal.contributions, { amount: amountToAdd, date: new Date().toISOString() }],
        };
      }
      return goal;
    });

    await saveSavingsGoals(updatedGoals);
    setContributionAmount(''); // Limpiar el campo de aportación
    setSelectedGoalId(null); // Deseleccionar la meta
    Alert.alert('Éxito', `Aportación de ${currencySymbol}${amountToAdd.toFixed(2)} añadida.`); // Alerta con moneda

  };

  const getProgressPercentage = (goal) => {
    if (goal.targetAmount === 0) return 0;
    return ((goal.currentAmount / goal.targetAmount) * 100).toFixed(1);
  };

  const renderGoalItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.goalItem, item.id === selectedGoalId && styles.selectedGoalItem]}
      onPress={() => setSelectedGoalId(item.id)}
    >
      <Text style={styles.goalName}>{item.name}</Text>
      <Text style={styles.goalProgressText}>
        Ahorrado: {currencySymbol}{item.currentAmount.toFixed(2)} / Objetivo: {currencySymbol}{item.targetAmount.toFixed(2)}</Text>
      <View style={styles.progressBarBackground}>
        <View style={[styles.progressBarFill, { width: `${getProgressPercentage(item)}%` }]} />
      </View>
      <Text style={styles.goalPercentage}>{getProgressPercentage(item)}%</Text>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView // Ayuda a que los inputs no sean cubiertos por el teclado
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Mis Ahorros</Text>
        <Text style={styles.subtitle}>Define y gestiona tus metas de ahorro.</Text>

        {/* Sección para Añadir Nueva Meta */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Añadir Nueva Meta de Ahorro</Text>
          <TextInput
            style={styles.input}
            placeholder="Nombre de la meta (ej. Viaje a Europa)"
            value={newGoalName}
            onChangeText={setNewGoalName}
          />
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="Monto objetivo (ej. 2500)"
            value={newGoalAmount}
            onChangeText={setNewGoalAmount}
          />
          <Button title="Añadir Meta" onPress={handleAddGoal} color="#4CAF50" />
        </View>

        {/* Sección de Metas de Ahorro Existentes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tus Metas de Ahorro</Text>
          {savingsGoals.length === 0 ? (
            <Text style={styles.noGoalsText}>Aún no tienes metas de ahorro.</Text>
          ) : (
            <FlatList
              data={savingsGoals}
              renderItem={renderGoalItem}
              keyExtractor={(item) => item.id}
              style={styles.goalsList}
              scrollEnabled={false} // Para que el ScrollView padre maneje el scroll
            />
          )}
        </View>

        {/* Sección para Añadir Aportación */}
        {savingsGoals.length > 0 && ( // Solo muestra esta sección si hay metas
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Añadir Aportación</Text>
            {selectedGoalId ? (
              <Text style={styles.selectedGoalText}>
                Meta seleccionada: {savingsGoals.find(g => g.id === selectedGoalId)?.name}
              </Text>
            ) : (
              <Text style={styles.selectGoalPrompt}>Selecciona una meta de la lista superior.</Text>
            )}
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              placeholder={`Monto a aportar (ej. 50) ${currencySymbol}`}
              value={contributionAmount}
              onChangeText={setContributionAmount}
              editable={!!selectedGoalId} // Editable solo si hay una meta seleccionada
            />
            <Button
              title="Añadir Aportación"
              onPress={handleAddContribution}
              color="#2196F3"
              disabled={!selectedGoalId} // Deshabilitado si no hay meta seleccionada
            />
          </View>
        )}

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#e8f5e9',
    minHeight: '100%', // Asegura que el ScrollView ocupe toda la altura
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1b5e20',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#4caf50',
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
  noGoalsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
  },
  goalsList: {
    marginTop: 10,
  },
  goalItem: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  selectedGoalItem: {
    borderColor: '#2196F3', // Resalta la meta seleccionada
    borderWidth: 2,
    backgroundColor: '#e3f2fd',
  },
  goalName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  goalProgressText: {
    fontSize: 14,
    color: '#555',
    marginTop: 5,
  },
  progressBarBackground: {
    height: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4CAF50', // Color de progreso
    borderRadius: 5,
  },
  goalPercentage: {
    fontSize: 14,
    color: '#4CAF50',
    textAlign: 'right',
    marginTop: 5,
    fontWeight: 'bold',
  },
  selectGoalPrompt: {
    fontSize: 14,
    color: '#888',
    marginBottom: 10,
    textAlign: 'center',
  },
  selectedGoalText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 10,
    textAlign: 'center',
  },
});