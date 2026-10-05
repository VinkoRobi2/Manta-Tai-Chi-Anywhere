# Prompt para Claude: Manta, Fase 1 "Primera ola"

> **Estado:** ejecutado en la rama `feat/fase-1-primera-ola`. Cambio respecto al plan original: el instructor es **video realista**, no un personaje 3D (ver `docs/instructor-video.md`). Este documento queda como especificación de la Fase 1.

Eres el ingeniero principal y el diseñador de producto de **Manta**, una app de tai chi para iOS y Android. Trabajas dentro del monorepo de este repositorio. En esta sesión vas a construir el comienzo de la app móvil: el sistema de diseño, la navegación y la experiencia completa de la primera clase, funcionando sin internet. No vas a construir toda la app.

Lee todo este documento antes de tocar código. Después escribe un plan corto y empieza.

---

## 1. Por qué existe Manta

Manta nació para un pescador que pasa semanas en altamar. Practica tai chi sentado en una silla, en un barco, sin señal, en un espacio pequeño y a horas que cambian todos los días. Si la app funciona para él, funciona para cualquiera con poco espacio, poco tiempo o poca movilidad.

Para quién es, en orden de prioridad:

1. Personas que practican sentadas: adultos mayores, personas con dolor de rodillas o espalda, usuarios de silla de ruedas, personas que se recuperan de una lesión.
2. Personas con poco espacio o sin señal: marinos, pescadores, camioneros, personal de plataformas, viajeros.
3. Oficinistas que buscan una pausa activa de 5 minutos.
4. Hijos e hijas de 30 a 55 años que instalan o regalan la app a sus padres. Muchas veces son quienes pagan.

La promesa, en una línea: **"Tai chi en el espacio que tengas, con o sin señal."**

## 2. Principios que no se negocian

1. **Primera clase en menos de 60 segundos.** Desde que se abre la app por primera vez hasta que el instructor se mueve: un toque para elegir el espacio y otro para empezar. Sin cuenta, sin correo, sin encuesta de bienvenida, sin paywall y sin pedir permisos.
2. **La primera clase es el onboarding.** Los controles se enseñan dentro de la clase, con la voz del instructor. No hay pantallas de tutorial.
3. **Offline desde el primer minuto.** La primera clase del modo Silla viene dentro del binario de la app. Nada de lo que se construye en esta fase depende de la red.
4. **El diseño es el producto.** Calma, claridad y letra grande. Cada pantalla se ve terminada y nativa en iOS y en Android.
5. **Accesible por defecto.** Texto de lectura de 18 pt como mínimo, áreas táctiles de 56 pt, contraste AA, VoiceOver y TalkBack, escala de fuente del sistema.
6. **Nunca culpar.** No hay rachas que se pierden ni contadores en rojo. Quien vive en el mar no practica todos los días a la misma hora.
7. **Las clases son datos.** El reproductor interpreta una línea de tiempo (`LessonTimeline` de `@manta/shared`). Agregar una clase no requiere tocar código.

## 3. Estado del repositorio (léelo primero)

Lee antes de empezar: `README.md`, `AGENTS.md`, `docs/arquitectura.md`, `docs/instructor-video.md`, todo `apps/mobile/src/` y todo `packages/shared/src/`.

Stack de la app móvil (ya instalado, no cambies versiones):

- Expo SDK 57, React Native 0.86, React 19.2, React Compiler activado.
- Expo Router con rutas tipadas.
- NativeWind 4.2 (Tailwind 3) con los colores `abismo`, `marea`, `espuma`, `bruma` y `sol` en `tailwind.config.js`.
- Reanimated 4.5, react-native-gesture-handler, react-native-screens, safe-area-context.
- expo-sqlite (migraciones numeradas en `src/db/database.ts`), expo-audio, expo-file-system, expo-localization.
- i18next con textos en `src/i18n/{es,en,de}.json`.
- react-native-purchases (instalado, todavía sin usar) y expo-dev-client.

