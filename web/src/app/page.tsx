"use client";

import { useEffect, useState } from "react";
import { Search, Activity, Link as LinkIcon } from "lucide-react";

import { Header } from "@/components/Header";
import { SearchBar } from "@/components/SearchBar";

import { Product } from "@/interfaces/product";
import { Loader2 } from "lucide-react";

import { api } from "@/services/api";
import { ProductCard } from "@/components/ProductCard";


export default function Home() {
  
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/products");
      setProducts(response.data);
      console.log(response.data);
    } catch (error){
      console.error("Erro ao buscar produtos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);


  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      
      <Header/>
      <SearchBar onProductTracked={fetchProducts} />

      <section className="max-w-5xl mx-auto px-6 mt-8">
        <h3 className="text-xl font-bold text-slate-800 mb-6 border-b border-gray-200 pb-2 inline-block">
          Produtos Monitorados
        </h3>

        {isLoading ?  (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <Loader2 size={32} className="animate-spin text-blue-600 mb-4"/>
            <p>Carregando sua vitrine...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="">
            <p>Nenhum produto registrado ainda</p>
            <p>Cole um link acima para começar!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>


    </main>
  );
}