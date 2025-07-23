# PRD: Mejoras en la Página de Detalle de Agrupación

*   **Autor:** Gemini Assistant
*   **Fecha:** 17 de Julio de 2025
*   **Estado:** Propuesto

## 1. Resumen

La página actual de "Detalle de Agrupación" (`GroupDetail.tsx`) es funcional, pero su arquitectura de información y diseño de interfaz pueden ser optimizados para mejorar la claridad y la eficiencia del flujo de trabajo. La disposición actual de los elementos, como el formulario de creación, el resumen financiero y las acciones, puede resultar caótica y requiere que el usuario haga scroll para acceder a información clave.

Este documento describe una serie de mejoras planificadas para transformar esta página en un panel de control más intuitivo y organizado, mejorando tanto la experiencia del usuario (UI/UX) como la arquitectura del código subyacente.

## 2. Objetivos

*   **Mejorar la Usabilidad:** Reorganizar la interfaz para que sea más intuitiva, reduciendo la carga cognitiva del usuario y haciendo que las acciones comunes sean más accesibles.
*   **Optimizar el Flujo de Trabajo:** Centralizar y contextualizar las acciones (añadir, eliminar, editar, exportar) para que el usuario pueda realizar sus tareas de manera más rápida y eficiente.
*   **Incrementar la Claridad Visual:** Reducir el desorden visual moviendo elementos secundarios (como formularios) a diálogos modales y agrupando la información de manera lógica.
*   **Mejorar la Mantenibilidad del Código:** Refactorizar la lógica de negocio compleja (como la exportación a Excel) para separarla de la capa de presentación, haciendo el código del componente más limpio y fácil de mantener.

## 3. Requisitos Funcionales

1.  **Encabezado Multifuncional:**
    *   El encabezado de la página mostrará el nombre y el período de la agrupación a la izquierda.
    *   A la derecha del encabezado, se ubicarán los botones de acción globales: "Exportar a Excel" (como acción primaria) y "Editar Agrupación" (como acción secundaria).

2.  **Edición de Agrupación en Modal:**
    *   El botón "Editar Agrupación" abrirá un diálogo modal.
    *   Este modal contendrá un formulario para modificar el nombre, las fechas de inicio/fin y el precio por noche de la agrupación.

3.  **Calendario de Hospedaje Centralizado:**
    *   El calendario será el componente principal dentro de una `Card` dedicada.
    *   La funcionalidad de "Selección Masiva" se integrará dentro de esta `Card`, como un panel colapsable ubicado justo encima de la tabla.

4.  **Acciones Integradas en la Tabla:**
    *   **Añadir Trabajador:** Se eliminará el formulario estático. En su lugar, la última fila de la tabla del calendario será una celda expandida con el texto `[ + Añadir nuevo trabajador... ]`. Al hacer clic, se abrirá un diálogo modal con el formulario para añadir un nuevo trabajador.
    *   **Eliminar Trabajador:** Cada fila de trabajador tendrá un ícono de papelera (`Trash2`) en la última columna. El encabezado de esta columna será eliminado. Al hacer clic en el ícono, se deberá mostrar un diálogo de confirmación antes de proceder con la eliminación.

5.  **Resumen Financiero al Final:**
    *   El componente que muestra el "Resumen Financiero" (total de días, neto, IVA, total a pagar) se moverá al final de la página, después de la `Card` del calendario.

6.  **Refactorización de Lógica de Exportación:**
    *   Toda la lógica para generar el archivo Excel (`handleExportToExcel`) será extraída del componente `GroupDetail.tsx` y movida a un módulo independiente en `src/lib/excel-export.ts`.

## 4. Plan de Implementación y Prioridades

La implementación se dividirá en fases para asegurar un desarrollo ordenado y incremental.

*   **Prioridad 1: Refactorización y Estructura Base (Bajo Riesgo, Alto Impacto en Mantenibilidad)**
    1.  **Extraer Lógica de Excel:** Crear `src/lib/excel-export.ts` y mover la función `handleExportToExcel`. Reemplazar la lógica en `GroupDetail.tsx` con una simple llamada a la nueva función.
    2.  **Reestructurar Layout:** Modificar `GroupDetail.tsx` para crear la nueva disposición: mover el resumen financiero al final y rediseñar el encabezado para incluir los botones "Exportar" y "Editar".

*   **Prioridad 2: Implementación de Funcionalidad Principal (Alto Impacto en UX)**
    3.  **Modal de Edición de Agrupación:** Implementar el flujo de edición del grupo a través de un diálogo modal.
    4.  **Modal de Añadir Trabajador:** Reemplazar el `WorkerForm` estático por el disparador en la última fila de la tabla que abre un `WorkerFormDialog`.
    5.  **Verificar Flujo de Eliminación:** Asegurarse de que el botón de eliminar en cada fila funciona y muestra un diálogo de confirmación.

*   **Prioridad 3: Funcionalidad Secundaria y Mejoras**
    6.  **Panel de Selección Masiva:** Re-implementar la funcionalidad de selección masiva como un panel colapsable dentro de la `Card` del calendario.

## 5. Wireframe de Referencia

`
+------------------------------------------------------------------------------------------------+
| < [Volver a Período]                                                                           |
|                                                                                                |
| +------------------------------------------------------+ +-----------------------------------+ |
| | AGRUPACIÓN: CIMA CAMINO 1                            | | [ > Exportar a Excel ] [ ⚙️ Editar ] | |
| | Período: 01/07/2025 - 21/07/2025                     | |                                   | |
| +------------------------------------------------------+ +-----------------------------------+ |
+------------------------------------------------------------------------------------------------+
|                                                                                                |
| +--------------------------------------------------------------------------------------------+ |
| |  Calendario de Hospedaje                                                                   | |
| | +----------------------------------------------------------------------------------------+ |
| | | [ 📅 Selección Masiva ]                                                                | |
| | |  (Al hacer clic, se expande un panel para seleccionar rango de fechas y trabajadores)  | |
| | |----------------------------------------------------------------------------------------| |
| | | Trabajador  | Cargo     | Faena     | 01 | 02 | 03 | ... | Total |      |               |
| | |-------------|-----------|-----------|----|----|----|-----|-------|------|               |
| | | Juan Pérez  | Maestro   | Minera A  | X  | X  |    | ... |   15  | [🗑️] |               |
| | | Ana García  | Ayudante  | Minera B  |    | X  | X  | ... |   17  | [🗑️] |               |
| | | ...         | ...       | ...       |    |    |    | ... |  ...  | [🗑️] |               |
| | |-------------|-----------|-----------|----|----|----|-----|-------|------|               |
| | | [ + Añadir nuevo trabajador... ]                                                       | |
| | +----------------------------------------------------------------------------------------+ |
| +--------------------------------------------------------------------------------------------+ |
|                                                                                                |
| +--------------------------------------------------------------------------------------------+ |
| |  Resumen Financiero                                                                        | |
| | +----------------------------------------------------------------------------------------+ |
| | | Total Días: 32   | Total Neto:   $800.000 | IVA (19%): $152.000 | Total a Pagar: $952.000 | |
| | +----------------------------------------------------------------------------------------+ |
+--------------------------------------------------------------------------------------------+
`
