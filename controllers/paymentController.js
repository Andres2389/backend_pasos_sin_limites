import { MercadoPagoConfig, Preference, Payment } from "mercadopago";
import Order from "../models/Order.js";

/* =========================
   CONFIGURACIÓN MERCADO PAGO
========================= */
const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

const preferenceClient = new Preference(client);
const paymentClient = new Payment(client);

/* =========================
   CREAR PREFERENCIA DE PAGO
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
        message: `La orden no está pendiente. Estado actual: ${order.estado}`,
      });
    }

    if (!order.total || isNaN(order.total) || Number(order.total) <= 0) {
      return res.status(400).json({ message: "Total inválido" });
    }

    /* =========================
       PREFERENCIA
    ========================= */
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

      payer: {
        email: "test_user_123456@testuser.com", // SOLO PARA PRUEBAS
      },
    };

    const response = await preferenceClient.create({
      body: preference,
    });

    return res.status(200).json({
      ok: true,
      preferenceId: response.id,

      // 👉 USAR ESTE EN PRUEBAS
      sandbox_init_point: response.sandbox_init_point,

      // 👉 USAR ESTE EN PRODUCCIÓN
      init_point: response.init_point,
    });
  } catch (error) {
    console.error("❌ Mercado Pago createPreference error:", error);

    return res.status(500).json({
      ok: false,
      message: "Error al crear preferencia de Mercado Pago",
      error: error.message,
    });
  }
};

/* =========================
   WEBHOOK MERCADO PAGO
========================= */
export const mercadoPagoWebhook = async (req, res) => {
  try {
    const { type, data } = req.body;

    if (type !== "payment" || !data?.id) {
      return res.status(200).json({ message: "Evento ignorado" });
    }

    const paymentInfo = await paymentClient.get({ id: data.id });

    const { status, external_reference } = paymentInfo;

    if (!external_reference) {
      return res.status(400).json({
        message: "external_reference vacío",
      });
    }

    const order = await Order.findById(external_reference);
    if (!order) {
      return res.status(404).json({ message: "Orden no encontrada" });
    }

    let nuevoEstado = order.estado;

    switch (status) {
      case "approved":
        nuevoEstado = "PAGADO";
        break;
      case "rejected":
      case "cancelled":
        nuevoEstado = "CANCELADO";
        break;
      case "pending":
      case "in_process":
        nuevoEstado = "PENDIENTE";
        break;
    }

    if (order.estado !== nuevoEstado) {
      order.estado = nuevoEstado;
      await order.save();
      console.log(`✅ Orden ${order._id} actualizada a ${nuevoEstado}`);
    }

    res.status(200).json({ message: "Webhook procesado" });
  } catch (error) {
    console.error("❌ Mercado Pago webhook error:", error);
    res.status(500).json({ message: "Error en webhook" });
  }
};
