# PRD: Implementación de Barras de Navegación

**Status:** Done
**Autor:** Gemini
**Fecha:** 2025-07-24

---

## 1. Antecedentes

La aplicación carece de una estructura de navegación consistente y centralizada. Las páginas actuales (`Index` y `GroupDetail`) gestionan sus propios encabezados y acciones de forma aislada. Esto resulta en una experiencia de usuario fragmentada, código duplicado para los layouts y la ausencia de elementos globales persistentes, como la identidad del usuario y la opción de cerrar sesión.

El objetivo de este documento es definir los requisitos para implementar un sistema de barras de navegación (navbars) que sea intuitivo, contextual y que mejore la estructura general de la aplicación.

## 2. Objetivos

- **Mejorar la Experiencia de Usuario (UX):** Proveer una navegación clara y predecible.
- **Centralizar Acciones:** Agrupar las acciones globales y contextuales en lugares lógicos y consistentes.
- **Reducir Duplicación de Código:** Crear componentes de layout y navegación reutilizables.
- **Establecer Jerarquía Visual:** Separar claramente la navegación principal del contenido específico de cada página.

## 3. Alcance y Características

### 3.1. Feature: Navbar Global (Página Principal)

Se implementará una barra de navegación principal que será visible **únicamente en la página de inicio (`/`)**.

**Wireframe:**
```
+--------------------------------------------------------------------------+
| Residencial Guardian Tracker      [Bienvenido, user@email.com ▼] (Logout)|
+--------------------------------------------------------------------------+
```

**Requisitos:**
- **Componente:** `GlobalNavbar.tsx`.
- **Lado Izquierdo:**
    - Mostrará el nombre de la aplicación: "Residencial Guardian Tracker".
    - Este elemento deberá ser un enlace que redirija siempre a la ruta `/`.
- **Lado Derecho:**
    - Mostrará un menú desplegable (`DropdownMenu` de shadcn/ui).
    - El texto del trigger del menú será el email del usuario logueado (ej: `user@email.com`).
    - El menú contendrá una única opción: "Cerrar Sesión".
    - La información del usuario se obtendrá del `AuthContext`.

### 3.2. Feature: Navbar Contextual (Detalle de Agrupación)

Se implementará una barra de navegación contextual que será visible **únicamente en la página de detalle de una agrupación (`/groups/:id`)**. Esta navbar reemplazará por completo la cabecera que existe actualmente en esa página.

**Wireframe:**
```
+--------------------------------------------------------------------------------------------------+
| [< Volver]  Agrupación: Contratistas A                             [Exportar] [Editar]           |
|             Período: 01/08/2025 - 31/08/2025                                                     |
+--------------------------------------------------------------------------------------------------+
```

**Requisitos:**
- **Componente:** `GroupDetailNavbar.tsx`.
- **Contenido:**
    - **Botón de Volver:** Un botón con estilo secundario a la izquierda con el texto `[< Volver]` que redirigirá a la ruta `/`.
    - **Información de la Agrupación:**
        - Nombre de la agrupación (ej: "Agrupación: Contratistas A").
        - Período de la agrupación (ej: "Período: 01/08/2025 - 31/08/2025").
    - **Acciones Contextuales:**
        - Botón primario `[Exportar]`.
        - Botón secundario `[Editar]`.
- **Comportamiento:**
    - Este componente recibirá la información de la agrupación (`group`) y los manejadores de eventos (`onExport`, `onEdit`) como props desde la página `GroupDetail.tsx`.
    - **No contendrá** el menú de usuario ni la opción de cerrar sesión.

## 4. Plan de Implementación

**Paso 1: Crear Archivos de Componentes**
- Crear el directorio `src/components/layout`.
- Crear el archivo `src/components/layout/MainLayout.tsx`.
- Crear el directorio `src/components/navbars`.
- Crear el archivo `src/components/navbars/GlobalNavbar.tsx`.
- Crear el archivo `src/components/navbars/GroupDetailNavbar.tsx`.

**Paso 2: Implementar `GlobalNavbar.tsx`**
- Construir la UI utilizando componentes de `shadcn/ui`.
- Integrar `DropdownMenu` para las acciones de usuario.
- Usar el hook `useAuth` para obtener el email del usuario y la función `signOut`.
- Implementar el enlace al home (`/`).

**Paso 3: Implementar `GroupDetailNavbar.tsx`**
- Construir la UI con los elementos definidos (botón de volver, textos, botones de acción).
- Definir las `props` que recibirá el componente: `group: Group`, `onExport: () => void`, `onEdit: () => void`.
- Usar el componente `Link` de `react-router-dom` para el botón "Volver".

**Paso 4: Implementar `MainLayout.tsx`**
- Este será un componente wrapper simple.
- Renderizará `<GlobalNavbar />` en la parte superior.
- Renderizará la prop `{children}` debajo de la navbar, dentro de una etiqueta `<main>`.

**Paso 5: Refactorizar Rutas en `App.tsx`**
- Envolver la ruta principal (`/`) con el nuevo `MainLayout` para que muestre la `GlobalNavbar`.
- La ruta de detalle (`/groups/:id`) **no** usará este layout, ya que gestionará su propia navbar contextual.

**Paso 6: Refactorizar `Index.tsx`**
- Eliminar el `div` contenedor principal y el `header` actual.
- La página ahora será renderizada a través del `Outlet` de `react-router-dom` dentro de `MainLayout`.

**Paso 7: Refactorizar `GroupDetail.tsx`**
- Eliminar por completo el elemento `<header>` que actualmente contiene el enlace de volver, el título y los botones de acción.
- En el método `render` del componente, renderizar `<GroupDetailNavbar />` en la parte superior.
- Pasar las props requeridas a `<GroupDetailNavbar />`: el objeto `group` y las funciones `handleExportToExcel` y el handler para abrir el diálogo de edición.
