// screens/SettingsScreen.js
import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, Button, FlatList, ActivityIndicator, ScrollView, Alert, TouchableOpacity, Modal, TextInput, Platform } from 'react-native'; 
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { CURRENCY_OPTIONS, DEFAULT_CURRENCY_SYMBOL, CURRENCY_KEY } from '../constants/currency';
import { Picker } from '@react-native-picker/picker';

export default function SettingsScreen({ navigation }) {
  const [selectedCurrency, setSelectedCurrency] = useState(DEFAULT_CURRENCY_SYMBOL);

  // Cargar la moneda guardada al enfocar la pantalla
  const loadCurrency = async () => {
    try {
      const storedCurrency = await AsyncStorage.getItem(CURRENCY_KEY);
      if (storedCurrency !== null) {
        setSelectedCurrency(storedCurrency);
      } else {
        setSelectedCurrency(DEFAULT_CURRENCY_SYMBOL);
      }
    } catch (error) {
      console.error('Error al cargar la moneda:', error);
      Alert.alert('Error', 'No se pudo cargar la preferencia de moneda.');
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadCurrency();
    }, [])
  );

  // Guardar la moneda seleccionada
  const handleSaveCurrency = async (currencyValue) => {
    try {
      await AsyncStorage.setItem(CURRENCY_KEY, currencyValue);
      setSelectedCurrency(currencyValue);
      Alert.alert('Configuración Guardada', `La moneda se ha cambiado a ${currencyValue}`);
    } catch (error) {
      console.error('Error al guardar la moneda:', error);
      Alert.alert('Error', 'No se pudo guardar la preferencia de moneda.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Configuración</Text>
      <Text style={styles.subtitle}>Personaliza tu aplicación.</Text>

      {/* Selector de Moneda */}
      <View style={styles.settingGroup}>
        <Text style={styles.label}>Símbolo de Moneda:</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedCurrency}
            onValueChange={(itemValue) => handleSaveCurrency(itemValue)} // Guarda directamente al cambiar
            style={styles.picker}
          >
            {CURRENCY_OPTIONS.map((option) => (
              <Picker.Item key={option.value} label={option.label} value={option.value} />
            ))}
          </Picker>
        </View>
      </View>

      {/* Puedes añadir más opciones de configuración aquí */}

      <View style={{ marginTop: 30 }}>
        <Button
          title="Volver a Inicio"
          onPress={() => navigation.navigate('HomeTab')}
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
    backgroundColor: '#f8f8f8',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  settingGroup: {
    width: '100%',
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    marginBottom: 10,
    color: '#333',
    fontWeight: 'bold',
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