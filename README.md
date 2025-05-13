# Proyecto Lista con Estado y Eventos en React

Este proyecto es una lista de tareas con funcionalidades como la edición de texto, la adición de cantidades, y la gestión del estado de las tareas (completadas o pendientes). Además, cuenta con opciones de filtro, ordenación y persistencia en `localStorage`.

## Funcionalidades principales

- **Modo Claro/Oscuro**: La aplicación permite alternar entre un tema claro y uno oscuro.
- **Edición de Tareas**: Los usuarios pueden editar las tareas tanto en texto como en cantidad.
- **Añadir Tareas con Prioridad y Categoría**: Cada tarea se puede agregar con una prioridad y una categoría, y se puede ordenar por estas propiedades.
- **Filtrar por Estado y Categoría**: Los usuarios pueden filtrar las tareas por su estado (completadas o pendientes) y por categorías.
- **Persistencia**: Las tareas se guardan en `localStorage` para persistir entre recargas de la página.
- **Atajos de Teclado**: Se implementaron atajos globales para borrar todas las tareas (Ctrl + C) o solo las completadas (Alt + B).
- **Notificaciones**: Si el navegador soporta notificaciones, la aplicación pedirá permiso para enviar notificaciones de tareas vencidas.

## Estructura de Archivos

- **`App.jsx`**: Componente principal donde se gestionan los estados y la lógica de la aplicación.
- **`App.css`**: Contiene los estilos para los temas claro y oscuro.
- **`App.test.js`**: Archivo de pruebas utilizando la librería `@testing-library/react`.
- **`index.js`**: Punto de entrada donde se renderiza la aplicación.
- **`setupTests.js`**: Configuración inicial para las pruebas.
- **`reportWebVitals.js`**: Para medir el rendimiento de la aplicación.

## Errores y Mejoras

### Errores detectados:
1. **Falta de manejo de notificaciones vencidas**: Aunque se implementó la solicitud de permiso para mostrar notificaciones, la función que revisa las tareas vencidas no está implementada completamente.
2. **Falta de validación de texto duplicado al agregar tareas**: El sistema debería validar que no se agreguen tareas duplicadas.
3. **Orden de tareas**: La lógica para ordenar las tareas por prioridad, fecha, o nombre no está implementada correctamente en el filtro de orden.

### Sugerencias para mejoras:
1. **Mejorar la persistencia**: Asegúrate de que el estado del modo de tema y otros filtros también se guarden en `localStorage`.
2. **Optimización de rendimiento**: Implementar técnicas como la carga diferida de las tareas o el uso de `useMemo` para evitar cálculos innecesarios en cada renderizado.
3. **Revisión de accesibilidad**: Agregar etiquetas ARIA y mejorar la navegación con el teclado para hacer la aplicación más accesible.

## Requisitos

- **React**: Este proyecto utiliza React versión 18.2.0.
- **React-beautiful-dnd**: Se usa para gestionar la reordenación de tareas mediante arrastrar y soltar.
- **Testing**: Se utiliza `@testing-library/react` para las pruebas.

## Cómo empezar

1. **Clonar el repositorio**:

   ```bash
   git clone <url-del-repositorio>
   cd tema-form-lista
