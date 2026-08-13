const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../../.env') }); 
const axios = require('axios');

async function getTokens() {
    try {
        const payload = new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: process.env.MELI_CLIENT_ID,
            client_secret: process.env.MELI_CLIENT_SECRET,
            code: process.env.MELI_AUTH_CODE,
            redirect_uri: 'https://www.google.com'
        });

        const response = await axios.post('https://api.mercadolibre.com/oauth/token', payload, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        console.log('🎉 SUCESSO! A API aceitou suas credenciais.');
        console.log(`MELI_ACCESS_TOKEN=${response.data.access_token}`);
        console.log(`MELI_REFRESH_TOKEN=${response.data.refresh_token}`);
        
    } catch (error) {
        console.error('❌ Falha na autenticação:');
        console.error(error.response ? error.response.data : error.message);
    }
}

getTokens();