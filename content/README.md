# Producción de clases

Cada clase es un paquete de archivos que la app descarga y reproduce sin internet.

```
content/
├── fuentes/    Mocap original, personaje y archivos de Blender (no van a la app)
├── guiones/    Texto de la voz por clase e idioma
├── build/      Paquetes listos para subir (ignorado por git)
├── ejemplos/   Ejemplo de línea de tiempo válida
└── scripts/    Herramientas del pipeline
```

## Pasos para una clase nueva

1. En Blender: adapta el mocap al personaje, crea las versiones sentado o en el lugar y exporta cada movimiento como `.glb`.
2. Genera la voz de cada segmento a partir del guion (un archivo por segmento e idioma).
3. Arma la carpeta del paquete:
   `content/build/lessons/<slug>/<locale>/v<version>/` con `timeline.json`, los `.glb` y la carpeta `voz/`.
   La línea de tiempo debe cumplir `LessonTimelineSchema` de `@manta/shared`.
4. Genera el manifest con hashes: `pnpm content:manifest <carpeta> <slug> <locale> <version>`.
5. Sube la carpeta a R2 con el mismo prefijo y registra el paquete en la tabla `LessonPackage`.

Para probar en local sin R2: `pnpm content:serve` sirve `content/build` en el puerto 8787.
