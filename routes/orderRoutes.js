
import express from "express";
import { createOrder, getMyOrders, getAllOrders, deliverOrder, cancelarPedido } from "../controllers/orderController.js";

const router = express.Router();

// Cancelar pedido (admin y user)
router.put("/:id/cancel", cancelarPedido);

// Crear un nuevo pedido (genera código de 6 dígitos)
router.post("/", createOrder);

// Listar los pedidos del usuario autenticado
router.get("/my", getMyOrders);


// Admin
router.get("/", getAllOrders);
router.put("/:id/deliver", deliverOrder);


export default router;
