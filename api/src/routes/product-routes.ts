// src/routes/products-routes.ts
import { Router } from "express";
import { ProductsController } from "../controllers/ProductsController";

const productsRoutes = Router();
const productsController = new ProductsController();

productsRoutes.post("/", productsController.create);
productsRoutes.get("/sync", productsController.sync);

productsRoutes.get("/", productsController.index);
productsRoutes.get("/:id", productsController.show);
productsRoutes.get("/:id/history", productsController.history);

export { productsRoutes };