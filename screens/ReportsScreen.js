// screens/ReportsScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, ActivityIndicator, Dimensions, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { PRIMARY_EXPENSE_CATEGORIES, ALL_SUBCATEGORIES, EXPENSE_CATEGORIES } from '../constants/categories'; // Asegúrate de importar EXPENSE_CATEGORIES
import { PieChart } from 'react-native-chart-kit'; // <-- ¡Importa PieChart!
import { Picker } from '@react-native-picker/picker';
import { loadCurrencySymbol, getCurrencySymbol } from '../constants/currencyUtils'; // <-- ¡IMPORTA ESTO!
import AsyncStorage from '@react-native-async-storage/async-storage';
// import i18n from '../constants/i18n';

const screenWidth = Dimensions.get('window').width; // Obtener el ancho de la pantalla

export default function ReportsScreen({ navigation }) {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [monthlySummary, setMonthlySummary] = useState({});
  const [currentMonthYear, setCurrentMonthYear] = useState('');
  const [reportView, setReportView] = useState('mainCategory'); // 'mainCategory' o 'subCategory'
  const [chartData, setChartData] = useState([]); // <-- Nuevo estado para los datos del gráfico
  const [currencySymbol, setCurrencySymbol] = useState(getCurrencySymbol());


  const EXPENSES_KEY = '@myApp:expenses'; // Definir la clave para que sea consistente

  // Función para obtener todos los gastos de AsyncStorage
  const getExpenses = async () => {
    try {
      setLoading(true);

      const storedCurrency = await loadCurrencySymbol(); // <-- Cargar moneda
      setCurrencySymbol(storedCurrency);

      const jsonValue = await AsyncStorage.getItem(EXPENSES_KEY); // Usar la clave definida
      const loadedExpenses = jsonValue != null ? JSON.parse(jsonValue) : [];
      setExpenses(loadedExpenses);
    } catch (error) {
      console.error('Error al leer los gastos para reportes:', error);
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

  // useEffect para recalcular el resumen mensual y los datos del gráfico
  useEffect(() => {
    calculateMonthlySummary(expenses, reportView);
  }, [expenses, reportView]); // Se ejecuta cada vez que 'expenses' o 'reportView' cambian

  // Función para calcular el resumen de gastos por categoría principal o subcategoría para el mes actual
  const calculateMonthlySummary = (allExpenses, viewType) => {
    const now = new Date();
    const currentMonth = now.getMonth(); // 0-11
    const currentYear = now.getFullYear();

    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    setCurrentMonthYear(`${monthNames[currentMonth]} ${currentYear}`);

    const summary = {};
    let totalOverallExpenses = 0;

    allExpenses.forEach(expense => {
      const expenseDate = new Date(expense.date);
      if (expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear) {
        const groupKey = viewType === 'mainCategory' ? expense.mainCategory : expense.subCategory;

        if (groupKey) {
          if (summary[groupKey]) {
            summary[groupKey] += expense.amount;
          } else {
            summary[groupKey] = expense.amount;
          }
          totalOverallExpenses += expense.amount;
        }
      }
    });

    setMonthlySummary({ ...summary, totalOverallExpenses });

    // --- Preparar datos para el gráfico de pastel ---
    const pieChartColors = [
      '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40',
      '#FFCD56', '#C9CBCF', '#7E57C2', '#BDBDBD', '#4DB6AC', '#FF8A65',
      '#64B5F6', '#81C784', '#FFD54F', '#A1887F', '#E0E0E0', '#BA68C8'
    ];
    let colorIndex = 0;

    const chartDataFormatted = Object.entries(summary)
      .filter(([key, value]) => key !== 'totalOverallExpenses' && value > 0) // Asegurarse de que no sea el total y el valor sea > 0
      .map(([key, value]) => {
        const color = pieChartColors[colorIndex % pieChartColors.length];
        colorIndex++;
        return {
          name: key,
          population: value, // 'population' es lo que usa PieChart para el valor
          color: color,
          legendFontColor: '#7F7F7F',
          legendFontSize: 15,
        };
      });
    setChartData(chartDataFormatted);
  };

  // Función para renderizar cada item del resumen
  const renderSummaryItem = ([key, amount]) => {
    if (key === 'totalOverallExpenses') return null;

    return (
      <View key={key} style={styles.summaryItem}>
        <Text style={styles.summaryCategory}>{key}:</Text>
        <Text style={styles.summaryAmount}>{currencySymbol}{amount.toFixed(2)}</Text> 
      </View>
    );
  };

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    decimalPlaces: 2, // opcional, para el formato de números
  };

  return (
    <ScrollView style={styles.scrollViewContainer} contentContainerStyle={styles.container}>
      <Text style={styles.title}>Reporte Mensual de Gastos</Text>
      <Text style={styles.subtitle}>Resumen de {currentMonthYear}</Text>

      {/* Selector de Vista (Categoría Principal / Subcategoría) */}
      <View style={styles.pickerContainer}>
        <Text style={styles.pickerLabel}>Ver por:</Text>
        <Picker
          selectedValue={reportView}
          onValueChange={(itemValue) => setReportView(itemValue)}
          style={styles.picker}
        >
          <Picker.Item label="Categoría Principal" value="mainCategory" />
          <Picker.Item label="Subcategoría" value="subCategory" />
        </Picker>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" style={styles.loadingIndicator} />
      ) : Object.keys(monthlySummary).length <= 1 && monthlySummary.totalOverallExpenses === 0 ? (
        <Text style={styles.noDataText}>No hay gastos registrados para este mes.</Text>
      ) : (
        <>
          {/* Gráfico de Pastel */}
          {chartData.length > 0 && ( // Solo renderiza si hay datos para el gráfico
            <View style={styles.chartContainer}>
              <PieChart
                data={chartData}
                width={screenWidth - 40} // Ancho del gráfico (ancho de pantalla - padding)
                height={220} // Altura del gráfico
                chartConfig={chartConfig}
                accessor={"population"} // Propiedad que representa el valor en tus datos
                backgroundColor={"transparent"}
                paddingLeft={"15"} // Un poco de padding para que las etiquetas no se corten
                absolute // Muestra los valores absolutos en la leyenda
              />
            </View>
          )}

          {Object.entries(monthlySummary).map(renderSummaryItem)}
          <View style={styles.totalSummary}>
            <Text style={styles.totalSummaryText}>Total Gastado:</Text>
            <Text style={styles.totalSummaryAmount}>
              {currencySymbol}{monthlySummary.totalOverallExpenses ? monthlySummary.totalOverallExpenses.toFixed(2) : '0.00'} {/* ¡Usar currencySymbol! */}
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
    marginBottom: 10,
    color: '#1a237e',
  },
  subtitle: {
    fontSize: 20,
    color: '#3f51b5',
    marginBottom: 30,
    fontWeight: '600',
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
    borderLeftColor: '#42a5f5',
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
    backgroundColor: '#e3f2fd',
    borderWidth: 2,
    borderColor: '#2196f3',
  },
  totalSummaryText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a237e',
  },
  totalSummaryAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#d32f2f',
  },
});