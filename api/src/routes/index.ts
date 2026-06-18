// src/routes/index.ts
import { Router } from "express";
import { productsRoutes } from "../routes/product-routes";

const routes = Router();

routes.use("/products", productsRoutes);

export { routes };