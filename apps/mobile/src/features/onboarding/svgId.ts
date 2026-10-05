/** useId() trae caracteres que no sirven dentro de url(#…) en SVG; esto deja solo letras, números y guiones. */
export function svgId(reactId: string): string {
  return `g${reactId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
}