Lo que ya existe en `apps/mobile/src/app/`: `_layout.tsx`, `index.tsx` (selector de espacio), `clase/[slug].tsx` (marcador de posición) y `ajustes.tsx`.

Reglas del repositorio:

- Instala módulos nuevos desde `apps/mobile` con `pnpm exec expo install <paquete>` para obtener versiones compatibles con el SDK 57. No actualices dependencias ya fijadas.
- Nunca edites una migración SQLite ya escrita: agrega una nueva al final del arreglo.
- Las rutas y los textos visibles van en español. Los identificadores de código van en inglés. Todo texto visible pasa por i18n en es, en y de.
- Antes de terminar, `pnpm typecheck`, `pnpm lint` y `pnpm test` deben pasar.

## 4. Alcance de esta sesión

Sí entra:

1. Sistema de diseño: tokens, tipografía, componentes base y adaptaciones para iOS y Android.
2. Navegación con tres pestañas: **Hoy**, **Clases** y **Bitácora**. Ajustes se abre desde Hoy.
3. Pantallas: Hoy, Hoja de clase, Reproductor, Final de clase, Bitácora, Clases, Preparar para zarpar (con datos simulados), Manta completa (paywall simulado) y Ajustes.
4. Motor de línea de tiempo (lógica pura, con tests) y reproductor con un instructor provisional.
5. Primera clase de Silla empaquetada en la app, funcionando sin red, con la voz del sistema (`expo-speech`) como voz provisional.
6. Bitácora local en SQLite, mareas semanales y recordatorio local.

No entra (son otras sesiones):

- Los videos del instructor (todavía no existen). Sí debes dejar listo `InstructorStage` para reproducirlos con `expo-video` en cuanto haya clips.
- Compras reales con RevenueCat. Deja una interfaz `PurchasesService` con una implementación simulada.
- Cambios en `apps/api` o `apps/web`, salvo los tipos compartidos de `@manta/shared`.
- Cuentas, login o sincronización con el servidor.

## 5. Sistema de diseño

### 5.1 Idea visual

Una manta raya se desliza despacio y con las alas abiertas: así se mueve el tai chi. La app habla el idioma del mar: la profundidad (abismo), la espuma, la marea y el sol en el horizonte. Nada de estética de gimnasio, neones, gradientes violetas ni confeti.

### 5.2 Color

Modo claro (por defecto):

| Token          | Valor     | Uso                                                                              |
| -------------- | --------- | -------------------------------------------------------------------------------- |
| `espuma`       | `#EEF4F5` | Fondo de pantalla                                                                |
| `superficie`   | `#FFFFFF` | Tarjetas y hojas                                                                 |
| `abismo`       | `#0B3C49` | Texto principal y escenario del reproductor                                      |
| `abismo-suave` | `#4A6D76` | Texto secundario (no uses `bruma` para texto sobre `espuma`: no tiene contraste) |
| `marea`        | `#1F7A8C` | Acciones secundarias, enlaces, estado activo, insignia Anclada                   |
| `bruma`        | `#9DB4BA` | Bordes y separadores                                                             |
| `sol`          | `#F2B134` | Acción principal (Empezar) y logros. El texto sobre `sol` siempre va en `abismo` |

Modo cabina (oscuro, para practicar de noche en un camarote):

| Token            | Valor     |
| ---------------- | --------- |
| fondo            | `#06232B` |
| superficie       | `#0B3C49` |
| texto            | `#EEF4F5` |
| texto secundario | `#A9C1C7` |
| acento           | `#E0A52F` |

Define los tokens en un solo lugar (variables con `vars()` de NativeWind o un tema en `src/theme/`). El modo sigue al sistema y se puede fijar en Ajustes. Cambia `userInterfaceStyle` en `app.json` a `"automatic"`.

### 5.3 Tipografía

Lexend (diseñada para facilitar la lectura) con `@expo-google-fonts/lexend` y `expo-font`. Carga la fuente antes de ocultar el splash.

