# 🎫 Sistema de Tickets - Push HR Spa

[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

Una plataforma moderna, segura y de alto rendimiento diseñada específicamente para la gestión de soporte técnico interno en **Push HR Spa**. Este sistema optimiza el flujo de resolución de incidencias mediante una arquitectura modular escalable y una experiencia de usuario de nivel premium.

## ✨ Características Principales

### 🔐 Autenticación Robusta y Flexible
- **Multi-método de Acceso**: Soporte para correo/contraseña tradicional, **Microsoft 365 OAuth** (Entra ID) y **Magic Links** (acceso sin clave vía email).
- **Onboarding Automatizado**: Registro simplificado con creación automática de perfiles mediante metadatos de usuario.
- **Seguridad Corporativa**: Validación obligatoria de dominio corporativo (`@pushhr.cl`) y verificación de cuenta por correo electrónico.

### 🎫 Gestión Inteligente de Tickets
- **Panel de Control (Dashboard)**: Analíticas en tiempo real con gráficos dinámicos de estado y prioridad integrados con `Chart.js`.
- **RBAC (Control de Acceso basado en Roles)**: Permisos granulares para Administradores, Técnicos y Usuarios finales.
- **Sincronización en Tiempo Real**: Actualizaciones instantáneas bidireccionales mediante Supabase Realtime (CDC).
- **UI Optimista**: Cambios inmediatos en la interfaz para chats y actualizaciones de estado, eliminando tiempos de espera percibidos.

### 🎨 Interfaz de Usuario Premium
- **Estética Moderna**: Diseño basado en Glassmorphism, fondos desenfocados y micro-animaciones fluidas.
- **Totalmente Responsivo**: Experiencia optimizada para dispositivos móviles, tablets y escritorio.
- **Interacción Enriquecida**: Historial de actividad humanizado, sistema de notificaciones en tiempo real y navegación intuitiva.

## 🛠️ Stack Tecnológico

- **Frontend**: React 18 (Vite)
- **Gestión de Estado**: React Context API
- **Backend & Base de Datos**: Supabase (PostgreSQL)
- **Tiempo Real**: Supabase Realtime engine
- **Gráficos**: Chart.js & React-chartjs-2
- **Estilos**: Vanilla CSS con sistema de diseño modular personalizado
- **Iconografía**: Sistema de activos SVG optimizado

## 🚀 Guía de Instalación

### Requisitos Previos
- Node.js (v18.x o superior)
- npm o yarn
- Una cuenta activa en Supabase

### Pasos para Configuración Local

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/tu-usuario/sistema-tickets-push.git
   cd sistema-tickets-push
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Variables de Entorno**
   Cree un archivo `.env` en la raíz del proyecto y configure sus credenciales de Supabase:
   ```env
   VITE_SUPABASE_URL=tu_url_de_supabase
   VITE_SUPABASE_ANON_KEY=tu_clave_anon_de_supabase
   ```

4. **Ejecutar en Desarrollo**
   ```bash
   npm run dev
   ```

## 📂 Estructura del Proyecto

```text
src/
├── assets/          # Iconos SVG y recursos estáticos
├── components/      # Componentes UI reutilizables (Sidebar, Topbar, Badges)
├── context/         # Proveedores de estado (Auth, Data, Toast, Notifications)
├── pages/           # Vistas principales de la aplicación
├── services/        # Configuración del cliente Supabase
├── styles/          # Sistema de estilos CSS modular
└── utils/           # Clases de utilidad y formateadores de datos
```

## �️ Seguridad y Buenas Prácticas
- **Protección RLS**: Políticas de seguridad a nivel de fila activas en Supabase para proteger los datos.
- **Validación de Datos**: Limpieza y validación de entradas tanto en cliente como en servidor.
- **Arquitectura Modular**: Código desacoplado para facilitar el mantenimiento y la escalabilidad.

---
Desarrollado con profesionalismo para **Push HR Spa** 🚀
