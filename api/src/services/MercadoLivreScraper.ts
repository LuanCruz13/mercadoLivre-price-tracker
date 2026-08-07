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

        // captura tanto /p/MLB... quanto /up/MLBU...
        const productMatch = targetUrl.match(/\/(?:p|up)\/(MLB[A-Z0-9]+)/i);
        if (productMatch && productMatch[1]) {
            return { type: 'product', id: productMatch[1].toUpperCase() };
        }

        const itemMatch = targetUrl.match(/MLB-?(\d+)/i);
        if (itemMatch && itemMatch[1]) {
            return { type: 'item', id: `MLB${itemMatch[1]}` };
        }

        throw new Error('ID do Mercado Livre não encontrado na URL fornecida.');
    }

    // 2. Interceptador de Autenticação
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

    // 3. Web Scraper
    private static async fetchFrontendFallback(id: string, originalUrl: string) {
        console.log(`🛡️ Acionando Fallback de Frontend (HTML) para contornar o bloqueio...`);
        
        // limpa apenas os parâmetros dinâmicos e de rastreamento (tudo após # ou ?)
        let targetUrl = originalUrl.split('#')[0].split('?')[0];
        
        // Segurança extra: se a URL for apenas um ID em um teste interno
        if (!targetUrl.startsWith('http')) {
            targetUrl = `https://produto.mercadolivre.com.br/${id}`;
        }

        console.log(`🔗 Scraper acessando URL Canônica Limpa: ${targetUrl}`);

        const response = await axios.get(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
                'Accept': 'text/html'
            }
        });
        
        const html = response.data;

        const titleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i) || html.match(/<title>([^<]+)<\/title>/i);
        const imageMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);
        
        let extractedPrice = 0;

        const metaPriceMatch = html.match(/<meta\s+itemprop="price"\s+content="([^"]+)"/i);
        const ogPriceMatch = html.match(/<meta\s+property="product:price:amount"\s+content="([^"]+)"/i);
        const jsonPriceMatch = html.match(/"price"\s*:\s*"?(\d+(\.\d+)?)"?/i);
        const twitterPriceMatch = html.match(/<meta\s+name="twitter:data1"\s+content="R\$\s*([^"]+)"/i);
        const visualPriceMatch = html.match(/class="andes-money-amount__fraction"[^>]*>([^<]+)/i);

        if (metaPriceMatch) {
            extractedPrice = parseFloat(metaPriceMatch[1]);
        } else if (ogPriceMatch) {
            extractedPrice = parseFloat(ogPriceMatch[1]);
        } else if (jsonPriceMatch) {
            extractedPrice = parseFloat(jsonPriceMatch[1]);
        } else if (twitterPriceMatch) {
            const cleanPrice = twitterPriceMatch[1].replace(/\./g, '').replace(',', '.');
            extractedPrice = parseFloat(cleanPrice);
        } else if (visualPriceMatch) {
            const cleanPrice = visualPriceMatch[1].replace(/\./g, '').replace(',', '.');
            extractedPrice = parseFloat(cleanPrice);
        }

        if (!titleMatch || extractedPrice === 0 || isNaN(extractedPrice)) {
            console.error(`❌ Falha no Scraper. Preço final: ${extractedPrice}. URL processada: ${targetUrl}`);
            throw new Error('Falha ao extrair os dados do anúncio. A estrutura do HTML do Mercado Livre pode ter mudado.');
        }

        return {
            id: id,
            title: titleMatch[1].replace(' - Mercado Livre', '').trim(),
            price: extractedPrice,
            thumbnail: imageMatch ? imageMatch[1] : '',
            permalink: targetUrl
        };
    }

    // 4. O Motor de Extração de Dados Resiliente
    public static async scrape(input: string | { url: string }) {
        const entity = this.extractEntity(input);
        const originalUrl = typeof input === 'object' ? input.url : input;

        try {
            if (entity.type === 'product') {
                let data;
                
                try {
                    const productResponse = await this.fetchMeliAPI(`https://api.mercadolibre.com/products/${entity.id}`);
                    data = productResponse.data;
                } catch (apiError: any) {
                    const status = apiError.response?.status;
                    if (status === 403 || status === 401) {
                        return await this.fetchFrontendFallback(entity.id, originalUrl);
                    } else {
                        throw apiError;
                    }
                }

                let realPrice = 0;
                
                if (data.buy_box_winner?.item_id) {
                    try {
                        const itemResponse = await this.fetchMeliAPI(`https://api.mercadolibre.com/items/${data.buy_box_winner.item_id}`);
                        const itemData = itemResponse.data;
                        // Proteção extra para itens de vestuário que podem usar base_price
                        realPrice = itemData.price || itemData.base_price || 0;
                    } catch (e: any) {
                        const status = e.response?.status;
                        if (status === 403 || status === 401) {
                            const fallbackData = await this.fetchFrontendFallback(data.buy_box_winner.item_id, originalUrl);
                            realPrice = fallbackData.price;
                        }
                    }
                }

                if (realPrice === 0 || !realPrice) {
                    console.log(`⚠️ Produto sem Buy Box acessível. Forçando Fallback de HTML...`);
                    const fallbackData = await this.fetchFrontendFallback(entity.id, originalUrl);
                    realPrice = fallbackData.price;
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
            let data;
            try {
                const itemResponse = await this.fetchMeliAPI(`https://api.mercadolibre.com/items/${entity.id}`);
                data = itemResponse.data;
                
                //Resiliência de preço para items
                let itemPrice = data.price || data.base_price || 0;
                if (!itemPrice || itemPrice === 0) {
                    const fallbackData = await this.fetchFrontendFallback(entity.id, originalUrl);
                    itemPrice = fallbackData.price;
                }

                return {
                    id: data.id,
                    title: data.title,
                    price: itemPrice,
                    thumbnail: data.secure_thumbnail || data.thumbnail,
                    permalink: data.permalink
                };
            } catch (apiError: any) {
                const status = apiError.response?.status;
                if (status === 403 || status === 401) {
                    return await this.fetchFrontendFallback(entity.id, originalUrl);
                } else {
                    throw apiError;
                }
            }
            
        } catch (error: any) {
            const status = error.response?.status;
            
            if (status === 404) {
                throw new Error(`O anúncio/produto ${entity.id} não está ativo ou foi removido.`);
            }

            throw new Error(error.response?.data?.message || error.message || 'Falha na extração de dados.');
        }
    }
}