| Estilo   | Tamaño / interlineado (pt) | Peso                                   |
| -------- | -------------------------- | -------------------------------------- |
| display  | 34 / 40                    | SemiBold                               |
| title    | 26 / 32                    | SemiBold                               |
| headline | 21 / 28                    | Medium                                 |
| body     | 18 / 27                    | Regular (mínimo para texto de lectura) |
| callout  | 16 / 22                    | Regular                                |
| label    | 13 / 16                    | Medium, mayúsculas, tracking +0.8      |

Respeta la escala de fuente del sistema. Usa `maxFontSizeMultiplier` solo donde el diseño se rompería (barra de pestañas, controles del reproductor) y nunca por debajo de 1.4.

### 5.4 Espacio, forma, movimiento y háptica

- Espaciado: 4, 8, 12, 16, 24, 32, 48. Margen lateral de pantalla: 20 (24 en tablet).
- Radios: 12 en chips, 20 en tarjetas, 28 en hojas y botones grandes.
- Áreas táctiles de 56 × 56 como mínimo. Botón principal de 60 de alto y ancho completo.
- Movimiento como una respiración: 400 a 800 ms, curva ease-in-out, sin rebotes. Con "reducir movimiento" activado (`useReducedMotion` de Reanimated), cambia desplazamientos por fundidos.
- Háptica con `expo-haptics`: toque suave al elegir. Durante la clase, un pulso suave al empezar cada inhalación (activado por defecto, se apaga en Ajustes).

### 5.5 Adaptación por plataforma

Misma marca, convenciones nativas en cada sistema:

- **iOS:** título grande que se contrae al hacer scroll en Hoy, Clases y Bitácora. La Hoja de clase se presenta como `formSheet` con detents (`sheetAllowedDetents: [0.6, 1]`) y grabber. Iconos SF Symbols. Gesto de deslizar para volver.
- **Android:** Material 3. Barra superior, barra de navegación inferior con indicador en píldora para la pestaña activa, hojas inferiores con asa, ripple en todo lo que se toca, edge-to-edge (por defecto en SDK 57) y botón atrás del sistema. Cambia `predictiveBackGestureEnabled` a `true` en `app.json` y verifica que funcione.
- Pestañas: usa las pestañas nativas de Expo Router (`NativeTabs`) si están disponibles y estables en el SDK 57. Si no, usa `Tabs` con estilos por plataforma.
- Crea un componente `Icon` con nombres semánticos (`anchor`, `chair`, `play`, `pause`, `mirror`, `turtle`, `captions`, `voice`, `close`, `check`, `settings`, `bell`, `lock`...) que en iOS use `expo-symbols` y en Android Material Symbols (por ejemplo con `@expo/vector-icons`). Los iconos se cambian en un solo lugar.

### 5.6 Componentes base (en `src/ui/`)

`Text` (con las variantes de la escala), `Button` (primary en `sol`, secondary, quiet), `Card`, `Chip` (seleccionable), `Sheet`, `ListRow`, `ProgressSegments`, `AnchoredBadge`, `TideWeek` (mareas de la semana), `SeaStateIcon`, `EmptyState` y `Screen` (márgenes, safe areas y título grande en iOS).

Cada componente tiene estados presionado, deshabilitado y foco, y lleva `accessibilityRole` y `accessibilityLabel`. Nada de librerías de UI completas: los componentes son nuestros.

## 6. Pantallas

Los textos de abajo son el borrador en español. Crea las claves en es, en y de con un tono cálido y directo: tuteo en español, "du" en alemán.

### 6.1 Hoy (pestaña 1, pantalla de inicio)

