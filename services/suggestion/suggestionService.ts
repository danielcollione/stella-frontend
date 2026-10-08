import type { SuggestionItem } from '@/types/chat';

export type { SuggestionItem } from '@/types/chat';

// Banco com 12 sugestões variadas de estilo
export const SUGGESTIONS_POOL: SuggestionItem[] = [
  { id: '1', emoji: '👖', label: 'Look casual com jeans', prompt: 'Sugerir um look casual elegante com jeans' },
  { id: '2', emoji: '💼', label: 'Look para reunião', prompt: 'O que vestir para uma reunião profissional importante?' },
  { id: '3', emoji: '🎨', label: 'Paleta de cores', prompt: 'Como identificar a paleta de cores ideal para o meu tom de pele?' },
  { id: '4', emoji: '🧥', label: 'Sobreposição de inverno', prompt: 'Como fazer sobreposições sofisticadas para os dias de frio?' },
  { id: '5', emoji: '👟', label: 'Tênis no trabalho', prompt: 'Como usar tênis em um ambiente de trabalho mantendo a elegância?' },
  { id: '6', emoji: '🍸', label: 'Visual para evento noturno', prompt: 'Ideias de visual elegante para um jantar especial à noite' },
  { id: '7', emoji: '🧵', label: 'Combinação de texturas', prompt: 'Dicas para harmonizar diferentes tecidos e texturas no mesmo look' },
  { id: '8', emoji: '🌿', label: 'Guarda-roupa cápsula', prompt: 'Como construir um guarda-roupa cápsula minimalista e funcional?' },
  { id: '9', emoji: '🕶️', label: 'Acessórios coringa', prompt: 'Quais acessórios essenciais ajudam a elevar qualquer visual?' },
  { id: '10', emoji: '☀️', label: 'Look para dia quente', prompt: 'Sugestões de visual leve, fresco e estiloso para dias de calor' },
  { id: '11', emoji: '👞', label: 'Calçados versáteis', prompt: 'Quais calçados coringa são indispensáveis para qualquer estilo?' },
  { id: '12', emoji: '✈️', label: 'Look para viagem', prompt: 'Como compor um visual confortável e elegante para viajar?' },
];

export const suggestionService = {
  /**
   * Retorna 'count' sugestões aleatórias garantindo que nenhuma delas esteja nos 'excludeIds'
   */
  getRandomSet(count: number = 3, excludeIds: string[] = []): SuggestionItem[] {
    const available = SUGGESTIONS_POOL.filter((item) => !excludeIds.includes(item.id));
    // Fisher-Yates: embaralhamento uniforme (o sort com Math.random é enviesado)
    const shuffled = [...available];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, count);
  },
};