# Finanzas- 💰

## App para contabilizar tus finanzas
---

### Descripción General

"Finanzas-" es una aplicación móvil desarrollada con React Native diseñada para ayudarte a llevar un control preciso y eficiente de tus ingresos y gastos. Con una interfaz intuitiva, podrás registrar tus transacciones diarias, categorizarlas y visualizar el estado de tu economía personal o familiar de forma clara.

---

### Características Principales

* **Registro de Transacciones:** Añade fácilmente tus ingresos y gastos con detalles como monto, fecha y descripción.
* **Categorización Personalizable:** Organiza tus transacciones por categorías (e.g., comida, transporte, salario, entretenimiento) para un análisis más detallado.
* **Resumen Financiero:** Obtén una visión general de tu saldo actual y el flujo de efectivo.
* **Interfaz Intuitiva:** Diseño limpio y fácil de usar para una experiencia de usuario fluida.
* **Multiplataforma:** Desarrollada con React Native, lo que permite su uso tanto en dispositivos Android como iOS.

---

### Tecnologías Utilizadas

* **React Native:** Framework para el desarrollo de aplicaciones móviles multiplataforma.
* **[Menciona otras librerías/tecnologías si las usas, por ejemplo:]**
    * `React Navigation`: Para la navegación entre pantallas.
    * `Expo`: Si estás usando el ecosistema de Expo para el desarrollo.
    * `AsyncStorage` o `SQLite` o `Realm`: Para almacenamiento de datos local.
    * `Chart.js` o `Victory Native`: Para gráficos de visualización de datos.

---

### Requisitos Previos

Antes de ejecutar este proyecto localmente, asegúrate de tener instalado lo siguiente:

* **Node.js** (versión recomendada: LTS)
* **npm** o **Yarn**
* **Expo CLI** (si estás usando Expo) o **React Native CLI**
    * `npm install -g expo-cli` (para Expo)
    * `npm install -g react-native-cli` (para CLI puro)
* **Android Studio** / **Xcode** (para emuladores o dispositivos físicos)

---

### Cómo Configurar y Ejecutar el Proyecto

Sigue estos pasos para poner en marcha el proyecto en tu máquina local:

1.  **Clona el repositorio:**
    ```bash
    git clone [https://github.com/CARLOS-FATE/Finanzas-.git](https://github.com/CARLOS-FATE/Finanzas-.git)
    ```
2.  **Navega al directorio del proyecto:**
    ```bash
    cd Finanzas- # o el nombre de tu carpeta de proyecto dentro de Finanzas-
    ```
    *(Asegúrate de que tus archivos de React Native estén directamente en la raíz de `Finanzas-` o ajusta esta ruta si están en una subcarpeta como `AppGastosHibrida`)*
3.  **Instala las dependencias:**
    ```bash
    npm install
    # o si usas Yarn
    # yarn install
    ```
4.  **Ejecuta la aplicación:**

    * **Usando Expo (recomendado para empezar):**
        ```bash
        npm start
        # o
        # expo start
        ```
        Esto abrirá un panel en tu navegador. Puedes escanear el código QR con la app de Expo Go en tu teléfono o abrirlo en un emulador/simulador.

    * **Usando React Native CLI (para ejecutar en emuladores/dispositivos directamente):**
        ```bash
        npx react-native run-android
        # o
        npx react-native run-ios
        ```
        (Necesitarás tener configurados los emuladores o dispositivos conectados.)

---

### Estructura del Proyecto
