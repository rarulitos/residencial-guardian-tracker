# Residencial Guardian Tracker

> Una aplicación web para la gestión y seguimiento de hospedaje de trabajadores, diseñada para simplificar la facturación y el control de estadías.

![Residencial Guardian Tracker Screenshot](https://via.placeholder.com/800x450.png?text=Añade+una+captura+de+pantalla+de+tu+app)
*Reemplaza la imagen de arriba con una captura de pantalla real de la aplicación.*

---

## 🎯 Acerca del Proyecto

**Residencial Guardian Tracker** nace de la necesidad de llevar un control preciso y centralizado de los días que los trabajadores de distintas agrupaciones (como contratistas) se hospedan en una residencial. La aplicación permite crear períodos de facturación mensuales, gestionar agrupaciones, añadir trabajadores y marcar sus días de estadía en un calendario interactivo.

El sistema calcula automáticamente los totales a pagar, incluyendo el IVA, y permite exportar reportes detallados en formato Excel, agilizando drásticamente el proceso de facturación.

---

## ✨ Características Principales

- **🔐 Autenticación de Usuarios:** Sistema de inicio y cierre de sesión seguro gestionado con Supabase.
- **📅 Gestión de Períodos de Facturación:** Crea y navega entre períodos mensuales (ej: Agosto 2025, Septiembre 2025).
- **👥 Administración de Agrupaciones:** Crea, edita y elimina agrupaciones de trabajadores dentro de cada período (ej: "Contratistas Cima").
- **👷‍♂️ Control de Trabajadores:** Añade y elimina trabajadores fácilmente de cada agrupación.
- **🗓️ Calendario de Hospedaje Interactivo:** Marca los días de hospedaje de cada trabajador con un solo clic. Los cambios se guardan automáticamente.
- **📊 Cálculos Financieros Automáticos:** El sistema calcula en tiempo real el total de noches, el neto, el IVA (19%) y el total a pagar.
- **📄 Exportación a Excel:** Genera un reporte detallado en formato `.xlsx` con el desglose de días y el resumen financiero, listo para ser enviado.
- **📱 Diseño Responsivo:** Interfaz clara y funcional tanto en escritorio como en dispositivos móviles.

---

## 🛠️ Stack Tecnológico

- **Frontend:** [React](https://reactjs.org/), [Vite](https://vitejs.dev/), [TypeScript](https://www.typescriptlang.org/)
- **UI/Estilos:** [Tailwind CSS](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/)
- **Backend & Base de Datos:** [Supabase](https://supabase.io/) (PostgreSQL, Auth, APIs)
- **Routing:** [React Router](https://reactrouter.com/)
- **Gestión de Estado:** React Hooks & Context API
- **Linting:** [ESLint](https://eslint.org/)

---

## 🚀 Cómo Empezar

Sigue estos pasos para configurar y ejecutar el proyecto en tu entorno local.

### Prerrequisitos

- [Node.js](https://nodejs.org/) (versión 18 o superior)
- [npm](https://www.npmjs.com/) (generalmente se instala con Node.js)
- Una cuenta de [Supabase](https://supabase.com/) para crear tu proyecto de backend.

### Instalación y Configuración

1.  **Clona el repositorio:**
    ```bash
    git clone https://github.com/tu-usuario/residencial-guardian-tracker.git
    cd residencial-guardian-tracker
    ```

2.  **Instala las dependencias del proyecto:**
    ```bash
    npm install
    ```

3.  **Configura las variables de entorno de Supabase:**
    - Crea un archivo `.env` en la raíz del proyecto. Puedes duplicar el archivo de ejemplo si existe: `cp .env.example .env`.
    - Añade las siguientes variables a tu archivo `.env`:

      ```env
      VITE_SUPABASE_URL="TU_PROJECT_URL_DE_SUPABASE"
      VITE_SUPABASE_ANON_KEY="TU_ANON_KEY_DE_SUPABASE"
      ```

    - Puedes encontrar estas claves en tu panel de Supabase, en la sección **Project Settings > API**.

4.  **Ejecuta las migraciones en tu base de datos de Supabase:**
    - Asegúrate de tener el [Supabase CLI](https://supabase.com/docs/guides/cli) instalado.
    - Conéctate a tu proyecto: `supabase login` y luego `supabase link --project-ref TU_ID_DE_PROYECTO`.
    - Aplica las migraciones: `supabase db push`.

### Ejecutar la Aplicación

Una vez completada la configuración, inicia el servidor de desarrollo:

```bash
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173) (o el puerto que indique la consola) en tu navegador para ver la aplicación en funcionamiento.

---

## 📂 Estructura del Proyecto

```
/
├── supabase/               # Migraciones y configuración de Supabase
├── src/
│   ├── assets/             # Archivos estáticos (imágenes, etc.)
│   ├── components/         # Componentes reutilizables de React (UI, layout, etc.)
│   ├── contexts/           # React Contexts (ej: AuthContext)
│   ├── hooks/              # Hooks personalizados (ej: useDatabase)
│   ├── integrations/       # Integraciones con servicios de terceros (Supabase client)
│   ├── lib/                # Funciones de utilidad y lógica auxiliar (ej: exportar a Excel)
│   ├── pages/              # Componentes que representan las páginas de la aplicación
│   └── types/              # Definiciones de tipos de TypeScript
├── .env                    # Variables de entorno (local, no versionado)
├── package.json            # Dependencias y scripts del proyecto
└── README.md               # Este archivo
```