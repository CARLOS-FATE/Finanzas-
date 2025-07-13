// screens/AnnualReportsScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, ActivityIndicator, Dimensions, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { PieChart } from 'react-native-chart-kit'; // <-- ¡Importa PieChart!
import { Picker } from '@react-native-picker/picker';
import { loadCurrencySymbol, getCurrencySymbol } from '../constants/currencyUtils'; // <-- ¡IMPORTA ESTO!
import AsyncStorage from '@react-native-async-storage/async-storage';
// import i18n from '../constants/i18n';

const screenWidth = Dimensions.get('window').width; // Obtener el ancho de la pantalla

export default function AnnualReportsScreen({ navigation }) {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [annualSummary, setAnnualSummary] = useState({});
  const [availableYears, setAvailableYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [chartData, setChartData] = useState([]); // <-- Nuevo estado para los datos del gráfico
  const [currencySymbol, setCurrencySymbol] = useState(getCurrencySymbol()); 


  const EXPENSES_KEY = '@myApp:expenses';

  // Función para obtener todos los gastos de AsyncStorage
  const getExpenses = async () => {
    try {
      setLoading(true);
      const storedCurrency = await loadCurrencySymbol(); // <-- Cargar moneda
      setCurrencySymbol(storedCurrency);

      const jsonValue = await AsyncStorage.getItem(EXPENSES_KEY);
      const loadedExpenses = jsonValue != null ? JSON.parse(jsonValue) : [];
      setExpenses(loadedExpenses);

      const years = new Set(loadedExpenses.map(exp => new Date(exp.date).getFullYear()));
      const sortedYears = Array.from(years).sort((a, b) => b - a).map(String);
      setAvailableYears(sortedYears.length > 0 ? sortedYears : [new Date().getFullYear().toString()]);
      if (sortedYears.length > 0 && !sortedYears.includes(selectedYear)) {
          setSelectedYear(sortedYears[0]);
      } else if (sortedYears.length === 0) {
          setSelectedYear(new Date().getFullYear().toString());
      }

    } catch (error) {
      console.error('Error al leer los gastos para reportes anuales:', error);
    } finally {
      setLoading(false);
    }
  };

  // useFocusEffect para recargar los gastos cada vez que la pantalla entra en foco
  useFocusEffect(
    useCallback(() => {
      getExpenses();
    }, [])
  );

  // useEffect para recalcular el resumen anual y los datos del gráfico
  useEffect(() => {
    if (expenses.length > 0 || availableYears.length > 0) {
      calculateAnnualSummary(expenses, parseInt(selectedYear));
    } else {
        setAnnualSummary({});
        setChartData([]); // También limpiar datos del gráfico
    }
  }, [expenses, selectedYear, availableYears]);

  // Función para calcular el resumen de gastos por categoría principal para el año seleccionado
  const calculateAnnualSummary = (allExpenses, year) => {
    const summary = {};
    let totalAnnualExpenses = 0;

    allExpenses.forEach(expense => {
      const expenseDate = new Date(expense.date);
      if (expenseDate.getFullYear() === year) {
        // Usamos mainCategory para los reportes anuales por simplicidad y visión general
        const category = expense.mainCategory; // O podrías usar expense.subCategory para un detalle anual extremo

        if (category) {
          if (summary[category]) {
            summary[category] += expense.amount;
          } else {
            summary[category] = expense.amount;
          }
          totalAnnualExpenses += expense.amount;
        }
      }
    });

    setAnnualSummary({ ...summary, totalAnnualExpenses });

    // --- Preparar datos para el gráfico de pastel ---
    const pieChartColors = [
      '#673ab7', '#D500F9', '#FF4081', '#FFC107', '#00BCD4', '#8BC34A',
      '#FF9800', '#795548', '#9E9E9E', '#607D8B', '#F44336', '#E91E63',
      '#2196F3', '#FF5722', '#607D8B', '#7C4DFF', '#3F51B5', '#009688'
    ];
    let colorIndex = 0;

    const chartDataFormatted = Object.entries(summary)
      .filter(([key, value]) => key !== 'totalAnnualExpenses' && value > 0)
      .map(([key, value]) => {
        const color = pieChartColors[colorIndex % pieChartColors.length];
        colorIndex++;
        return {
          name: key,
          population: value,
          color: color,
          legendFontColor: '#7F7F7F',
          legendFontSize: 15,
        };
      });
    setChartData(chartDataFormatted);
  };

  // Función para renderizar cada item del resumen anual
  const renderSummaryItem = ([category, amount]) => {
    if (category === 'totalAnnualExpenses') return null;

    return (
      <View key={category} style={styles.summaryItem}>
        <Text style={styles.summaryCategory}>{category}:</Text>
        <Text style={styles.summaryAmount}>{currencySymbol}{amount.toFixed(2)}</Text> {/* ¡Usar currencySymbol! */}
      </View>
    );
  };

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    decimalPlaces: 2,
  };

  return (
    <ScrollView style={styles.scrollViewContainer} contentContainerStyle={styles.container}>
      <Text style={styles.title}>Reporte Anual de Gastos</Text>
      
      {/* Selector de Año */}
      <View style={styles.pickerContainer}>
        <Text style={styles.pickerLabel}>Seleccionar Año:</Text>
        <Picker
          selectedValue={selectedYear}
          onValueChange={(itemValue) => setSelectedYear(itemValue)}
          style={styles.picker}
        >
          {availableYears.map((year) => (
            <Picker.Item key={year} label={year} value={year} />
          ))}
        </Picker>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" style={styles.loadingIndicator} />
      ) : Object.keys(annualSummary).length <= 1 && annualSummary.totalAnnualExpenses === 0 ? (
        <Text style={styles.noDataText}>No hay gastos registrados para el año {selectedYear}.</Text>
      ) : (
        <>
          {/* Gráfico de Pastel Anual */}
          {chartData.length > 0 && (
            <View style={styles.chartContainer}>
              <PieChart
                data={chartData}
                width={screenWidth - 40}
                height={220}
                chartConfig={chartConfig}
                accessor={"population"}
                backgroundColor={"transparent"}
                paddingLeft={"15"}
                absolute
              />
            </View>
          )}

          {Object.entries(annualSummary).map(renderSummaryItem)}
          <View style={styles.totalSummary}>
            <Text style={styles.totalSummaryText}>Total Gastado en {selectedYear}:</Text>
            <Text style={styles.totalSummaryAmount}>
              {currencySymbol}{annualSummary.totalAnnualExpenses ? annualSummary.totalAnnualExpenses.toFixed(2) : '0.00'} {/* ¡Usar currencySymbol! */}
            </Text>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollViewContainer: {
    flex: 1,
    backgroundColor: '#f0f4f8',
  },
  container: {
    padding: 20,
    alignItems: 'center',
    paddingBottom: 50,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#8a2be2',
    textAlign: 'center',
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  pickerLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 10,
  },
  picker: {
    flex: 1,
    height: 50,
  },
  loadingIndicator: {
    marginTop: 50,
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
    marginTop: 50,
    textAlign: 'center',
  },
  chartContainer: { // Nuevo estilo para el contenedor del gráfico
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 5,
    borderLeftColor: '#9c27b0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  summaryCategory: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#d32f2f',
  },
  totalSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
    padding: 20,
    borderRadius: 10,
    backgroundColor: '#ede7f6',
    borderWidth: 2,
    borderColor: '#673ab7',
  },
  totalSummaryText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4527a0',
  },
  totalSummaryAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#d32f2f',
  },
});