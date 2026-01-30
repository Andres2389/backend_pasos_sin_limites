import express from "express";
import {
  createMercadoPagoPreference,
  mercadoPagoWebhook,
} from "../controllers/paymentController.js";

const router = express.Router();

router.post("/create-preference", createMercadoPagoPreference);
router.post("/webhooks/mercadopago", mercadoPagoWebhook);

export default router;
