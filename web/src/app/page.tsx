"use client";

import { useEffect, useState } from "react";
import { Search, Activity, Link as LinkIcon } from "lucide-react";

import { Header } from "@/components/Header";
import { SearchBar } from "@/components/SearchBar";

import { Product } from "@/interfaces/product";
import { Loader2 } from "lucide-react";

import { api } from "@/services/api";
import { ProductCard } from "@/components/ProductCard";

import { Footer } from "@/components/Footer";


export default function Home() {
  
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);



  const fetchProducts = async (pageToFetch = 1, isLoadMore = false) => {
    try {
      if (isLoadMore){
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }     
      const response = await api.get(`/products?page=${pageToFetch}&limit=12`);
      
      const newProducts = response.data.data;
      const paginationMeta = response.data.meta;

      if (isLoadMore){
        setProducts((prevProducts) => [...prevProducts, ...newProducts]);
      } else {
        setProducts(newProducts);
      }

      setHasMore(paginationMeta.hasMore);
      setPage(pageToFetch);

    } catch (error){
      console.error("Erro ao buscar produtos:", error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);


  return (
    <main className="min-h-screen bg-[#F8FAFC] flex flex-col">
      
      <Header/>
      <SearchBar onProductTracked={() => fetchProducts(1)} />

      <section className="max-w-5xl mx-auto w-full px-6 mt-8 pb-12">
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
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* */}
            {hasMore && (
              <div className="flex justify-center mt-12">
                <button
                  onClick={() => fetchProducts(page + 1, true)}
                  disabled={isLoadingMore}
                  className="bg-white border border-gray-200 text-blue-600 hover:bg-blue-50 hover:border-blue-200 font-medium py-3 px-8 rounded-xl flex items-center gap-2 transition-all shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Carregando...
                    </>
                  ) : (
                    "Carregar mais produtos"
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </section>

      <Footer />
    </main>
  );
}