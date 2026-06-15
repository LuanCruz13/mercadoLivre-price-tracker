import 'dotenv/config'; 
import express, { Request, Response } from 'express';
import cors from 'cors';
import { MercadoLivreScraper } from './services/MercadoLivreScraper';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json())


app.get('/ping', (req: Request, res: Response) => {
    res.status(200).send('pong');
});

app.post('/api/scrape', async (req: Request, res: Response): Promise<void> => {
  try {
      //req.body contém o objeto { "url": "..." }
      const result = await MercadoLivreScraper.scrape(req.body);
      
      //Retorna HTTP 200 (Success) e fecha a conexão do Insomnia
      res.status(200).json(result);
  } catch (error: any) {
      //Retorna HTTP 400 (Bad Request) caso o Regex falhe ou a API recuse
      res.status(400).json({ status: 'error', message: error.message });
  }
});
  
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});