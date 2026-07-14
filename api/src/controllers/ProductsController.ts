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
      //busca c/ join automático para trazer os produtos já com histórico anexado
      const products = await prisma.product.findMany({
        orderBy: { updatedAt: "desc"},
        include: {
          priceLogs: {
            orderBy: {createdAt: "desc"}
          }
        }
      });

      //formatação da resposta bater com a interface do front-end
      const productsWithPrice = products.map((prod) => {
          return {
            id: prod.id,
            title: prod.title,
            thumbnail: prod.thumbnail,
            permalink: prod.permalink,
            currentPrice: prod.priceLogs.length > 0 ? prod.priceLogs[0].price: null,
            history: prod.priceLogs
          };
        });

      return response.status(200).json(productsWithPrice);

    } catch (error){
      next(error);
    }
  }

  async show(request: Request, response: Response, next: NextFunction){
    try{
      const id = String(request.params.id);

      const product = await prisma.product.findUnique({
        where: {id},
        include: {
          priceLogs: {
            orderBy: {createdAt: "asc"}
          }
        }
      });

      if (!product){
        return response.status(404).json({ message: "Produto não encontrado. "});
      }

      const formattedProduct = {
        id: product.id,
        title: product.title,
        thumbnail: product.thumbnail,
        permalink: product.permalink,
        currentPrice: product.priceLogs.length > 0 ? product.priceLogs[product.priceLogs.length -1].price: null,
        history: product.priceLogs
      }

      return response.status(200).json(formattedProduct);

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