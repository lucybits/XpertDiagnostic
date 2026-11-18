/**
 * Formato mínimo para los mensajes del asistente (P-96), para que no se vean como texto plano:
 *
 * - `**texto**` marca negritas (pueden abarcar varias palabras).
 * - Una línea que empieza con `- ` es un elemento de lista.
 * - Cualquier otra línea es un párrafo.
 *
 * Solo se interpreta este formato: no se acepta HTML, así que el texto nunca se inyecta como marcado.
 */

/** Una palabra; spaceBefore indica si en el texto había un espacio antes (no lo hay en "**negrita**."). */
export type MarkupWord = { text: string; bold: boolean; spaceBefore: boolean };

export type MarkupBlock = { kind: 'paragraph' | 'item'; words: MarkupWord[] };

/**
 * Convierte el texto con formato en bloques de palabras.
 * @pre text es una cadena (puede estar vacía).
 * @post ningún bloque queda vacío; el orden de las palabras es el del texto.
 * @post los marcadores `**` y `- ` no aparecen en las palabras.
 * @post la primera palabra de cada bloque tiene spaceBefore = false.
 */
export function parseChatMarkup(text: string): MarkupBlock[] {
  const blocks: MarkupBlock[] = [];
  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim();
    if (line === '') continue;
    const isItem = line.startsWith('- ');
    const content = isItem ? line.slice(2) : line;

    const words: MarkupWord[] = [];
    // Los tramos alternan normal / negrita en cada `**`. Se recuerda si había espacio entre palabras,
    // también al cruzar un `**` (así "**negrita**." no separa el punto).
    let pendingSpace = false;
    content.split('**').forEach((segment, index) => {
      const bold = index % 2 === 1;
      for (const token of segment.split(/(\s+)/)) {
        if (token === '') continue;
        if (/^\s+$/.test(token)) {
          pendingSpace = true;
          continue;
        }
        words.push({ text: token, bold, spaceBefore: words.length > 0 && pendingSpace });
        pendingSpace = false;
      }
    });
    if (words.length > 0) blocks.push({ kind: isItem ? 'item' : 'paragraph', words });
  }
  return blocks;
}

/** Número total de palabras de los bloques. */
export function countWords(blocks: readonly MarkupBlock[]): number {
  return blocks.reduce((total, block) => total + block.words.length, 0);
}
