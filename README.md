# 🇺🇸 Inglés al Grano - Corrector y Práctica de Inglés Inteligente

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React_Vite-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![OpenRouter](https://img.shields.io/badge/AI_API-OpenRouter-7c3aed?style=for-the-badge&logo=openai&logoColor=white)](https://openrouter.ai/)
[![Vanilla CSS](https://img.shields.io/badge/Styling-Vanilla_CSS-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)

**Inglés al Grano** es una aplicación web interactiva y de código abierto diseñada específicamente para estudiantes y profesionales hispanohablantes que buscan perfeccionar su inglés. 

A diferencia de los correctores automáticos tradicionales que solo reemplazan palabras, esta herramienta utiliza Inteligencia Artificial avanzada para realizar **Grammatical Error Correction (GEC)** y devolver **explicaciones didácticas en español** sobre cada regla gramatical, ortográfica o de estilo infringida.

---

## 🚀 Características Clave (SEO & Valor Educativo)

- **Corrección de Inglés Multidimensional:** Corrige ortografía (typos), gramática, preposiciones erróneas, puntuación y estilo o frases poco comunes para que suenes más natural.
- **Explicaciones Didácticas en Español:** Cada corrección viene acompañada de una tarjeta explicativa en español indicando el "porqué" de la regla (ej. uso de tercera persona, condicionales, colocaciones verbales).
- **Resaltado Visual de Cambios:** Un diff visual claro que tacha en rojo los errores del texto original y destaca con colores temáticos las mejoras en el texto corregido.
- **Consejo y Feedback General:** Incluye una sección de feedback motivador del modelo con sugerencias para mejorar tu patrón de escritura.
- **Tema Dual Inteligente:** Modo Oscuro y Modo Claro con transiciones fluidas.
- **Persistencia Local:** Guarda de forma privada tu última consulta en el navegador (`localStorage`) para que puedas retomar tu sesión si refrescas la pestaña.

---

## 🛠️ Tecnologías Utilizadas

### Frontend:
- **React 18** + **Vite** para una carga ultra rápida.
- **pnpm** como gestor de paquetes de alto rendimiento.
- **Vanilla CSS** con sistema de diseño modular basado en variables CSS personalizadas y diseño responsivo.
- **Lucide React** para un conjunto de iconos minimalista y moderno.

### Backend:
- **FastAPI (Python 3.13)**: Framework rápido, asíncrono y de tipado estricto para crear la API.
- **Pydantic v2**: Validación de esquemas estrictos de entrada y salida JSON de la IA.
- **OpenRouter API / OpenAI SDK**: Conexión e integración con modelos avanzados como `google/gemini-2.5-flash` o `openai/gpt-4o-mini` forzando respuestas en formato JSON estructurado.

---

## 💻 Instalación y Configuración Local

Sigue estos pasos para clonar el proyecto y ponerlo en marcha en tu máquina local:

### Requisitos Previos:
- [Node.js](https://nodejs.org/) (versión 18 o superior) e instalar `pnpm` (`npm install -g pnpm`).
- [Python 3.10+](https://www.python.org/) y `pip`.
- Una clave de API de [OpenRouter](https://openrouter.ai/).

---

### Paso 1: Configurar el Backend (FastAPI)

1. Navega a la carpeta del backend:
   ```bash
   cd backend
   ```

2. Crea un entorno virtual e instálate las dependencias:
   ```bash
   python -m venv .venv
   .venv\Scripts\activate  # En Windows (PowerShell/CMD)
   # source .venv/bin/activate  # En macOS/Linux
   
   pip install -r requirements.txt
   ```

3. Configura tus variables de entorno. Duplica el archivo `.env.example`, renombralo a `.env` e ingresa tu API Key de OpenRouter:
   ```env
   OPENROUTER_API_KEY=tu_api_key_de_openrouter_aqui
   OPENROUTER_MODEL=google/gemini-2.5-flash
   ```

4. Inicia el servidor de desarrollo del backend:
   ```bash
   uvicorn app.main:app --reload
   ```
   *El backend estará disponible en `http://127.0.0.1:8000`.*

---

### Paso 2: Configurar el Frontend (React)

1. En una nueva terminal, navega a la carpeta del frontend:
   ```bash
   cd frontend
   ```

2. Instala los paquetes usando `pnpm`:
   ```bash
   pnpm install
   ```

3. Inicia el servidor de desarrollo de Vite:
   ```bash
   pnpm dev
   ```
   *El frontend estará disponible en `http://localhost:5173`. Las llamadas a `/api` se redirigirán automáticamente al puerto 8000.*

---

## 🔍 Ejemplos de Pruebas

Para validar el funcionamiento del corrector, escribe estas frases típicas con errores en el cuadro de texto:

- **Error de verbo/auxiliar:** `"She don't like apples."`
  - *Corrección:* `"She doesn't like apples."`
  - *Explicación:* Regla de la tercera persona del singular en presente simple.
- **Uso de preposición incorrecta:** `"I am agree with you."`
  - *Corrección:* `"I agree with you."`
  - *Explicación:* En inglés, "agree" es un verbo, no un adjetivo. No requiere el auxiliar "am".
- **Error ortográfico y doble condicional:** `"If I'd knowm that I'd get cancer, I would't have start to smoking."`
  - *Corrección:* `"If I'd known that I'd get cancer, I wouldn't have started smoking."`

---

## 📝 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT. Siéntete libre de clonarlo, hacerle fork o utilizarlo para tus propios fines de aprendizaje.
