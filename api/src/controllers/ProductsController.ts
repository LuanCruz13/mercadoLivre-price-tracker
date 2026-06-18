// src/controllers/ProductsController.ts
import { Request, Response } from "express";
import { MercadoLivreScraper } from "../services/MercadoLivreScraper";
import { prisma } from "../database/prisma";

class ProductsController {
  async create(request: Request, response: Response) {
    const { url } = request.body;

    if (!url) {
      return response.status(400).json({ error: "A URL do Mercado Livre é obrigatória." });
    }

    
    const scrapedData = await MercadoLivreScraper.scrape(url);

    const product = await prisma.product.upsert({
      where: { id: scrapedData.id },
      update: {
        title: scrapedData.title,
        thumbnail: scrapedData.thumbnail,
        permalink: scrapedData.permalink,
      },
      create: {
        id: scrapedData.id,
        title: scrapedData.title,
        thumbnail: scrapedData.thumbnail,
        permalink: scrapedData.permalink,
      },
    });

    const priceLog = await prisma.priceLog.create({
      data: {
        price: scrapedData.price,
        productId: product.id,
      },
    });

    return response.status(201).json({ product, latestPrice: priceLog });
  }
}

export { ProductsController };