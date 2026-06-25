// src/server.ts
import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";

import { routes } from "./routes";

const PORT = process.env.PORT || 3001;
const app = express();

app.use(cors({
  origin: ['http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));


app.use(express.json());
app.use(routes);

// Middleware global de tratamento de erros
app.use((error: any, request: Request, response: Response, _: NextFunction) => {
  return response.status(error.status || 500).json({
    status: "error",
    message: error.message || "Erro interno do servidor",
  });
});

app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));