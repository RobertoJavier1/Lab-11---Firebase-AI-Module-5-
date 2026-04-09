# Lab 11 - Firebase AI Module 5
**Deploy:** https://lab-11-firebase-ai-module-5-jsc9srmiy-roberto-molina.vercel.app/

  ## Parte 1: My Events Dashboard

  Se implementó una página `/my-events` protegida que muestra únicamente los eventos creados por el usuario autenticado.
   La ruta redirige automáticamente a `/auth` si no hay sesión activa. Desde esta página el usuario puede editar y
  eliminar sus propios eventos. Se agregó el link "Mis Eventos" en el Header para facilitar la navegación.

  **Video:** https://youtu.be/rcMuTkmo84I

  ### Definition of Done

  | Criterio | Estado |
  |----------|--------|
  | Protected route - redirige a /auth si no está logueado | ✅ |
  | User filter - solo muestra eventos donde organizerId === user.uid | ✅ |
  | Edit button - navega al formulario de edición | ✅ |
  | Delete button - confirma y elimina el evento | ✅ |
  | Authorization - servidor valida que el usuario es dueño | ✅ |
  | Empty state - mensaje "No tienes eventos" con CTA | ✅ |
  | Loading state - muestra skeleton mientras carga | ✅ |

  ---

  ## Parte 2: Enhanced AI Generation

  Se mejoró la generación de descripciones con IA agregando un selector de tono (Formal, Casual, Emocionante) y la
  capacidad de generar 3 variantes simultáneas usando Gemini AI. El usuario puede previsualizar las 3 opciones y aplicar
   la que prefiera directamente al campo de descripción mediante un botón "Aplicar".

  **Video:** https://youtu.be/WmGzDEN9Npo

  ### Definition of Done

  | Criterio | Estado |
  |----------|--------|
  | Multiple variants - retorna array de 3 descripciones | ✅ |
  | Tone selector - dropdown formal/casual/exciting | ✅ |
  | Selection UI - cards para previsualizar cada variante | ✅ |
  | Apply button - descripción seleccionada llena el textarea | ✅ |
  | Progress indicator - muestra "Generando..." con spinner | ✅ |
  | Error handling - muestra mensaje si la generación falla | ✅ |
  | Regenerate - botón para generar nuevas variantes | ✅ |
