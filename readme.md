# 🛒 Mercado Livre Price Tracker (Full-Stack Web Application)

Uma aplicação Full-Stack desenvolvida para rastreamento de preços e catálogos do Mercado Livre. O sistema permite que o usuário cole o link de um anúncio oficial, cadastre o produto e acompanhe um histórico de preços através de uma interface limpa e responsiva.

Este projeto foi estruturado em um padrão **Monorepo** (separando `/api` e `/web`), lidando desde a construção da UI até integrações complexas de backend (autenticação server-to-server, bypass de WAF e gestão de banco de dados).

## 🚀 Destaques Técnicos (Engineering Highlights)

A arquitetura do projeto foi pensada para resiliência e viabilidade em ambientes de nuvem:

### Front-end (Web)
*   **Interface Orientada ao Usuário:** Layout moderno, responsivo e focado na experiência do usuário (UX) para o cadastro e visualização imediata dos produtos rastreados.
*   **Comunicação Segura:** Consumo da API própria via requisições assíncronas com tratamento de erros (CORS devidamente configurado e variáveis de ambiente isoladas).
*   **Deploy Serverless:** Hospedado de forma autônoma na Vercel com CI/CD ativado.

### Back-end (API)
*   **Autenticação OAuth2 Autônoma:** O servidor gerencia de forma independente o `App Token` do Mercado Livre, identificando tokens expirados e fazendo o *refresh* automático (fluxo *Machine-to-Machine*).
*   **Fallback Strategy contra WAF:** Quando a API oficial do Mercado Livre bloqueia o acesso via 401/403, o sistema aciona um mecanismo secundário. Ele extrai cirurgicamente os dados vitais (título, preço e imagem) através das tags de Open Graph e microdados do HTML da página pública, garantindo alta resiliência e continuidade na sincronização dos dados, mesmo sob bloqueios severos.
*   **Database Integration:** Modelagem e persistência do histórico de preços utilizando PostgreSQL e Prisma ORM.

## 🧠 Decisões de Arquitetura e Trade-offs

Durante o desenvolvimento, uma decisão técnica crucial foi tomada para balancear a Regra de Negócios (capturar descontos dinâmicos de Pix) com as restrições da Nuvem (Free Tier):

Para capturar subsídios condicionais de Pix gerados no Client-Side pelo Mercado Pago, seria necessário utilizar ferramentas de *Web Scraping* profundo, como **Puppeteer** ou **Playwright**. Essa abordagem foi **descartada** pelas restrições físicas de ambientes Serverless gratuitos:
*   **Build Size:** Limite de 50MB (O Chromium exige >150MB).
*   **Memória (RAM):** Limite de 512MB, sujeito a *Out of Memory (OOM)*.
*   **Timeouts:** A renderização completa excederia o limite de 10s.

**Solução Adotada:** O consumo focado na API REST via Axios e extração leve via DOM estático garante tempos de resposta na casa dos milissegundos, consumo mínimo de memória e viabilidade de deploy 100% gratuito e ultraestável.

## 🛠️ Tecnologias Utilizadas

**Ecossistema Principal:** 
* 100% desenvolvido em **TypeScript** (End-to-End), garantindo segurança de tipos e previsibilidade entre o cliente e o servidor.

**Front-end (`/web`):**
*   React / Next.js (TypeScript)
*   Tailwind CSS (Estilização de componentes e layout)
*   Vercel (Deploy)

**Back-end (`/api`):**
*   TypeScript / Node.js
*   Prisma ORM
*   PostgreSQL (Neon)
*   Axios

## 💻 Como Rodar o Projeto Localmente

O projeto está dividido em duas pastas principais na raiz do repositório. Siga os passos abaixo:

### 1. Configurando a API (Back-end)
Navegue até a pasta da API:
```bash
cd api
npm install