"use client";

import { useState } from "react";
import { Search, Link as LinkIcon, Loader2 } from "lucide-react";
import { api } from "@/services/api";

interface SearchBarProps{
    onProductTracked: () => void;
}


export function SearchBar({ onProductTracked }: SearchBarProps){
    
    const [url, setUrl] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleTrack = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!url) return;

        try {
            setIsLoading(true);
            //Enviando o campo 'url' esperado pela API do back-end
            await api.post("/products", { url });
            setUrl("");
            onProductTracked(); 
          } catch (error) {
            console.error("Erro ao rastrear produto:", error);
            alert("Ocorreu um erro ao rastrear. Verifique o link e tente novamente.");
          } finally {
            setIsLoading(false);
        }
    }


    return(
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
                disabled={isLoading}
                placeholder="https://produto.mercadolivre.com.br/..."
                className="flex-1 bg-transparent border-none py-3 px-2"
                />

                <button
                    type="submit"
                    disabled={isLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-xl flex items-center gap-2 transition-colors disabled:opacity-70"
                >
                    {isLoading ? (
                        <Loader2 size={18} className="animate-spin" />
                    ): (
                        <Search size={18} />
                    )}
                    <span className="hidden sm:inline">
                        {isLoading ? "Rastreando..." : "Rastrear"}
                    </span>
                </button>
            </form>
        </section>
    );
}