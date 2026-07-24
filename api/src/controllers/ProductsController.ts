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
      const page = Number(request.query.page) || 1;
      const limit = Number(request.query.limit) || 12;

      //verificando quantos produtos iremos pular
      const skip = (page - 1) * limit;

      const products = await prisma.product.findMany({
        take:limit,
        skip: skip,
        orderBy: [
          {createdAt: "desc"},
          { id: "desc"}
        ],
        include: {
          priceLogs: {
            orderBy: { createdAt: "asc"}
          }
        }
      });

      const totalItems = await prisma.product.count();
      const hasMore = skip + products.length < totalItems;

      const formattedProducts = products.map((product) => ({
        id: product.id,
        title: product.title,
        thumbnail: product.thumbnail,
        permalink: product.permalink,

        currentPrice: product.priceLogs.length > 0 ? product.priceLogs[product.priceLogs.length - 1].price : null,

        history: product.priceLogs
      }));

      return response.status(200).json({
        data: formattedProducts,
        meta: {
          currentPage: page,
          totalItems,
          hasMore
        }
      });
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

  async sync(request: Request, response: Response, next: NextFunction){
    try{

      const clientKey = request.headers['x-api-key'];

      if (clientKey !== process.env.API_SECRET_KEY){
        return response.status(401).json({
          error: "Acesso não autorizado."
        });
      }
      
      const products = await prisma.product.findMany();

      if (products.length === 0){
        return response.status(200).json({ message: "Nenhum produto para sincronizar."});
      }

      let updatedCount = 0;
      let failedCount = 0;

      for (const product of products){
        try{

          const scrapedData = await MercadoLivreScraper.scrape(product.permalink);
          
          await prisma.priceLog.create({
            data: {
              price: scrapedData.price,
              productId: product.id
            },
          });

          updatedCount++;

        } catch (error){
            console.error(`Falha ao sincronizar o produto ID ${product.id}: `, error);
            failedCount++;
        }
      }

      return response.status(200).json({
        message: "Sincronização concluída com sucesso. ",
        resume: {
          total: products.length,
          updated: updatedCount,
          failed: failedCount
        }
      });

    } catch (error) {
      next(error);
    }
  }




}

export { ProductsController };