# Sistema de Tags Personalizados para Administrador de VHS Familiares

## 🏷️ Características del Sistema de Tags

### Funcionalidades Principales
- **Crear Tags**: Agregar nuevos tags personalizados con nombre y color
- **Editar Tags**: Modificar el nombre de tags existentes
- **Eliminar Tags**: Remover tags no deseados (se eliminan de todos los eventos)
- **Códigos Únicos**: Cada tag tiene un código único para identificación
- **Exportar/Importar**: Respaldar y restaurar tags en formato JSON
- **Asignación Múltiple**: Un evento puede tener varios tags
- **Persistencia**: Los tags se guardan en localStorage y se preservan en respaldos CSV

### Estructura de un Tag
```json
{
  "id": 1,
  "name": "Familia",
  "color": "#667eea",
  "code": "TAG001234567"
}
```

## 🚀 Cómo Usar el Sistema de Tags

### 1. Acceder al Gestor de Tags
- Haz clic en el botón **"Gestionar Tags"** (azul) en la barra superior
- Se abrirá el modal de gestión de tags

### 2. Crear un Nuevo Tag
1. En el modal, completa el formulario:
   - **Nombre del Tag**: Ej: "Familia", "Evento", "Persona"
   - **Color**: Selecciona un color personalizado
2. Haz clic en **"Crear Tag"**
3. El tag se creará automáticamente con un código único

### 3. Asignar Tags a Eventos
1. Al crear o editar un evento, verás el campo **"Tags (opcional)"**
2. Selecciona uno o varios tags del menú desplegable
3. Los tags seleccionados se guardarán con el evento

### 4. Visualizar Tags
- Los tags aparecen como **círculos de color** junto al nombre del evento
- Cada tag muestra su nombre y un círculo del color asignado
- Los tags se muestran en:
  - Vista previa de eventos en tarjetas VHS
  - Detalles completos de eventos
  - Resultados de búsqueda

### 5. Gestionar Tags Existentes
- **Editar**: Haz clic en el botón de editar (lápiz) del tag
- **Eliminar**: Haz clic en el botón de eliminar (basura) del tag
- **Nota**: Al eliminar un tag, se removerá de todos los eventos que lo usen

## 📁 Exportar e Importar Tags

### Exportar Tags
1. En el gestor de tags, haz clic en **"Exportar Tags"**
2. Se descargará un archivo `vhs_tags.json`
3. Este archivo contiene todos los tags y su configuración

### Importar Tags
1. En el gestor de tags, haz clic en **"Importar Tags"**
2. Selecciona un archivo JSON válido
3. Los tags se importarán y reemplazarán los existentes

## 🔧 Integración con el Sistema

### Persistencia de Datos
- Los tags se guardan automáticamente en `localStorage`
- Se incluyen en los respaldos CSV como columna adicional
- Se preservan al importar/exportar datos

### Códigos Únicos
- Formato: `TAG` + timestamp + número aleatorio
- Ejemplo: `TAG123456789`
- Garantiza identificación única para respaldos

### Tags por Defecto
Al iniciar por primera vez, se crean automáticamente:
- **Familia** (azul)
- **Evento** (verde)
- **Persona** (naranja)
- **Lugar** (púrpura)
- **Fecha** (rojo)

## 🎨 Personalización Visual

### Colores de Tags
- Selecciona cualquier color hexadecimal
- Los colores se aplican a:
  - Círculos de tags en eventos
  - Opciones en el selector de tags
  - Elementos de la lista de tags

### Estilos CSS
Los tags utilizan clases CSS personalizables:
- `.event-tag`: Contenedor principal del tag
- `.event-tag-circle`: Círculo de color del tag
- `.tag-item`: Elemento en la lista de gestión

## 📊 Estructura de Datos CSV

### Nueva Columna: Tags
Los archivos CSV ahora incluyen una columna adicional:
```csv
Nombre_de_la_cinta,Fecha_inicio_grabacion,...,Tags
Video 1,01/01/2000,...,Familia,Evento
Video 2,02/01/2000,...,Persona
```

### Formato de Tags en CSV
- Múltiples tags separados por comas
- Sin espacios adicionales
- Preservación completa en importación/exportación

## 🚨 Consideraciones Importantes

### Eliminación de Tags
- Al eliminar un tag, se remueve de **todos** los eventos
- Esta acción no se puede deshacer
- Confirma antes de eliminar tags importantes

### Respaldos
- Los tags se incluyen automáticamente en respaldos CSV
- Para respaldos específicos de tags, usa la función de exportar JSON
- Los respaldos JSON incluyen metadatos adicionales

### Compatibilidad
- El sistema es compatible con datos existentes
- Los eventos sin tags se muestran normalmente
- No afecta la funcionalidad existente del sistema

## 🔍 Solución de Problemas

### Tags No Se Muestran
1. Verifica que el sistema de tags esté inicializado
2. Comprueba que los eventos tengan tags asignados
3. Revisa la consola del navegador para errores

### Error al Crear Tags
1. Asegúrate de que el nombre no esté vacío
2. Verifica que el color sea válido
3. Comprueba que localStorage esté habilitado

### Tags No Se Guardan
1. Verifica la conexión a localStorage
2. Comprueba que no haya errores en la consola
3. Intenta recargar la página

## 📝 Ejemplos de Uso

### Tag para Eventos Familiares
- **Nombre**: "Familia"
- **Color**: Azul (#667eea)
- **Uso**: Marcar eventos importantes con familiares

### Tag para Lugares
- **Nombre**: "Lugar"
- **Color**: Púrpura (#9f7aea)
- **Uso**: Identificar eventos en ubicaciones específicas

### Tag para Fechas Especiales
- **Nombre**: "Fecha"
- **Color**: Rojo (#f56565)
- **Uso**: Marcar eventos en fechas significativas

---

**Nota**: Este sistema de tags está completamente integrado con el Administrador de VHS Familiares y no requiere configuración adicional.

