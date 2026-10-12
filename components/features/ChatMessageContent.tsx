"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Element, ElementContent, Root } from 'hast';

interface ChatMessageContentProps {
  content: string;
  isStella: boolean;
  isNew?: boolean;
  after?: React.ReactNode; // complementos da resposta (ex: onde encontrar as peças): só depois do texto completo
}

// Resposta nova da Stella: o texto entra em frases curtas, cada uma clareando até ficar nítida (.stella-chunk)
const CHUNK_INTERVAL_MS = 85;
const CHUNK_MAX_WORDS = 7;
const DONE_MARK = 'data-reveal-done';

// "Aqui está um texto, que pode ser adaptado." -> ["Aqui está um texto, ", "que pode ser adaptado."]
function phrases(text: string): string[] {
  const result: string[] = [];
  let current = '';
  let words = 0;
  for (const word of text.match(/\s*\S+\s*/g) ?? []) {
    current += word;
    words++;
    if (words >= CHUNK_MAX_WORDS || /[,.;:!?]\s*$/.test(word)) {
      result.push(current);
      current = '';
      words = 0;
    }
  }
  if (current) result.push(current);
  return result;
}

// Mostra só as primeiras `limit` frases da resposta, cada uma num <span> que esmaece ao entrar na tela.
// As frases já visíveis mantêm a mesma posição na árvore, então não reiniciam a animação.
function revealPhrases(limit: number) {
  return () => (tree: Root) => {
    let shown = 0;
    let truncated = false;

    const visit = (parent: Root | Element) => {
      const children: ElementContent[] = [];
      for (const child of parent.children as ElementContent[]) {
        if (shown >= limit) {
          truncated = true;
          break;
        }
        if (child.type === 'element') {
          visit(child);
          children.push(child);
        } else if (child.type === 'text' && child.value.trim()) {
          for (const phrase of phrases(child.value)) {
            if (shown >= limit) {
              truncated = true;
              break;
            }
            shown++;
            children.push({
              type: 'element', tagName: 'span', properties: { className: ['stella-chunk'] },
              children: [{ type: 'text', value: phrase }],
            });
          }
        } else {
          children.push(child);
        }
      }
      parent.children = children;
    };

    visit(tree);
    if (!truncated) {
      tree.children.push({ type: 'element', tagName: 'span', properties: { [DONE_MARK]: '', hidden: true }, children: [] });
    }
  };
}

// Fora do componente: referências estáveis, para o React não remontar (e reanimar) o texto a cada frase
function markdownComponents(isStella: boolean): Components {
  return {
    p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>,
    strong: ({ children }) => (
      <strong className={`font-semibold ${isStella ? 'text-stone-900' : 'text-white'}`}>
        {children}
      </strong>
    ),
    h3: ({ children }) => (
      <h3 className="font-serif text-base font-bold text-stone-900 mt-4 mb-2 pb-1 border-b border-stone-200/60">
        {children}
      </h3>
    ),
    ul: ({ children }) => <ul className="list-disc pl-5 my-2 space-y-1.5">{children}</ul>,
    ol: ({ children }) => <ol className="list-decimal pl-5 my-2 space-y-1.5">{children}</ol>,
    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  };
}

const STELLA_COMPONENTS = markdownComponents(true);
const USER_COMPONENTS = markdownComponents(false);
const REMARK_PLUGINS = [remarkGfm];

export function ChatMessageContent({ content, isStella, isNew, after }: ChatMessageContentProps) {
  const animated = isStella && !!isNew;
  const containerRef = useRef<HTMLDivElement>(null);
  const [visiblePhrases, setVisiblePhrases] = useState(1);
  const [revealed, setRevealed] = useState(!animated);

  useEffect(() => {
    if (!animated) return;

    const interval = window.setInterval(() => {
      if (containerRef.current?.querySelector(`[${DONE_MARK}]`)) {
        window.clearInterval(interval);
        setRevealed(true);
        return;
      }
      setVisiblePhrases((current) => current + 1);
    }, CHUNK_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [animated]);

  const rehypePlugins = useMemo(() => (animated ? [revealPhrases(visiblePhrases)] : []), [animated, visiblePhrases]);

  return (
    <>
      <div
        ref={containerRef}
        className={`text-sm leading-relaxed ${isStella ? 'text-stone-800' : 'text-stone-50'} ${animated ? 'stella-revealing' : ''}`}
      >
        <ReactMarkdown
          remarkPlugins={REMARK_PLUGINS}
          rehypePlugins={rehypePlugins}
          components={isStella ? STELLA_COMPONENTS : USER_COMPONENTS}
        >
          {content}
        </ReactMarkdown>
      </div>
      {(revealed || !animated) && after}
    </>
  );
}
