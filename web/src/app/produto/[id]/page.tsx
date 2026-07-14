"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Loader2 } from "lucide-react";
import { Header } from "@/components/Header";
import { Product } from "@/interfaces/product";
import { api } from "@/services/api";
import { formatCurrency } from "@/utils/formatters";



import { PriceChart } from "../../../components/PriceChart";


export default function ProductDetails({params}: {params: Promise<{id: string}>}) {

    const { id } = use(params);

    const [product, setProduct] = useState<Product | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchProductsDetails = async () => {
            try{
                const response = await api.get(`/products/${id}`);
                setProduct(response.data)
                console.log("sucesso");
                console.log(response.data);
            } catch (error){
                console.error("Erro ao buscar detalhes do produto:", error)
            } finally {
                setIsLoading(false);
            }
        };

        fetchProductsDetails();
    }, [id])
  
  return (
    <main className="min-h-screen bg-[#F8FAFC] pb-20">
        <Header />


        <section className="max-w-5xl mx-auto px-6 mt-8">
            <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors mb-6 font-medium">
                 <ArrowLeft size={18} /> Voltar para a vitrine
            </Link>
        

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-24 text-gray-500">
                    <Loader2 size={32} className="animate-spin text-blue-600 mb-4" />
                    <p>Carregando histórico do produto</p>
                </div>
            ): !product ? (
                <div className="text-center py-24 text-gray-500">
                    Produto não encontrado
                </div>
            ): (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mid:p-8">
                    <div className="flex flex-col md:flex-row gap-8 items-start">
                        <div className="w-full md:w-64 h-64 shrink-0 rounded-xl overflow-hidden bg-white flex items-center justify-center border border-gray-100 p-4">
                            {product.thumbnail ? (
                                <img src={product.thumbnail} alt={product.title || "Produto"} className="object-contain w-full h-full" />
                            ) : (
                                <span className="text-gray-400">Sem Imagem</span>
                            )}
                        </div>

                        {/* Informações Principais */}
                        <div className="flex-1 w-full">
                            <h1 className="text-2xl font-bold text-slate-800 mb-4">
                                {product.title}
                            </h1>

                            <div className="flex items-end gap-4 mb-6">
                                <div>
                                    <span className="text-sm text-slate-500 block mb-1">Preço atual</span>
                                    <span className="text-4xl font-extrabold text-blue-600">{formatCurrency(product.currentPrice)}</span>
                                </div>
                            </div>

                            <a 
                                href={product.permalink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 hover:bg-blue-100 font-semibold py-3 px-6 rounded-xl transition-colors"
                            >
                                Comprar no Mercado Livre <ExternalLink size={18} />
                            </a>
                        </div>
                    </div>

                    {/* GRÁFICO */}
                    <div className="mt-12 pt-8 border-t border-gray-100">
                        <h2 className="text-xl font-bold text-slate-800 mb-2">Histórico de Preços</h2>
                        <p className="text-slate-500 mb-6 text-sm">Acompanhe a variação do valor ao longo do tempo</p>


                        {product.history && product.history.length > 0 ? (
                            <PriceChart data={product.history} />
                        ): (
                            <p className="text-gray-400">Dados insuficientes para gerar o gráfico </p>
                        )}
                    </div>
                </div>
            )}
        </section>
    </main>
  );
}