- Saludo según la hora: "Buenos días", "Buenas tardes" o "Buenas noches".
- Título: **"¿Cuánto espacio tienes hoy?"**
- Tres tarjetas grandes, una por modo. Cada una lleva un diagrama visto desde arriba (vista en planta) dibujado con `react-native-svg` y su medida real:
  - **Silla**: "Basta una silla". Diagrama: la silla vista desde arriba, con la persona. Medida: "50 × 50 cm".
  - **En el lugar**: "Un metro cuadrado". Diagrama: cuadrado punteado con dos huellas. Medida: "1 m²".
  - **Forma completa**: "Una sala o un parque". Diagrama: un arco de huellas. Medida: "≈ 2 × 3 m".
- Cada tarjeta muestra la duración de la próxima clase y la insignia "Anclada" (icono de ancla) si funciona sin internet; si no, el tamaño de descarga.
- Si hay historial: "Seguir donde quedaste", con la última clase.
- **Mareas de la semana:** 7 marcas pequeñas (L, M, X, J, V, S, D) que se llenan de agua cuando hubo práctica ese día. Meta por defecto: 3 por semana. Texto: "2 de 3 mareas esta semana". Nunca "perdiste tu racha".
- La primera vez, en lugar de las mareas, aparece una línea discreta: "Sin cuenta. Funciona sin internet."
- Icono de ajustes arriba a la derecha.
- Tocar una tarjeta abre la Hoja de clase de la siguiente clase de ese modo.

### 6.2 Hoja de clase

Se abre encima de Hoy (formSheet en iOS, bottom sheet en Android).

- Etiqueta: "SILLA · PRINCIPIANTE".
- Título: "Primeros movimientos". Debajo: "6 min · 3 movimientos · Anclada".
- Lista de movimientos con sus nombres tradicionales y duración: "Comienzo" 1:30, "Manos de nube" 3:30, "Cerrar el tai chi" 1:00.
- Fila opcional "¿Algo que cuidar hoy?" con chips: Hombros, Espalda, Rodillas, Muñecas. Por ahora se guarda la preferencia y el instructor la menciona por voz ("Hoy cuidamos los hombros: sube los brazos solo hasta donde sea cómodo"). No bloquea nada.
- Botón principal: **"Empezar"** (en `sol`). Debajo, un enlace discreto: "Solo voz" (para practicar sin mirar la pantalla).
- La primera vez, una línea de seguridad: "Muévete sin dolor. Si algo duele, para." con un enlace "Más" a una nota breve de salud.

### 6.3 Reproductor

Pantalla completa sobre escenario oscuro (`abismo` con degradado radial hacia `#06232B`). Barras del sistema ocultas o translúcidas. Pantalla siempre encendida con `expo-keep-awake`. Funciona en vertical y en horizontal (en horizontal el instructor ocupa más espacio y los controles pasan al costado).

- Centro: `InstructorStage` (ver sección 7).
- **La marea:** detrás del instructor hay agua cuyo nivel sube al inhalar y baja al exhalar, con una línea de espuma dorada en la superficie. Encima, la palabra "Inhala" o "Exhala", grande y con poca opacidad. Se puede seguir la clase solo mirando el agua.
- Subtítulos grandes (estilo title) con la indicación del momento, por ejemplo: "Sube los brazos despacio, como si flotaran en el agua." Activados por defecto (en un barco el motor hace ruido).
- Arriba: nombre del movimiento ("Manos de nube · 2 de 3") y segmentos de progreso, uno por movimiento.
- Abajo, controles grandes: retroceder 10 s, pausa/reproducir (72 pt) y adelantar 10 s. Fila secundaria: velocidad con icono de tortuga (0,5× · 0,75× · 1×), espejo, subtítulos y vista (frente o lado).
- En iOS los controles secundarios van en una cápsula translúcida. En Android son botones tonales y la pausa tiene forma de FAB.
- Los controles se ocultan tras 4 s sin tocar la pantalla y vuelven con un toque. El botón para salir nunca se oculta.
- En los primeros 30 s de la primera clase, la voz presenta los controles ("Si quieres ir más lento, toca la tortuga, abajo a la izquierda") y el control mencionado brilla con un anillo dorado. Ese es todo el tutorial.
- Salir a mitad de clase abre una hoja: "¿Terminar por hoy?" con "Seguir practicando" (principal) y "Terminar". Si se practicaron más de 2 minutos, la sesión se guarda en la Bitácora igual.
- Modo **Solo voz**: la pantalla se oscurece casi por completo y queda un único botón grande de pausa. El audio guía todo.

