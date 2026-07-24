"use client";

import { PriceHistory } from "@/interfaces/product";
import { formatCurrency } from "@/utils/formatters";
import {
    LineChart, 
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,  
} from "recharts";

interface PriceChartProps{
    data: PriceHistory[];
}

export function PriceChart({ data }: PriceChartProps) {

    const groupedData = data.reduce((acc, item) => {
        const date = new Date(item.createdAt);
        const shortDate = date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

        
        acc[shortDate] = {
            ...item,
            shortDate
        };

        return acc;
    }, {} as Record<string, any>);


    const chartData = Object.values(groupedData);


  return (
    <div className="h-72 w-full mt-6">
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{top: 5, right: 5, bottom: 5, left:0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />

                <XAxis 
                    dataKey="shortDate"
                    tick={{ fontSize: 12, fill: "#94a3b8"}}
                    axisLine={false}
                    tickLine={false}
                    dy={10} 
                />

                <YAxis 
                    domain={['auto', 'auto']}
                    tickFormatter={(value) => `R$ ${value}`}
                    tick={{ fontSize: 12, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                    width={85}
                />

                <Tooltip 
                    formatter={(value: any) => [formatCurrency(Number(value)), "Preço"]}
                    labelFormatter={(label) => `Data: ${label}`}
                    contentStyle={{
                        borderRadius: '12px',
                        border: 'none',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                />

                <Line 
                    type="monotone"
                    dataKey="price"
                    stroke="#2563eb"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: "#fff"}}
                    activeDot={{ r:6 }}  
                />
            </LineChart>
        </ResponsiveContainer>
    </div>
  );
}