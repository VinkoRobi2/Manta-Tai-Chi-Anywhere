# Funcionalidades

Por ahora la app es solo el onboarding. Las pantallas viven en `src/app` (Expo Router) y los componentes visuales compartidos en `src/ui`.

- `onboarding/` — bienvenida animada, cinco preguntas y el plan (`src/app/bienvenida`). Las respuestas se guardan en el teléfono al terminar. `responsive.ts` tiene los cortes por tamaño de pantalla (teléfono bajo, teléfono, tablet, apaisado).
- `settings/` — las respuestas del onboarding, guardadas en el teléfono.