### 6.4 Final de clase

- Animación breve: la marea sube y se calma. Título: **"Hecho."** Debajo: "6 minutos de calma". Sin confeti ni puntos.
- "¿Cómo está tu mar?": estado de ánimo opcional con la escala del mar, cada opción con una ola dibujada de distinta altura: "En calma", "Marejadilla", "Marejada", "Mar picado". Un toque, o "Saltar".
- Solo la primera vez: "¿Te recuerdo mañana a esta hora?" con "Sí, a las 7:30" y "Otra hora". Aquí, y solo aquí, se pide el permiso de notificaciones (`expo-notifications`, notificación local).
- Siguiente paso: tarjeta con la próxima clase sugerida.
- Desde la tercera clase completada, si el ánimo fue "En calma", pide reseña con `expo-store-review` (como máximo una vez cada 90 días).
- Desde la segunda clase completada: una tarjeta suave de Manta completa (nunca un modal que bloquee).

### 6.5 Bitácora (pestaña 3)

El cuaderno de bitácora de un barco, en versión amable.

- Arriba: tres datos ("21 min esta semana", "3 de 3 mareas", "En calma, tu mar más frecuente") y las mareas de la semana.
- Lista agrupada por día, con fecha local ("jue 8 oct"): hora, clase, duración e icono del estado del mar.
- Estado vacío: "Tu bitácora empieza con tu primera clase." y un botón para empezar.
- Las mareas y los totales se calculan con funciones puras que tienen tests.

### 6.6 Clases (pestaña 2)

- Control segmentado arriba: Silla · En el lugar · Forma completa.
- Programas con sus clases. Cada clase muestra duración, la insignia Anclada o el tamaño de descarga ("18 MB"), y un candado discreto si es premium.
- Botón destacado: "Preparar para zarpar".
- En esta fase el catálogo viene de un JSON local de ejemplo con la forma de `CatalogManifest` de `@manta/shared`. Deja `api.catalog` listo para reemplazarlo después.

Catálogo de ejemplo del programa gratuito "Silla · Principiante": Primeros movimientos (6 min), Manos de nube sentado (8 min), Abrir el pecho (7 min), La grulla abre las alas (8 min), Cepillar la rodilla (9 min). Agrega dos programas premium de ejemplo para En el lugar y Forma completa.

### 6.7 Preparar para zarpar

Para quien se va días sin señal. Es la función que mejor cuenta la historia de Manta.

- "¿Cuántos días vas a estar sin señal?": control segmentado con 7, 14, 21 y 30.
- Manta propone un plan (por ejemplo, 21 días: 12 clases de Silla y En el lugar) y muestra el peso total y el espacio libre: "312 MB · tienes 18 GB libres".
- Botón **"Anclar todo"**. Progreso por clase y total. Se puede salir de la pantalla y sigue.
- En esta fase la descarga es simulada (progreso falso), pero detrás de la misma interfaz que tendrá la descarga real con `expo-file-system` y verificación de hash contra el manifest.
- Al terminar: "Todo anclado. Buen viaje."

### 6.8 Manta completa (paywall simulado)

