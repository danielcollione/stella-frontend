"use client";

import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatMessageContentProps {
  content: string;
  isStella: boolean;
  isNew?: boolean;
}

export function ChatMessageContent({ content, isStella, isNew }: ChatMessageContentProps) {
  // Inicializa o estado diretamente na montagem (evita re-render em cascata no useEffect)
  const [displayedText, setDisplayedText] = useState(() => 
    isStella && isNew ? '' : content
  );

  useEffect(() => {
    // Se não for uma mensagem nova da Stella, o valor inicial já é o próprio conteúdo
    if (!isStella || !isNew) return;

    const words = content.split(' ');
    let currentIndex = 0;
    let accumulated = '';

    const interval = setInterval(() => {
      if (currentIndex < words.length) {
        accumulated += (currentIndex === 0 ? '' : ' ') + words[currentIndex];
        setDisplayedText(accumulated);
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, 25);

    return () => clearInterval(interval);
  }, [content, isStella, isNew]);

  return (
    <div className={`text-sm leading-relaxed ${isStella ? 'text-stone-800' : 'text-stone-50'}`}>
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={{
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
        }}
      >
        {displayedText}
      </ReactMarkdown>
    </div>
  );
}