# PRD: Funcionalidad de Envío de Reportes por Correo

**Status:** Por Hacer
**Autor:** Gemini
**Fecha:** 2025-07-24

---

## 1. Antecedentes

Actualmente, la aplicación permite a los usuarios generar y descargar un reporte de facturación en formato Excel desde la página de detalle de una agrupación. Aunque esta funcionalidad es útil, el proceso para compartir este reporte es manual: el usuario debe descargar el archivo, abrir su cliente de correo, redactar un nuevo mensaje y adjuntar el archivo manualmente.

Este proceso es propenso a errores, consume tiempo y no ofrece una experiencia de usuario fluida e integrada. El objetivo de esta nueva funcionalidad es permitir a los usuarios enviar el reporte de Excel directamente desde la aplicación.

## 2. Objetivos

- **Mejorar la Eficiencia:** Eliminar los pasos manuales de descarga y envío de correos, permitiendo a los usuarios compartir reportes con un par de clics.
- **Centralizar la Funcionalidad:** Mantener al usuario dentro de la aplicación para completar el flujo de trabajo de facturación y comunicación.
- **Añadir Valor:** Ofrecer una característica profesional y conveniente que distinga a la aplicación.
- **Garantizar la Seguridad:** Manejar el envío de correos y las claves de API de forma segura a través de un backend controlado.

## 3. Alcance y Características

### 3.1. Feature: Backend de Envío de Correos

Se creará una función de backend sin servidor para gestionar la lógica de envío de correos de forma segura.

**Requisitos:**
- **Tecnología:** Se utilizará una **Supabase Edge Function**.
- **Nombre de la Función:** `send-excel-email`.
- **Servicio de Correo:** Se integrará con **Resend** para el envío de correos transaccionales.
- **Entradas (Payload):** La función deberá aceptar un objeto JSON con los siguientes campos:
    - `to` (string): La dirección de correo del destinatario.
    - `subject` (string): El asunto del correo.
    - `body` (string): El cuerpo del mensaje, que puede contener HTML simple.
    - `attachment` (string): El contenido del archivo Excel, codificado en **base64**.
- **Seguridad:** La clave de la API de Resend se almacenará de forma segura como un "secret" en Supabase y nunca se expondrá en el lado del cliente.

### 3.2. Feature: Interfaz de Envío de Correo

Se implementará una nueva interfaz de usuario para que el usuario pueda redactar y enviar el correo.

**Requisitos:**
- **Botón de Activación:**
    - Se añadirá un nuevo botón "Enviar por Correo" en el componente `GroupDetailNavbar.tsx`, junto a los botones existentes de "Exportar" y "Editar".
- **Diálogo de Envío (`SendEmailDialog.tsx`):**
    - Al hacer clic en el nuevo botón, se abrirá un diálogo modal.
    - Este diálogo contendrá los siguientes campos, todos personalizables por el usuario:
        - **Destinatario:** Un campo de texto para la dirección de correo electrónico (`<Input type="email">`).
        - **Asunto:** Un campo de texto para el asunto del correo (`<Input type="text">`).
        - **Mensaje:** Un área de texto de varias líneas para el cuerpo del correo (`<Textarea>`).
    - El diálogo tendrá un botón "Enviar" y un botón "Cancelar".

### 3.3. Feature: Lógica del Cliente

Se implementará la lógica en el frontend para orquestar la generación del archivo y la comunicación con el backend.

**Requisitos:**
- **Generación de Archivo en Memoria:**
    - Se refactorizará la función `exportToExcel` en `src/lib/excel-export.ts` para que, en lugar de iniciar una descarga, pueda devolver el contenido del archivo Excel como un objeto `Blob`.
- **Orquestación en `GroupDetail.tsx`:**
    1.  Cuando el usuario haga clic en "Enviar" en el diálogo, la aplicación ejecutará los siguientes pasos:
    2.  Llamará a la función refactorizada para generar el `Blob` del Excel.
    3.  Convertirá el `Blob` a una cadena de texto en formato **base64**.
    4.  Recolectará los valores de los campos "Destinatario", "Asunto" y "Mensaje" del diálogo.
    5.  Invocará la Edge Function `send-excel-email` de Supabase, pasándole todos los datos recolectados.
    6.  Mientras la función se ejecuta, se mostrará un indicador de carga en el botón "Enviar".
    7.  Se proporcionará feedback al usuario a través de notificaciones (`toast`):
        - Un mensaje de éxito si el correo se envió correctamente.
        - Un mensaje de error si falló el envío.

---

## 4. Plan de Implementación

### Fase 1: Configuración del Backend y Servicios

1.  **Crear Cuenta en Resend:** Registrarse, verificar un dominio de envío y obtener una API Key.
2.  **Configurar Secret en Supabase:** Almacenar la API Key de Resend de forma segura en el proyecto de Supabase.
3.  **Crear Edge Function:** Inicializar y desarrollar la función `send-excel-email` que se conecta a la API de Resend.
4.  **Desplegar la Función:** Publicar la Edge Function en Supabase.

### Fase 2: Desarrollo del Frontend

1.  **Refactorizar `excel-export.ts`:** Modificar la función para que pueda devolver el archivo como un `Blob`.
2.  **Crear `SendEmailDialog.tsx`:** Construir el componente del diálogo con todos los campos de formulario necesarios.
3.  **Actualizar `GroupDetailNavbar.tsx`:** Añadir el nuevo botón "Enviar por Correo".
4.  **Implementar Lógica en `GroupDetail.tsx`:** Escribir la función que une todo: genera el archivo, recolecta los datos y llama a la Edge Function.

### Fase 3: Pruebas y Verificación

1.  **Prueba End-to-End:** Realizar una prueba completa del flujo: abrir diálogo, rellenar campos, enviar y verificar la recepción del correo con el adjunto correcto.
2.  **Manejo de Errores:** Probar escenarios de error, como una dirección de correo inválida o un fallo en la API, y asegurarse de que la UI responda correctamente.

---

## 5. Fuera de Alcance

Para esta versión inicial, las siguientes características no serán implementadas:

- Envío a múltiples destinatarios (CC, CCO).
- Guardar plantillas de correo.
- Programar envíos de correo.
- Un editor de texto enriquecido (WYSIWYG) para el cuerpo del mensaje.