- Título: "Manta completa". Subtítulo: "Todas las clases, ancladas para el mar."
- Tres beneficios con icono: los tres espacios y todos los programas; anclar todo sin límite; planes para espalda, equilibrio y sueño (pronto).
- Planes (precios de ejemplo; en la versión real vienen de la tienda): **Anual 39,99 US$** (3,33 US$ al mes, 7 días gratis), preseleccionado; **De por vida 89,99 US$** (un solo pago); **Mensual 6,99 US$**.
- Botón: "Probar 7 días gratis". Debajo, en letra legible: cuándo se cobra y cómo cancelar con las palabras de cada tienda (iOS: "Ajustes › Apple ID › Suscripciones"; Android: "Google Play › Pagos y suscripciones"), y los enlaces Restaurar compras, Regalar Manta (por ahora "Muy pronto"), Términos y Privacidad.
- Siempre se puede cerrar. Nunca aparece antes de completar la primera clase.
- Lo gratis es generoso: todo el programa Silla · Principiante (5 clases) y todas las funciones del reproductor (velocidad, espejo, subtítulos, solo voz) son gratis para siempre.

### 6.9 Ajustes

Idioma (el del teléfono o uno elegido), apariencia (automática, clara, modo cabina), tamaño de subtítulos, háptica de respiración, voz (provisional: la del sistema), recordatorio (hora y días), espacio que ocupan las clases ancladas con opción de borrar, restaurar compras, nota de salud y versión.

## 7. Reproductor: arquitectura

### 7.1 Extiende la línea de tiempo en `@manta/shared`

Agrega campos opcionales sin romper `schemaVersion: 1` (todavía no hay clases publicadas):

- En `TimelineSegmentSchema`: `title` (nombre del movimiento), `captions: [{ atMs, text }]` y `breath: [{ atMs, phase: 'in' | 'out' | 'hold', durationMs }]`, con tiempos relativos al inicio del segmento.

Actualiza `content/ejemplos/timeline.ejemplo.json` con los campos nuevos.

### 7.2 Motor puro: `createTimelinePlayer`

Va en `packages/shared/src/player/`, sin React ni Expo. Recibe un `LessonTimeline` y el tiempo actual desde afuera (determinista). Expone el estado en cada instante: segmento actual y su progreso, subtítulo actual, fase de respiración con su avance de 0 a 1, eventos (`segment-start`, `cue`, `breath-in`, `ended`) y las operaciones `play`, `pause`, `seek` y `setRate`.

Agrega Vitest a `packages/shared` y cubre con tests: el paso entre segmentos, seek hacia atrás, cambio de velocidad a mitad de un segmento, el final de la clase y timelines inválidos.

### 7.3 Capa de app

- `usePlayer(timeline)` en `src/features/player/` conecta el motor con un reloj de Reanimated (`useFrameCallback`) y con el audio.
- Audio: si el segmento trae `cue` y el archivo existe, se reproduce con `expo-audio`. Si no, los subtítulos se leen con `expo-speech` (voz del sistema; funciona sin red en la mayoría de los teléfonos). La velocidad afecta a ambos.
- `InstructorStage` reproduce el clip del segmento con `expo-video` (en bucle, sin sonido), con velocidad, espejo y vista de frente o de lado.
- Sin video, el escenario muestra el nombre del movimiento, grande y sereno, mientras la voz, los subtítulos y la marea guían la clase. Nada de figuras dibujadas ni personajes 3D.

### 7.4 Primera clase empaquetada

- `apps/mobile/assets/lessons/sentado-primeros-movimientos/{es,en,de}/timeline.json`: 6 minutos y 3 segmentos (Comienzo, Manos de nube sentado, Cerrar el tai chi), con subtítulos y una respiración cada 4 a 6 segundos.
- Al instalar, la clase queda registrada como anclada en SQLite (`downloaded_lessons` con el `local_path` del asset).
- Escribe los textos como un instructor calmado: frases cortas, imperativo amable, imágenes del agua ("como si el agua sostuviera tus brazos").
- Deja un comentario visible en el archivo: el guion debe revisarlo un instructor de tai chi certificado antes de publicar.

## 8. Datos locales

Nueva migración (la número 2) en `src/db/database.ts`:

- En `practice_sessions`: `mood TEXT NULL`, `space_mode TEXT NOT NULL DEFAULT 'SEATED'` y `care_tags TEXT NULL` (JSON).
- Tabla `settings` (clave y valor) para las preferencias: idioma, apariencia, háptica, recordatorio, meta semanal, `first_lesson_completed_at` y `sessions_completed`.

