import { Product } from "@/interfaces/product";
import { formatCurrency } from "@/utils/formatters";
import { ExternalLink } from "lucide-react";
import Link from "next/link";

interface ProductCardProps{
    product: Product;
}

export function ProductCard({ product }: ProductCardProps){
    return(
        
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col gap-4 hover:shadow-md transition-shadow">
                <Link href={`/produto/${product.id}`} className="block">
                    <div className="flex gap-4 items-start">
                        <div className="w-24 h-24 shrink-0 rounded-xl overflow-hidden bg-white flex items-center justify-center border border-gray-100">
                            {product.thumbnail ? (
                                <img 
                                    src={product.thumbnail} 
                                    alt={product.title || "Produto"} 
                                    className="object-contain w-full h-full p-2" 
                                />
                            ) : (
                                <span className="text-gray-400 text-xs">Sem imagem</span>
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                            <h3 className="text-gray-800 font-medium text-sm line-clamp-2 mb-2" title={product.title || ""}>
                                {product.title || "Produto sem título"}
                            </h3>
                            <p className="text-2xl font-bold text-blue-600">
                                {formatCurrency(product.currentPrice)}
                            </p>
                        </div>
                    </div>
                

                    <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                            <span className="text-xs text-gray-400">
                                {product.history?.length || 0 } Registro(s)
                            </span>
                            <span className="text-blue-500 hover:text-blue-700 text-sm font-medium flex items-center gap-1 transition-colors">
                                Ver Detalhes
                            </span>
                    </div>

                </Link>
            </div>
        
    )
}