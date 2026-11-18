import type { ReactNode } from 'react';
import type { MarkupBlock, MarkupWord } from '@/lib/chatMarkup';

type ChatMarkupProps = {
  blocks: readonly MarkupBlock[];
  /** Muestra solo las primeras N palabras (respuesta detenida, P-83). Sin valor, todas. */
  maxWords?: number;
};

/**
 * Presenta los bloques de lib/chatMarkup sobre la burbuja azul (P-96):
 * párrafos separados, listas con viñetas en verde cyan y negritas en verde cyan claro.
 * Cada palabra es un `span[data-word]`, que TypewriterText anima una por una; la última de cada
 * bloque lleva `data-block-end` para hacer una pausa como al cambiar de renglón.
 */
export default function ChatMarkup({ blocks, maxWords = Infinity }: ChatMarkupProps) {
  let index = 0;

  const renderWords = (words: readonly MarkupWord[]): ReactNode[] => {
    const nodes: ReactNode[] = [];
    words.forEach((word, position) => {
      if (index >= maxWords) return;
      index += 1;
      if (word.spaceBefore) nodes.push(' ');
      nodes.push(
        <span
          key={position}
          data-word
          data-block-end={position === words.length - 1 ? '' : undefined}
          className={`inline-block ${word.bold ? 'font-semibold text-teal-200' : ''}`}
        >
          {word.text}
        </span>,
      );
    });
    return nodes;
  };

  // Agrupa los elementos de lista seguidos en una sola <ul>.
  const groups: { kind: 'paragraph' | 'list'; blocks: MarkupBlock[] }[] = [];
  for (const block of blocks) {
    const last = groups.at(-1);
    if (block.kind === 'item' && last?.kind === 'list') last.blocks.push(block);
    else groups.push({ kind: block.kind === 'item' ? 'list' : 'paragraph', blocks: [block] });
  }

  return (
    <div className="flex flex-col gap-2.5">
      {groups.map((group, groupIndex) => {
        if (index >= maxWords) return null;
        if (group.kind === 'paragraph') {
          return <p key={groupIndex}>{renderWords(group.blocks[0].words)}</p>;
        }
        return (
          <ul key={groupIndex} className="list-disc space-y-1 pl-5 marker:text-teal-300">
            {group.blocks.map((block, itemIndex) =>
              index >= maxWords ? null : <li key={itemIndex}>{renderWords(block.words)}</li>,
            )}
          </ul>
        );
      })}
    </div>
  );
}
