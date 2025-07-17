# Resumen del Proyecto: Residencial Guardian Tracker

## Propósito General

Esta es una aplicación web diseñada para gestionar y rastrear el hospedaje de trabajadores, principalmente con fines de facturación. Permite a los usuarios supervisar los días de alojamiento de cada trabajador de forma individual y flexible.

## Stack Tecnológico

*   **Frontend:** React con Vite
*   **Lenguaje:** TypeScript
*   **Estilos:** Tailwind CSS
*   **Componentes UI:** shadcn/ui
*   **Enrutamiento:** react-router-dom
*   **Gestión de Estado (Servidor):** @tanstack/react-query
*   **Autenticación:** Supabase Auth (gestionado a través de `AuthContext`)
*   **Backend y Base de Datos:** Supabase (PostgreSQL, APIs)
*   **Formularios:** react-hook-form con Zod para validación

## Estructura de la Base de Datos (Entidades Clave)

*   `billing_periods`: Agrupa los registros por mes y año para cada usuario.
*   `groups`: Representa una "agrupación" de trabajadores dentro de un período de facturación, con fechas de inicio/fin y un precio por noche.
*   `workers`: Almacena la información de los trabajadores (nombre, cargo) asociados a un grupo.
*   `hospedaje`: Registra los días específicos en que un trabajador se ha hospedado.

## Características Principales

*   **Autenticación de Usuarios:** Sistema de registro e inicio de sesión.
*   **Gestión de Períodos:** Navegación a través de períodos de facturación mensuales.
*   **Gestión de Agrupaciones:** Crear, ver y editar agrupaciones de trabajadores para cada período.
*   **Gestión de Trabajadores:** Añadir y eliminar trabajadores de una agrupación.
*   **Calendario de Hospedaje:** Interfaz visual para marcar y desmarcar los días de hospedaje de cada trabajador.
*   **Exportación a Excel:** Generación de un informe de facturación detallado en formato `.xlsx` que calcula los costos totales.
