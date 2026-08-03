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

    // 3. O Curinga: O Verdadeiro Web Scraper (Bypass de WAF)
    private static async fetchFrontendFallback(id: string, originalUrl: string) {
        console.log(`🛡️ Acionando Fallback de Frontend (HTML) para contornar o WAF de novo...`);
        
        // Se a URL original for um objeto ou falhar, montamos a rota padrão
        const targetUrl = originalUrl.startsWith('http') ? originalUrl : `https://produto.mercadolivre.com.br/${id}`;

        // O disfarce perfeito: simulamos ser o robô indexador do Google
        const response = await axios.get(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
                'Accept': 'text/html'
            }
        });
        
        const html = response.data;

        // Extraímos os dados cirurgicamente do HTML (Open Graph e Microdata)
        const titleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i) || html.match(/<title>([^<]+)<\/title>/i);
        const imageMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);
        // Tenta pegar o preço da meta tag ou do script JSON-LD interno
        const priceMatch = html.match(/<meta\s+itemprop="price"\s+content="([^"]+)"/i) || html.match(/"price":\s*(\d+(\.\d+)?)/i);

        if (!titleMatch || !priceMatch) {
            throw new Error('Falha ao extrair os dados do anúncio via HTML Scrape.');
        }

        return {
            id: id,
            // Limpa o "- Mercado Livre" que vem no título do HTML
            title: titleMatch[1].replace(' - Mercado Livre', '').trim(),
            price: parseFloat(priceMatch[1]),
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
                    // Se o WAF bloquear (401/403), ignoramos a API e lemos o HTML da página
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
                        realPrice = itemResponse.data.price;
                    } catch (e: any) {
                        const status = e.response?.status;
                        if (status === 403 || status === 401) {
                            const fallbackData = await this.fetchFrontendFallback(data.buy_box_winner.item_id, originalUrl);
                            realPrice = fallbackData.price;
                        }
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
            let data;
            try {
                const itemResponse = await this.fetchMeliAPI(`https://api.mercadolibre.com/items/${entity.id}`);
                data = itemResponse.data;
                
                return {
                    id: data.id,
                    title: data.title,
                    price: data.price,
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

            // Garante que qualquer outro erro suba com clareza
            throw new Error(error.response?.data?.message || error.message || 'Falha na extração de dados.');
        }
    }
}