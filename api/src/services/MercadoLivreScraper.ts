import axios from 'axios';
import { MercadoLivreAuth } from './MercadoLivreAuth';

interface MeliEntity {
    type: 'item' | 'product';
    id: string;
}

export class MercadoLivreScraper {
    
    // 1. Validador e Extrator de URLs
    private static extractEntity(input: string | { url: string }): MeliEntity {
        const targetUrl = typeof input === 'object' ? input.url : input;

        if (!targetUrl || typeof targetUrl !== 'string') {
            throw new Error('Formato de entrada inválido. É esperada uma URL em formato string.');
        }

        const productMatch = targetUrl.match(/\/p\/(MLB\d+)/i);
        if (productMatch && productMatch[1]) {
            return { type: 'product', id: productMatch[1].toUpperCase() };
        }

        const itemMatch = targetUrl.match(/MLB-?(\d+)/i);
        if (itemMatch && itemMatch[1]) {
            return { type: 'item', id: `MLB${itemMatch[1]}` };
        }

        throw new Error('ID do Mercado Livre não encontrado na URL fornecida.');
    }

    // 2. Interceptador de Autenticação (O Cérebro Autônomo)
    private static async fetchMeliAPI(url: string) {
        let token = await MercadoLivreAuth.getValidToken();

        try {
            return await axios.get(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } catch (error: any) {
            if (error.response?.status === 401) {
                console.log(`⚠️ Token expirado ao acessar a API. Acionando renovação automática...`);
                token = await MercadoLivreAuth.refreshToken();
                
                return await axios.get(url, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            }
            throw error; 
        }
    }

    // 3. O Motor de Extração de Dados
    public static async scrape(input: string | { url: string }) {
        const entity = this.extractEntity(input);
        const originalUrl = typeof input === 'object' ? input.url : input;

        try {
            // Lógica para Páginas de Catálogo (Products)
            if (entity.type === 'product') {
                const productResponse = await this.fetchMeliAPI(`https://api.mercadolibre.com/products/${entity.id}`);
                const data = productResponse.data;

                let realPrice = 0;

                // Tenta pegar da Buy Box (Vencedor Principal)
                if (data.buy_box_winner && data.buy_box_winner.item_id) {
                    const winnerItemId = data.buy_box_winner.item_id;
                    const itemResponse = await this.fetchMeliAPI(`https://api.mercadolibre.com/items/${winnerItemId}`);
                    realPrice = itemResponse.data.price;
                } 
                // Fallback: Pega o preço base oficial do primeiro vendedor
                else {
                    const itemsResponse = await this.fetchMeliAPI(`https://api.mercadolibre.com/products/${entity.id}/items`);
                    if (itemsResponse.data?.results?.length > 0) {
                        realPrice = itemsResponse.data.results[0].price;
                    }
                }

                return {
                    id: data.id,
                    title: data.name,
                    price: realPrice,
                    thumbnail: data.pictures?.[0]?.url || '',
                    permalink: data.permalink || originalUrl 
                };
            }

            // Lógica para Anúncios Diretos (Items)
            const itemResponse = await this.fetchMeliAPI(`https://api.mercadolibre.com/items/${entity.id}`);
            const data = itemResponse.data;

            return {
                id: data.id,
                title: data.title,
                price: data.price,
                thumbnail: data.secure_thumbnail || data.thumbnail,
                permalink: data.permalink
            };
            
        } catch (error: any) {
            const status = error.response?.status;
            
            if (status === 404) {
                throw new Error(`O anúncio/produto ${entity.id} não está ativo ou foi removido.`);
            }

            throw new Error(error.response?.data?.message || 'Falha na comunicação com a API do Mercado Livre.');
        }
    }
}