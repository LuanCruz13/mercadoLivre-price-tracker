"use client";

import { useState } from "react";
import { Search, Activity, Link as LinkIcon } from "lucide-react";


export default function Home() {
  const [url, setUrl] = useState("");

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("URL pronta para envio:", url);
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      {/* header */}
      <header className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-blue-600">
            <Activity strokeWidth={2.5} size={28} />
            <h1 className="text-xl font-bold tracking-tight text-slate-800">
              Price <span>Tracker</span>
            </h1>
          </div>
        </div>
      </header>

      {/* Busca - Pesquisa*/}
      <section className="max-w-3xl mx-auto px-6 pt-20 pb-12 text-center">
        <h2 className="text-3xl font-extrabold text-slate-800 mb-4 tracking-tight">Cole o link. Nós vigiamos o preço.</h2>
        <p className="text-slate-500 mb-8 text-lg">Acompanhe o histórico real de produtos do Mercado Livre e fuja de falsas promoções</p>

        <form
          onSubmit={handleTrack}
          className="relative flex items-center w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-2 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]"
        >
          <div className="flex items-center justify-center pl-4 pr-2 text-gray-400">
            <LinkIcon size={20} />          
          </div>

          <input 
            type="url" 
            required 
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://produto.mercadolivre.com.br/..."
            className="flex-1 bg-transparent border-none py-3 px-2"
          />

          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-xl flex items-center gap-2 transition-colors disabled:opacity-70"
          >
              <Search size={18} />
              <span>Rastrear</span>
          </button>
        </form>
      </section>

    </main>
  );
}