# norestearq

> Estudio de Arquitectura — Donde el espacio cobra vida.

## 📋 Tabla de Contenidos

- [Descripción](#-descripción)
- [Guía de Estilo](#-guía-de-estilo)
- [Stack Tecnológico](#-stack-tecnológico)
- [Reglas de Desarrollo](#-reglas-de-desarrollo)
- [Restricciones de Diseño](#-restricciones-de-diseño)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Instalación](#-instalación)
- [Scripts Disponibles](#-scripts-disponibles)

---

## 🏛️ Descripción

**norestearq** es la página web oficial de un estudio de arquitectura contemporáneo que busca transmitir los valores fundamentales de su filosofía de diseño:

- **Minimalismo**: Menos es más. Cada elemento tiene un propósito.
- **Elegancia**: Líneas limpias, espacios amplios, sofisticación visual.
- **Funcionalidad**: La forma sigue a la función, tanto en arquitectura como en la web.

### Objetivos del Sitio

| Objetivo | Descripción |
|----------|-------------|
| **Portafolio Visual** | Exhibir proyectos arquitectónicos con fotografías de alta calidad como protagonistas |
| **Identidad de Marca** | Reflejar la esencia del estudio: precisión, atención al detalle y visión contemporánea |
| **Generación de Leads** | Facilitar el contacto con potenciales clientes a través de una experiencia fluida |
| **Credibilidad** | Posicionar al estudio como referente en arquitectura de autor |

---

## 🎨 Guía de Estilo

### Paleta de Colores

La paleta refleja los materiales nobles de la arquitectura: hormigón, piedra, madera y luz natural.

```
┌─────────────────────────────────────────────────────────────────┐
│  PRIMARIOS                                                      │
├─────────────────────────────────────────────────────────────────┤
│  ██████  #0A0A0A  Negro Carbón      (Fondos, texto principal)   │
│  ██████  #FAFAFA  Blanco Hueso      (Fondos claros, contraste)  │
│  ██████  #1A1A1A  Gris Antracita    (Secciones alternadas)      │
├─────────────────────────────────────────────────────────────────┤
│  SECUNDARIOS                                                    │
├─────────────────────────────────────────────────────────────────┤
│  ██████  #8B7355  Tierra Tostada    (Acentos cálidos)           │
│  ██████  #4A4A4A  Gris Hormigón     (Textos secundarios)        │
│  ██████  #D4C5B5  Arena             (Hover states, bordes)      │
├─────────────────────────────────────────────────────────────────┤
│  FUNCIONALES                                                    │
├─────────────────────────────────────────────────────────────────┤
│  ██████  #E63946  Rojo Alerta       (Errores)                   │
│  ██████  #2D6A4F  Verde Éxito       (Confirmaciones)            │
└─────────────────────────────────────────────────────────────────┘
```

### Variables CSS (Tailwind Config)

```javascript
colors: {
  carbon: '#0A0A0A',
  bone: '#FAFAFA',
  anthracite: '#1A1A1A',
  terracotta: '#8B7355',
  concrete: '#4A4A4A',
  sand: '#D4C5B5',
}
```

### Tipografías

| Uso | Fuente | Peso | Tamaño Base |
|-----|--------|------|-------------|
| **Títulos** | `Playfair Display` | 400, 500 | 48px - 72px |
| **Subtítulos** | `Inter` | 500 | 24px - 32px |
| **Cuerpo** | `Inter` | 300, 400 | 16px - 18px |
| **Navegación** | `Inter` | 500 | 14px (uppercase, tracking wide) |
| **Captions** | `Inter` | 300 | 12px - 14px |

### Escala Tipográfica

```
Display:    72px / 80px line-height  → Títulos hero
H1:         48px / 56px line-height  → Títulos de sección
H2:         36px / 44px line-height  → Subtítulos principales
H3:         24px / 32px line-height  → Títulos de tarjetas
Body:       18px / 28px line-height  → Texto principal
Small:      14px / 20px line-height  → Captions, metadata
```

### Sistema de Espaciado

Basado en múltiplos de **8px** para consistencia visual:

```
--space-1:   8px    → Padding interno mínimo
--space-2:   16px   → Gaps entre elementos pequeños
--space-3:   24px   → Separación entre componentes
--space-4:   32px   → Margen entre secciones pequeñas
--space-5:   48px   → Padding de contenedores
--space-6:   64px   → Separación entre secciones
--space-7:   96px   → Márgenes de sección hero
--space-8:   128px  → Espaciado extra-large
```

### Reglas de Espaciado

- **Contenedor máximo**: `1440px` con padding lateral de `24px` (móvil) / `48px` (desktop)
- **Grid**: Sistema de 12 columnas con gap de `24px`
- **Secciones**: Padding vertical mínimo de `96px` en desktop, `64px` en móvil

---

## 🛠️ Stack Tecnológico

### Core

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **Next.js** | 15.x | Framework React con SSR/SSG, App Router, optimización de imágenes |
| **React** | 19.x | Biblioteca UI con Server Components |
| **TypeScript** | 5.x | Tipado estático para mayor robustez |

### Estilos

| Tecnología | Propósito |
|------------|-----------|
| **Tailwind CSS 4** | Utility-first CSS, diseño responsive eficiente |
| **CSS Modules** | Estilos encapsulados cuando se requiera |
| **Framer Motion** | Animaciones fluidas y micro-interacciones |

### Optimización de Imágenes

| Tecnología | Propósito |
|------------|-----------|
| **next/image** | Lazy loading nativo, formatos modernos (WebP, AVIF), responsive images |
| **Plaiceholder** | Generación de placeholders blur para carga progresiva |
| **Sharp** | Procesamiento de imágenes en build time |

### Calidad de Código

| Herramienta | Propósito |
|-------------|-----------|
| **ESLint** | Linting con reglas estrictas |
| **Prettier** | Formateo consistente |
| **Husky** | Git hooks para pre-commit |
| **lint-staged** | Linting solo en archivos staged |

### Despliegue

| Plataforma | Características |
|------------|-----------------|
| **Vercel** | CI/CD automático, Edge Functions, Analytics, Image Optimization CDN |

---

## 📐 Reglas de Desarrollo

### Convenciones de Código

#### Estructura de Componentes (Atomic Design Adaptado)

```
src/
├── components/
│   ├── atoms/           # Elementos indivisibles (Button, Input, Icon)
│   ├── molecules/       # Combinaciones simples (Card, NavLink, FormField)
│   ├── organisms/       # Secciones completas (Header, Footer, ProjectGrid)
│   └── templates/       # Layouts de página
├── app/                 # App Router de Next.js
├── lib/                 # Utilidades y helpers
├── hooks/               # Custom hooks
├── types/               # Definiciones TypeScript
└── styles/              # Estilos globales
```

#### Nomenclatura

| Elemento | Convención | Ejemplo |
|----------|------------|---------|
| **Componentes** | PascalCase | `ProjectCard.tsx` |
| **Hooks** | camelCase con prefijo `use` | `useScrollPosition.ts` |
| **Utilidades** | camelCase | `formatDate.ts` |
| **Tipos** | PascalCase con sufijo descriptivo | `ProjectType.ts` |
| **Constantes** | SCREAMING_SNAKE_CASE | `MAX_PROJECTS_PER_PAGE` |

#### Tailwind CSS - Orden de Clases

Seguir el orden lógico de Tailwind (automático con plugin de Prettier):

```jsx
// ✅ Correcto
<div className="absolute top-0 left-0 z-10 flex h-full w-full items-center justify-center bg-carbon/80 p-4 text-bone transition-opacity hover:opacity-100">

// ❌ Incorrecto - clases desordenadas
<div className="p-4 absolute bg-carbon/80 flex top-0 hover:opacity-100 left-0">
```

### Buenas Prácticas para Imágenes de Alta Resolución

#### 1. Optimización con next/image

```tsx
import Image from 'next/image'

// ✅ Configuración óptima para fotografía arquitectónica
<Image
  src="/projects/casa-morena/hero.jpg"
  alt="Vista frontal Casa Morena - fachada de hormigón visto"
  width={1920}
  height={1080}
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1400px"
  quality={85}
  placeholder="blur"
  blurDataURL={blurDataUrl}
  priority={isAboveTheFold}
/>
```

#### 2. Estrategia de Responsive Images

```tsx
// Definir breakpoints específicos para arquitectura
const imageSizes = {
  thumbnail: { width: 400, height: 300 },    // Grid preview
  card: { width: 800, height: 600 },          // Tarjetas de proyecto
  hero: { width: 1920, height: 1080 },        // Imágenes hero
  gallery: { width: 1400, height: 900 },      // Galería de proyecto
}
```

#### 3. Lazy Loading Nativo

```tsx
// Las imágenes fuera del viewport inicial NO deben tener priority
<Image
  src={project.image}
  alt={project.alt}
  fill
  className="object-cover"
  loading="lazy"  // Por defecto en next/image
/>
```

#### 4. Formatos Modernos

Configurar Next.js para servir formatos optimizados:

```typescript
// next.config.ts
const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
}
```

#### 5. Placeholder Blur

```typescript
// Generar placeholders en build time con plaiceholder
import { getPlaiceholder } from 'plaiceholder'

async function getBlurDataUrl(src: string) {
  const { base64 } = await getPlaiceholder(src)
  return base64
}
```

---

## 🚧 Restricciones de Diseño

### 1. Navegación Intuitiva

| Requisito | Implementación |
|-----------|----------------|
| **Header fijo** | Sticky header con transparencia que se solidifica al scroll |
| **Menú hamburguesa** | En móvil, menú fullscreen con animación suave |
| **Breadcrumbs** | En páginas de proyecto individual |
| **CTA visible** | Botón de contacto siempre accesible |
| **Scroll suave** | `scroll-behavior: smooth` global |

```
┌─────────────────────────────────────────────────────────────────┐
│  LOGO                    PROYECTOS  ESTUDIO  CONTACTO      ☰   │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Portafolio con Imágenes de Alta Resolución

| Requisito | Solución Técnica |
|-----------|------------------|
| **Lazy loading** | `next/image` con `loading="lazy"` |
| **Carga progresiva** | Placeholder blur durante la carga |
| **Formatos modernos** | AVIF/WebP con fallback a JPEG |
| **Responsive** | `sizes` attribute para servir tamaño apropiado |
| **Caché agresivo** | Headers de cache en CDN de Vercel |
| **Lightbox** | Galería fullscreen para detalle de proyectos |

### 3. Diseño Totalmente Responsive

| Breakpoint | Dispositivo | Columnas Grid | Contenedor |
|------------|-------------|---------------|------------|
| `< 640px` | Móvil | 1 | 100% - 48px |
| `640px` | Tablet pequeña | 2 | 100% - 64px |
| `768px` | Tablet | 2 | 100% - 64px |
| `1024px` | Desktop pequeño | 3 | 100% - 96px |
| `1280px` | Desktop | 3 | 1200px |
| `1536px` | Desktop grande | 4 | 1440px |

#### Mobile First

```css
/* Base: móvil */
.project-grid {
  @apply grid grid-cols-1 gap-4;
}

/* Tablet */
@screen md {
  .project-grid {
    @apply grid-cols-2 gap-6;
  }
}

/* Desktop */
@screen lg {
  .project-grid {
    @apply grid-cols-3 gap-8;
  }
}
```

---

## 📁 Estructura del Proyecto

```
norestearq/
├── public/
│   ├── images/
│   │   ├── projects/          # Imágenes de proyectos (optimizadas)
│   │   ├── team/              # Fotos del equipo
│   │   └── studio/            # Imágenes del estudio
│   ├── fonts/                 # Fuentes locales (si aplica)
│   └── favicon.ico
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Layout raíz
│   │   ├── page.tsx           # Home
│   │   ├── proyectos/
│   │   │   ├── page.tsx       # Grid de proyectos
│   │   │   └── [slug]/
│   │   │       └── page.tsx   # Proyecto individual
│   │   ├── estudio/
│   │   │   └── page.tsx       # Sobre nosotros
│   │   └── contacto/
│   │       └── page.tsx       # Formulario de contacto
│   ├── components/
│   │   ├── atoms/
│   │   ├── molecules/
│   │   ├── organisms/
│   │   └── templates/
│   ├── lib/
│   │   ├── utils.ts
│   │   └── constants.ts
│   ├── hooks/
│   ├── types/
│   └── styles/
│       └── globals.css
├── .eslintrc.json
├── .prettierrc
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 🚀 Instalación

```bash
# Clonar el repositorio
git clone https://github.com/norestearq/website.git

# Navegar al directorio
cd norestearq

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local

# Iniciar servidor de desarrollo
npm run dev
```

---

## 📜 Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Inicia servidor de desarrollo en `localhost:3000` |
| `npm run build` | Genera build de producción |
| `npm run start` | Inicia servidor de producción |
| `npm run lint` | Ejecuta ESLint |
| `npm run lint:fix` | Corrige errores de ESLint automáticamente |
| `npm run format` | Formatea código con Prettier |
| `npm run type-check` | Verifica tipos de TypeScript |

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo [LICENSE](LICENSE) para más detalles.

---

<div align="center">
  <p>
    <strong>norestearq</strong> · Arquitectura Contemporánea
  </p>
  <p>
    <sub>Diseñado y desarrollado con precisión arquitectónica.</sub>
  </p>
</div>


