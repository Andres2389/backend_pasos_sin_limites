import { MercadoPagoConfig, Preference, Payment } from "mercadopago";
import Order from "../models/Order.js";

/* =========================
   CONFIG MERCADO PAGO
========================= */
const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

const preferenceClient = new Preference(client);
const paymentClient = new Payment(client);

/* =========================
   CREAR PREFERENCIA
========================= */
export const createMercadoPagoPreference = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ message: "orderId requerido" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Orden no encontrada" });
    }

    if (!["PENDING", "PENDIENTE"].includes(order.estado)) {
      return res.status(400).json({
        message: `Orden no pendiente (${order.estado})`,
      });
    }

    if (!order.total || Number(order.total) <= 0) {
      return res.status(400).json({ message: "Total inválido" });
    }

    const preference = {
      items: [
        {
          title: `Orden #${order._id}`,
          quantity: 1,
          unit_price: Number(order.total),
          currency_id: "COP",
        },
      ],

      back_urls: {
        success: `${process.env.FRONTEND_URL}/checkout/success`,
        failure: `${process.env.FRONTEND_URL}/checkout/failure`,
        pending: `${process.env.FRONTEND_URL}/checkout/pending`,
      },

      auto_return: "approved",

      external_reference: order._id.toString(),
    };

    const response = await preferenceClient.create({ body: preference });

    return res.json({
      ok: true,
      init_point: response.init_point, // ✅ SOLO PRODUCCIÓN
    });
  } catch (error) {
    console.error("❌ Mercado Pago:", error);
    res.status(500).json({
      ok: false,
      message: "Error Mercado Pago",
      error: error.message,
    });
  }
};

/* =========================
   WEBHOOK
========================= */
export const mercadoPagoWebhook = async (req, res) => {
  try {
    const { type, data } = req.body;

    if (type !== "payment") return res.sendStatus(200);

    const payment = await paymentClient.get({ id: data.id });
    const { status, external_reference } = payment;

    const order = await Order.findById(external_reference);
    if (!order) return res.sendStatus(404);

    const estados = {
      approved: "PAGADO",
      rejected: "CANCELADO",
      cancelled: "CANCELADO",
      pending: "PENDIENTE",
      in_process: "PENDIENTE",
    };

    order.estado = estados[status] || order.estado;
    await order.save();

    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Webhook MP:", err);
    res.sendStatus(500);
  }
};
