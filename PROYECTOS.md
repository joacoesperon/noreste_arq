# Guía para Agregar Proyectos - norestearq

## Opción 1: Usando el formulario (Recomendado)

1. Ir a `tudominio.com/admin`
2. Ingresar la contraseña
3. Llenar el formulario con los datos del proyecto
4. Seleccionar las imágenes (exterior e interior)
5. Click en "Crear Proyecto"
6. Seguir las instrucciones que aparecen en pantalla

---

## Opción 2: Manual

### Paso 1: Crear la carpeta del proyecto

Crear las carpetas para las imágenes en `public/projects/`:

```
public/projects/nombre-del-proyecto/
  exterior/
    01.jpg
    02.jpg
    03.jpg
  interior/
    01.jpg
    02.jpg
```

**Importante:**
- El nombre de la carpeta debe ser en minúsculas, sin espacios ni acentos (usar guiones)
- Las imágenes deben nombrarse: 01.jpg, 02.jpg, 03.jpg, etc.
- Formato recomendado: JPG o WebP
- Resolución recomendada: mínimo 1600px de ancho

### Paso 2: Agregar el proyecto al JSON

Abrir el archivo `content/projects.json` y agregar el nuevo proyecto al array:

```json
{
  "slug": "nombre-del-proyecto",
  "title": "Nombre del Proyecto",
  "status": "Construido",
  "year": 2024,
  "location": "La Barra, Maldonado",
  "shortDescription": "Descripción breve del proyecto (1-2 oraciones).",
  "fullDescription": "Descripción completa y detallada del proyecto...",
  "address": [
    "Ruta 10 km 161",
    "La Barra",
    "Maldonado, Uruguay"
  ],
  "exteriorImages": ["01.jpg", "02.jpg", "03.jpg"],
  "interiorImages": ["01.jpg", "02.jpg"]
}
```

**Campos:**
- `slug`: Identificador único (minúsculas, sin espacios, sin acentos)
- `title`: Nombre que se mostrará
- `status`: "Construido" o "Proyecto"
- `year`: Año del proyecto (número)
- `location`: Ubicación general
- `shortDescription`: Descripción corta (aparece en la página del proyecto)
- `fullDescription`: Descripción completa (aparece al hacer click en +)
- `address`: Array con las líneas de la dirección
- `exteriorImages`: Array con nombres de imágenes exteriores
- `interiorImages`: Array con nombres de imágenes interiores

### Paso 3: Guardar y publicar

1. Guardar los cambios
2. Hacer commit: `git add . && git commit -m "Agregar proyecto: Nombre"`
3. Hacer push: `git push`
4. El sitio se actualizará automáticamente

---

## Orden de los proyectos

- **Página Índice**: Los proyectos se ordenan automáticamente por año (más reciente primero)
- **Página Home**: Los proyectos aparecen en orden aleatorio consistente

---

## Eliminar un proyecto

1. Eliminar la carpeta de imágenes en `public/projects/nombre-proyecto/`
2. Eliminar el proyecto del array en `content/projects.json`
3. Hacer commit y push

---

## Editar un proyecto

1. Modificar los datos en `content/projects.json`
2. Si hay cambio de imágenes, actualizar la carpeta correspondiente
3. Hacer commit y push

---

## Notas técnicas

- Las imágenes de la galería se muestran en 2 columnas
- Primero se muestran las imágenes de exterior, luego las de interior
- La primera imagen exterior se usa como portada en el índice y home
