// App.js
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';

// Importa tus pantallas
import HomeScreen from './screens/HomeScreen';
import AddExpenseScreen from './screens/AddExpenseScreen';
import SavingsScreen from './screens/SavingsScreen';
import ReportsScreen from './screens/ReportsScreen';
import AnnualReportsScreen from './screens/AnnualReportsScreen';
import BudgetsScreen from './screens/BudgetsScreen';
import SettingsScreen from './screens/SettingsScreen'; // <-- ¡IMPORTA LA NUEVA PANTALLA!

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#007bff',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          height: 60,
          paddingBottom: 5,
        },
        tabBarLabelStyle: {
          fontSize: 12,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'HomeTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'AddExpenseTab') {
            iconName = focused ? 'add-circle' : 'add-circle-outline';
          } else if (route.name === 'SavingsTab') {
            iconName = focused ? 'wallet' : 'wallet-outline';
          } else if (route.name === 'ReportsTab') {
            iconName = focused ? 'stats-chart' : 'stats-chart-outline';
          } else if (route.name === 'AnnualReportsTab') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'BudgetsTab') {
            iconName = focused ? 'cash' : 'cash-outline';
          } else if (route.name === 'SettingsTab') { 
            iconName = focused ? 'settings' : 'settings-outline';
          }

         return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          title: 'Inicio',
        }}
      />
      <Tab.Screen
        name="AddExpenseTab"
        component={AddExpenseScreen}
        options={{
          title: 'Añadir Gasto',
        }}
      />
      <Tab.Screen
        name="SavingsTab"
        component={SavingsScreen}
        options={{
          title: 'Ahorros',
        }}
      />
      <Tab.Screen
        name="ReportsTab"
        component={ReportsScreen}
        options={{
          title: 'Mensual',
        }}
      />
      <Tab.Screen
        name="AnnualReportsTab"
        component={AnnualReportsScreen}
        options={{
          title: 'Anual',
        }}
      />
      <Tab.Screen
        name="BudgetsTab"
        component={BudgetsScreen}
        options={{
          title: 'Presupuestos',
        }}
      />
      <Tab.Screen // <-- ¡AÑADE LA NUEVA PESTAÑA!
        name="SettingsTab"
        component={SettingsScreen}
        options={{
          title: 'Ajustes',
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="Main"
          component={MainTabs}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({});