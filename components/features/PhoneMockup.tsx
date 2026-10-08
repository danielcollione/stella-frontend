import { Camera, Image as ImageIcon, ArrowUp, Menu, Sparkles, Shirt } from 'lucide-react';

export function PhoneMockup() {
  return (
    <div className="relative w-full max-w-[360px]">
      {/* Elementos Flutuantes */}
      <div className="hidden sm:flex absolute -left-20 top-24 bg-white/90 backdrop-blur-md border border-stone-200 px-4 py-2 rounded-2xl shadow-sm items-center gap-2 text-xs text-stone-800 animate-bounce">
        <Sparkles className="w-4 h-4 text-amber-600" />
        <span>Look Casual Gerado</span>
      </div>
      <div className="hidden sm:flex absolute -right-20 top-48 bg-white/90 backdrop-blur-md border border-stone-200 px-4 py-2 rounded-2xl shadow-sm items-center gap-2 text-xs text-stone-800 animate-pulse">
        <Shirt className="w-4 h-4 text-stone-700" />
        <span>Guarda-roupa Sincronizado</span>
      </div>

      {/* Estrutura do Telemóvel */}
      <div className="w-full bg-stone-900 p-3 rounded-[48px] shadow-2xl border-4 border-stone-300/40 relative z-10">
        <div className="bg-[#FAF8F5] rounded-[38px] overflow-hidden min-h-[640px] flex flex-col justify-between p-5 border border-stone-200/50">
          
          {/* Header do App Mockup */}
          <div className="flex justify-between items-center pt-2">
            <div className="p-2 text-stone-700">
              <Menu className="w-5 h-5" />
            </div>
            <span className="font-serif italic text-lg text-stone-900">stella</span>
            <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center text-xs font-semibold text-stone-700">
              D
            </div>
          </div>

          {/* Chat Content Mockup */}
          <div className="my-auto text-center px-2">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-stone-100 border border-stone-200/80 flex items-center justify-center shadow-inner">
              <span className="font-serif italic text-2xl text-stone-800">S</span>
            </div>
            <h2 className="text-xl font-serif text-stone-900">Olá, Daniel</h2>
            <p className="text-xs text-stone-500 mt-1 font-light">
              Como posso elevar o seu estilo hoje?
            </p>

            <div className="mt-6 flex flex-wrap gap-2 justify-center">
              <span className="text-[11px] bg-white border border-stone-200/80 px-3 py-1.5 rounded-full text-stone-700 shadow-sm cursor-pointer hover:border-stone-400 transition-colors">
                👔 Look para evento casual
              </span>
              <span className="text-[11px] bg-white border border-stone-200/80 px-3 py-1.5 rounded-full text-stone-700 shadow-sm cursor-pointer hover:border-stone-400 transition-colors">
                ✨ Combinar nova peça
              </span>
            </div>
          </div>

          {/* Input Bar Mockup */}
          <div className="bg-white/90 backdrop-blur-md border border-stone-200/90 rounded-3xl p-2.5 shadow-sm">
            <div className="px-3 pt-1 pb-2">
              <p className="text-xs text-stone-400 font-light">Converse com a Stella...</p>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-stone-100">
              <div className="flex gap-1">
                <div className="p-2 text-stone-500 rounded-full cursor-pointer hover:bg-stone-100 transition-colors">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div className="p-2 text-stone-500 rounded-full cursor-pointer hover:bg-stone-100 transition-colors">
                  <Camera className="w-4 h-4" />
                </div>
              </div>
              <div className="p-2 bg-stone-900 text-white rounded-full shadow-sm cursor-pointer hover:bg-stone-800 transition-colors">
                <ArrowUp className="w-4 h-4" />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}