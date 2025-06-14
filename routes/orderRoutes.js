import express from "express";
import { createOrder, getMyOrders, getAllOrders, deliverOrder } from "../controllers/orderController.js";

const router = express.Router();

// Crear un nuevo pedido (genera código de 6 dígitos)
router.post("/", createOrder);

// Listar los pedidos del usuario autenticado
router.get("/my", getMyOrders);


// Admin
router.get("/", getAllOrders);
router.put("/:id/deliver", deliverOrder);


export default router;
