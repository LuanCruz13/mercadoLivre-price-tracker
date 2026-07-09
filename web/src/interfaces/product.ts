export interface PriceHistory{
    id: string;
    price: number;
    createdAt: string;
}

export interface Product {
    id: string;
    permalink: string;
    title: string | null;
    imageUrl: string | null;
    currentPrice: number | null;
    history?: PriceHistory[];
}

