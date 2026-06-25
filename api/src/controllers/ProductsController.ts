// src/controllers/ProductsController.ts
import { Request, Response, NextFunction } from "express";
import { MercadoLivreScraper } from "../services/MercadoLivreScraper";
import { prisma } from "../database/prisma";

class ProductsController {

  async create(request: Request, response: Response, next: NextFunction) {
    try{
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


    } catch (error){
        next(error);
    }
  }

  async index(request: Request, response: Response, next: NextFunction){
    try{
      const products = await prisma.product.findMany({
        orderBy: { updatedAt: "desc"},
      });

      const productsWithPrice = await Promise.all(
        products.map(async (prod) => {
          const latestPrice = await prisma.priceLog.findFirst({
            where: { productId: prod.id},
            orderBy: { createdAt: "desc"},
          });
          return {
            ...prod,
            currentPrice: latestPrice?.price || null,
          };
        })
      );

      return response.status(200).json(productsWithPrice);

    } catch (error){
      next(error);
    }
  }

  async history(request: Request, response: Response, next: NextFunction){
    try{
      const id = String(request.params.id);

      const history = await prisma.priceLog.findMany({
        where: { productId: id },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          price: true,
          createdAt: true,
        },
      });

      if (!history || history.length === 0) {
        return response.status(404).json({ message: "Nenhum histórico encontrado para este produto." });
      }

      return response.status(200).json(history);
    } catch (error){
      next(error);
    }
  }
}

export { ProductsController };