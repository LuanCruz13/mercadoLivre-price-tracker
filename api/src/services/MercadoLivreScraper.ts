
import axios from 'axios';

// Interface interna para tipar a extração
interface MeliEntity {
    type: 'item' | 'product';
    id: string;
}

export class MercadoLivreScraper {
    
    private static extractEntity(input: string | { url: string }): MeliEntity {
        const targetUrl = typeof input === 'object' ? input.url : input;

        //Confirma o formato do targetUrl (se é ou não uma string)
        if (!targetUrl || typeof targetUrl !== 'string') {
            throw new Error('Formato de entrada inválido. É esperada uma URL em formato string.');
        }

        //1a. REGRA: Verifica se é uma página de Catálogo (Product)
        //Isso evita o bloqueio 403, pois direciona para um endpoint permitido
        const productMatch = targetUrl.match(/\/p\/(MLB\d+)/i);
        if (productMatch && productMatch[1]) {
            return { type: 'product', id: productMatch[1].toUpperCase() };
        }

        //2a. REGRA: Verifica se é uma página de Anúncio Padrão (Item)
        const itemMatch = targetUrl.match(/MLB-?(\d+)/i);
        if (itemMatch && itemMatch[1]) {
            return { type: 'item', id: `MLB${itemMatch[1]}` };
        }

        throw new Error('ID do Mercado Livre não encontrado na URL fornecida.');
    }

    public static async scrape(input: string | { url: string }) {
        const entity = this.extractEntity(input);
        
        //Mantemos a URL original em memória para usar como fallback do link
        const originalUrl = typeof input === 'object' ? input.url : input;

        if (!process.env.MELI_ACCESS_TOKEN) {
            throw new Error('Falha interna: ACCESS_TOKEN não configurado no ambiente.');
        }


        //Configuração do Axios
        try {
            const config = {
                headers: {
                    'Authorization': `Bearer ${process.env.MELI_ACCESS_TOKEN}`
                }
            };

            //Roteamento inteligente baseado na entidade extraída
            if (entity.type === 'product') {
                // 1. Busca os dados da ficha técnica
                const productResponse = await axios.get(`https://api.mercadolibre.com/products/${entity.id}`, config);
                const data = productResponse.data;

                //console.log(data);

                //Batemos no endpoint auxiliar do produto para extrair o valor financeiro real
                const itemsResponse = await axios.get(`https://api.mercadolibre.com/products/${entity.id}/items`, config);
                
                let realPrice = 0;
                //Pegamos o preço do primeiro anúncio listado naquele catálogo
                if (itemsResponse.data && itemsResponse.data.results && itemsResponse.data.results.length > 0) {
                    realPrice = itemsResponse.data.results[0].price;
                }

                return {
                    id: data.id,
                    title: data.name, // Em products, o título vem na chave 'name'
                    price: realPrice, // Preço validado de fato
                    thumbnail: data.pictures?.[0]?.url || '',
                    permalink: data.permalink || originalUrl // Fallback para a URL original (primeira)
                };
            }

            //Retorno padrão para Items (Anúncios diretos)
            const itemResponse = await axios.get(`https://api.mercadolibre.com/items/${entity.id}`, config);
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