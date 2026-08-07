// src/server.ts
import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";

import { routes } from "./routes";

const PORT = process.env.PORT || 3001;
const app = express();

app.use(cors({
  // Permite o acesso tanto do seu ambiente local quanto do futuro ambiente de produção
  origin: [
    'http://localhost:3000', 
    process.env.FRONTEND_URL || '' 
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  // Libera os cabeçalhos padrão e a SUA chave secreta de sincronização
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
  credentials: true
}));


app.use(express.json());
app.use(routes);

// Middleware global de tratamento de erros
app.use((error: any, request: Request, response: Response, _: NextFunction) => {

  console.error(`[Erro Crítico]:`, error);

  if (error.status && error.status !== 500){
    return response.status(error.status).json({
      status: "error",
      message: error.message,
    });
  }

  //verifica se a aplicação está em prod.
  const isProduction = process.env.NODE_ENV === 'production'

  return response.status(500).json({
    status: "error",
    message: isProduction
      ? "Erro interno do servidor. A equipe técnica já foi notificada." 
      : error.message,
  });
});
