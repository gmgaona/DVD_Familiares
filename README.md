# Administrador de VHS Familiares

Una aplicación web moderna para gestionar tu colección de VHS familiares, similar a la interfaz de fichas que describes. Permite administrar VHS, eventos individuales y enlaces directos a YouTube.

## 🎥 Características

- **Gestión de VHS**: Agregar, editar y eliminar VHS con información completa
- **Administración de Eventos**: Cada VHS puede tener múltiples eventos con fechas y horarios
- **Enlaces a YouTube**: Integración directa con videos de YouTube
- **Búsqueda Inteligente**: Buscar por nombre de VHS o contenido de eventos
- **Interfaz Moderna**: Diseño responsive con tarjetas tipo ficha
- **Almacenamiento Local**: Los datos se guardan en el navegador
- **Importación CSV**: Carga datos desde archivos CSV existentes

## 🚀 Cómo Usar

### 1. Abrir la Aplicación
Simplemente abre el archivo `index.html` en tu navegador web. No se requiere instalación adicional.

### 2. Agregar Nuevo VHS
- Haz clic en "Agregar Nuevo VHS" en la parte superior
- Completa la información del VHS:
  - Nombre del video
  - Duración total (formato HH:MM:SS)
  - Formato (8mm, VHS, Betamax)
  - Fechas de inicio y término
  - Velocidad de grabación
  - Link de YouTube (opcional)

### 3. Gestionar Eventos
- Haz clic en cualquier tarjeta de VHS para ver detalles
- En la vista de detalles, puedes:
  - Ver todos los eventos del VHS
  - Agregar nuevos eventos
  - Editar eventos existentes
  - Eliminar eventos

### 4. Buscar y Filtrar
- Usa la barra de búsqueda para encontrar VHS o eventos específicos
- La búsqueda funciona tanto por nombre de VHS como por contenido de eventos

### 5. Editar VHS
- Cada tarjeta tiene botones de editar y eliminar
- Haz clic en el botón de editar para modificar la información del VHS

## 📁 Estructura de Archivos

```
├── index.html          # Archivo principal de la aplicación
├── styles.css          # Estilos y diseño visual
├── script.js           # Lógica de la aplicación
├── dvd.txt            # Archivo CSV con datos de ejemplo
└── README.md          # Este archivo de documentación
```

## 🔧 Personalización

### Agregar Más Formatos de Video
En `script.js`, modifica el array de opciones en el formulario:

```javascript
<select id="videoFormato" name="videoFormato" required>
    <option value="8mm">8mm</option>
    <option value="VHS">VHS</option>
    <option value="Betamax">Betamax</option>
    <option value="MiniDV">MiniDV</option>
    <option value="Digital">Digital</option>
</select>
```

### Cambiar Colores del Tema
En `styles.css`, modifica las variables de color CSS:

```css
:root {
    --primary-color: #667eea;
    --secondary-color: #764ba2;
    --accent-color: #ff0000;
}
```

## 📊 Importar Datos CSV

La aplicación está preparada para importar datos desde archivos CSV. El formato esperado es:

```csv
video_nombre,video_duracion_total,video_fecha_inicio,video_fecha_termino,video_formato,video_velocidad,evento_fecha,evento_contenido,evento_inicio,evento_termino,evento_duracion
Video 1,02:00:00,01/01/1999,31/12/1999,8mm,SP,01/01/1999,Evento 1,00:00:00,00:30:00,00:30:00
```

## 💾 Almacenamiento

- Los datos se guardan automáticamente en el navegador (localStorage)
- No se requiere base de datos externa
- Los datos persisten entre sesiones del navegador

## 🌐 Compatibilidad

- **Navegadores**: Chrome, Firefox, Safari, Edge (versiones modernas)
- **Dispositivos**: Desktop, tablet y móvil (responsive)
- **Sistemas**: Windows, macOS, Linux

## 🎯 Funcionalidades Futuras

- Exportar datos a CSV
- Backup y restauración de datos
- Categorización por temas o fechas
- Galería de imágenes de eventos
- Sincronización en la nube
- Múltiples usuarios

## 🐛 Solución de Problemas

### La aplicación no carga
- Verifica que todos los archivos estén en la misma carpeta
- Asegúrate de que el navegador soporte JavaScript
- Intenta abrir la consola del navegador para ver errores

### Los datos no se guardan
- Verifica que el navegador tenga habilitado el localStorage
- Intenta en modo privado/incógnito
- Limpia la caché del navegador

### Problemas de visualización
- Actualiza el navegador a la última versión
- Verifica que la resolución de pantalla sea adecuada
- Intenta en otro navegador

## 📞 Soporte

Si encuentras algún problema o tienes sugerencias para mejorar la aplicación, puedes:

1. Revisar la consola del navegador para mensajes de error
2. Verificar que todos los archivos estén presentes
3. Probar en diferentes navegadores

## 📄 Licencia

Esta aplicación es de uso libre para fines personales y educativos.

---

**¡Disfruta organizando tus recuerdos familiares en VHS!** 🎬✨
