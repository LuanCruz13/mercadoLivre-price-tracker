// src/services/MercadoLivreAuth.ts

import axios from 'axios';
import { prisma } from '../database/prisma';

export class MercadoLivreAuth {
    private static readonly CONFIG_KEY = 'ML_TOKENS';
    private static readonly ML_OAUTH_URL = 'https://api.mercadolibre.com/oauth/token';

    // Pega o token atual do banco de dados
    public static async getValidToken(): Promise<string> {
        const config = await prisma.systemConfig.findUnique({
            where: { key: this.CONFIG_KEY }
        });

        if (!config) {
            throw new Error('Tokens do ML não encontrados no banco. Rode o setup inicial.');
        }

        const tokens = JSON.parse(config.value);
        return tokens.access_token;
    }

    // Faz a renovação autônoma se o Scraper avisar que o token venceu
    public static async refreshToken(): Promise<string> {
        const config = await prisma.systemConfig.findUnique({
            where: { key: this.CONFIG_KEY }
        });

        if (!config) return '';

        const tokens = JSON.parse(config.value);

        // 1. Extraímos as variáveis usando o nome exato que está no seu arquivo .env
        const clientId = process.env.MELI_CLIENT_ID;
        const clientSecret = process.env.MELI_CLIENT_SECRET;

        // 2. Trava de segurança: barra a execução se o arquivo .env não for lido corretamente
        if (!clientId || !clientSecret) {
            console.error('ERRO AMBIENTE: MELI_CLIENT_ID ou MELI_CLIENT_SECRET ausentes no .env.');
            throw new Error('Falha de configuração: Credenciais do aplicativo não encontradas.');
        }

        try {
            // 3. Montamos o formulário usando as variáveis seguras
            const payload = new URLSearchParams({
                grant_type: 'refresh_token',
                client_id: clientId,
                client_secret: clientSecret,
                refresh_token: tokens.refresh_token
            });

            // 4. Forçamos o envio como texto puro adicionando .toString()
            const response = await axios.post(this.ML_OAUTH_URL, payload.toString(), {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            const newTokens = response.data;

            // Salva as chaves novas no banco para os próximos ciclos
            await prisma.systemConfig.update({
                where: { key: this.CONFIG_KEY },
                data: {
                    value: JSON.stringify({
                        access_token: newTokens.access_token,
                        refresh_token: newTokens.refresh_token
                    })
                }
            });

            console.log('🔄 Token do Mercado Livre renovado com sucesso!');
            return newTokens.access_token;

        } catch (error: any) {
            console.error('❌ Falha crítica ao renovar token:', error.response?.data || error.message);
            throw new Error('Não foi possível renovar as credenciais do Mercado Livre.');
        }
    }
}