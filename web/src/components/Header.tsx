import { Activity, LineChart, TrendingDown, Target } from "lucide-react";

export function Header(){
  return(
    <header className="bg-white border-b border-gray-100 shadow-sm">
    <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-center">
      <div className="flex items-center gap-2 text-blue-600">
      <LineChart strokeWidth={2.5} size={28} />
        <h1 className="text-xl font-bold tracking-tight text-slate-800">
          Meli <span>Tracker - Rastreador de Preços do Mercado Livre</span>
        </h1>
      </div>
    </div>
  </header>
  )
    
}