Envuelve el acceso en repositorios pequeños (`sessionsRepo`, `settingsRepo`). Los cálculos (mareas, totales) son funciones puras con tests.

## 9. Compras simuladas y analítica

- `src/features/paywall/purchases.ts`: interfaz `PurchasesService` (`getOfferings`, `purchase`, `restore`, `isPremium`) con una implementación `FakePurchases`. Diseña la interfaz pensando en RevenueCat: entitlement `premium` y acceso premium guardado para funcionar sin señal.
- `src/lib/analytics.ts`: una función `track(event, props)` que por ahora solo escribe en consola en desarrollo. Eventos: `app_opened`, `space_selected`, `lesson_sheet_opened`, `lesson_started`, `lesson_completed` (con duración), `lesson_abandoned` (con el segundo en que se salió), `mood_logged`, `reminder_enabled`, `paywall_viewed`, `trial_started` y `voyage_prepared`. Con estas métricas se van a tomar las decisiones. No recojas datos personales.

## 10. Accesibilidad (criterios de aceptación)

- Todo se puede usar con VoiceOver y TalkBack, con etiquetas en el idioma activo. Con el lector de pantalla activo, el reproductor anuncia los subtítulos.
- Todo funciona con la fuente del sistema al 200 % sin cortar texto (con scroll donde haga falta).
- Contraste mínimo de 4.5:1 para texto y 3:1 para iconos.
- Ningún gesto es la única forma de hacer algo.

## 11. Cómo trabajar

1. Crea la rama `feat/fase-1-primera-ola`.
2. Escribe primero un plan corto (una pantalla como máximo) con el orden de trabajo y las dependencias que vas a instalar. Después sigue sin esperar confirmación, salvo que algo de este documento sea imposible: en ese caso explica por qué y propone una alternativa.
3. Orden sugerido: tokens y tipografía → componentes base → navegación y pestañas → motor de línea de tiempo con tests → reproductor (marea, voz, subtítulos y escenario de video) → primera clase empaquetada → final de clase y bitácora → clases y zarpar → paywall → ajustes → pulido y accesibilidad.
4. Un commit por paso, con mensajes en español en estilo conventional commits.
5. La app usa módulos nativos y necesita build de desarrollo: `pnpm exec expo run:android`, `pnpm exec expo run:ios` (si hay Mac) o `eas build --profile development`. Si no puedes correr un emulador, dilo y verifica con typecheck, tests y `pnpm exec expo export` para ambas plataformas.
6. Cuando puedas correr la app, toma capturas de cada pantalla en iOS y Android, en modo claro y modo cabina, y compáralas con este documento. Corrige lo que no se vea terminado.
7. Al final entrega: qué quedó hecho, qué quedó simulado, las capturas y una lista de decisiones abiertas.

## 12. "Hecho" significa

- Instalación limpia en modo avión: abrir → Silla → Empezar → la clase de 6 minutos completa, con marea, subtítulos y voz → Final → la sesión aparece en la Bitácora. Sin errores ni pantallas vacías.
- Ninguna pantalla pide cuenta. El paywall nunca aparece antes de completar una clase.
- Textos completos en es, en y de.
- `pnpm typecheck`, `pnpm lint` y `pnpm test` pasan.
- Se ve nativa en iOS y en Android, en modo claro y modo cabina, con la fuente al 100 % y al 200 %.

## 13. Lo que no debes hacer

- No agregues login, correo ni encuestas de bienvenida.
- No uses rachas que se pierden, contadores en rojo ni notificaciones insistentes (como máximo una al día y solo si la persona la pidió).
- No uses estética de gimnasio, emojis como iconos ni confeti.
- No agregues dependencias pesadas sin justificarlo en el plan.
- No prometas beneficios médicos en los textos ("cura", "trata", "elimina el dolor"). Usa "suave", "a tu ritmo", "para moverte mejor".
