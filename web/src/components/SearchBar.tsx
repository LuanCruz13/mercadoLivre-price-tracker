"use client";

import { useState } from "react";
import { Search, Link as LinkIcon, Loader2, AlertCircle, CheckCircle2, RefreshCw } from "lucide-react";
import { api } from "@/services/api";

interface SearchBarProps{
    onProductTracked: () => void;
}


export function SearchBar({ onProductTracked }: SearchBarProps){
    
    const [url, setUrl] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    //sync
   


    const handleTrack = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        let finalUrl = url.trim()

        //validação: campo vazio
        if (!finalUrl){
            setError("Por favor, cole um link para rastrear.");
            return;
        }

        //padronização: caso o usuário não digitar o protocólo http, o sistema adiciona para ele automaticamente
        if (!finalUrl.startsWith("http://") && !finalUrl.startsWith("https://")){
            finalUrl = `https://${finalUrl}`
        }

        //validação-2: Verifica se é um link oficial e válido do ML
        if (!finalUrl.includes("mercadolivre.com.br") && !finalUrl.includes("mercadolivre.com")) {
            setError("Ops! O link precisa ser de um produto do Mercado Livre.");
            return;
        }


        try {
            setIsLoading(true);

            await api.post("/products", { url: finalUrl }, {
                headers: {
                    'x-api-key': process.env.NEXT_PUBLIC_API_SECRET_KEY
                }
            });

            setUrl("");
            onProductTracked();

          } catch (error) {
            console.error("Erro ao rastrear produto:", error);
            setError("Ocorreu um erro ao rastrear. Verifique o link e tente novamente.");
          } finally {
            setIsLoading(false);
        }
    }


    //sync



    return(
        <section className="max-w-3xl mx-auto px-6 pt-20 pb-12 text-center">
            <h2 className="text-3xl font-extrabold text-slate-800 mb-4 tracking-tight">Cole o link. Nós vigiamos o preço.</h2>
            <p className="text-slate-500 mb-8 text-lg">Acompanhe o histórico real de produtos do Mercado Livre e fuja de falsas promoções</p>

            <form
                onSubmit={handleTrack}
                className={`relative flex items-center w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-2 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] ${ error ? "border-red-400" : "border-gray-100"}`}
            >
                <div className="flex items-center justify-center pl-4 pr-2 text-gray-400">
                    <LinkIcon size={20} />          
                </div>

                <input 
                    type="text" 
                    required 
                    value={url}
                    onChange={(e) => {
                        setUrl(e.target.value);
                        if(error) setError(null);
                    }}
                    disabled={isLoading}
                    placeholder="https://produto.mercadolivre.com.br/..."
                    className="flex-1 bg-transparent border-none py-3 px-2 focus:outline-none text-gray-700 placeholder-gray-400"
                />

                <button
                    type="submit"
                    disabled={isLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-xl flex items-center gap-2 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <span className="flex items-center gap-2">
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin">
                                Buscando...
                            </div>
                        </span>
                    ): (
                        <>
                            <Search size={18} />
                            <span>Rastrear</span>
                        </>
                    )}
                </button>
            </form>

            {/* ERROR MESSAGE */}
            {error && (
                <div className="max-w-2xl mx-auto mt-3 text-red-500 text-sm flex items-center justify-center gap-2 font-medium transition-all">
                    <AlertCircle size={16} />
                    {error}
              </div>
            )}
        </section>
    );
}