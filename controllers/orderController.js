// controllers/orderController.js
import mongoose from "mongoose";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import { sendEmail } from "../utils/sendEmail.js";


const generateCode = (length = 6) => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};


export const createOrder = async (req, res) => {
  try {
    // Obtener userId
    const userId = (req.user && req.user._id) || req.body.userId;
    if (!userId) {
      return res.status(400).json({ message: "No se proporcionó usuario." });
    }

    const { items, total } = req.body;
    if (!items || !items.length) {
      return res.status(400).json({ message: "El carrito está vacío." });
    }

    // Construir detalle de cada item y validar stock
    const orderItems = await Promise.all(
      items.map(async ({ productId, cantidad }) => {
        const product = await Product.findById(productId);
        if (!product) {
          throw new Error(`Producto no encontrado: ${productId}`);
        }
        if (product.cantidad < cantidad) {
          throw new Error(`Stock insuficiente para ${product.nombre}`);
        }
        return {
          product: product._id,
          nombre: product.nombre,
          cantidad,
          valorUnitario: product.valor,
          subTotal: cantidad * product.valor,
        };
      })
    );

    // Generar código único
    let codigoPedido, exists = true;
    while (exists) {
      codigoPedido = generateCode(6);
      exists = await Order.exists({ codigoRecogida: codigoPedido });
    }

    // Crear y guardar el pedido
    const newOrder = new Order({
      user: new mongoose.Types.ObjectId(userId),
      items: orderItems,
      total,
      codigoRecogida: codigoPedido,
      estado: "Pendiente",
    });
    await newOrder.save();

    // Enviar correo de confirmación
    const user = await User.findById(userId);
    const html = `
      <h1>Gracias por tu compra, ${user.nombre}!</h1>
      <p>Tu pedido ha sido registrado con éxito.</p>
      <ul>
        ${orderItems
          .map(i => `<li>${i.nombre} x ${i.cantidad} = $${i.subTotal.toFixed(2)}</li>`)
          .join("")}
      </ul>
      <p><strong>Total:</strong> $${total.toFixed(2)}</p>
      <p><strong>Código de tu pedido:</strong> <h2>${codigoPedido}</h2></p>
      <p>Presenta este código en el restaurante para recoger tu pedido.</p>
    `;
    await sendEmail(user.correo, "Tu pedido en costehuilense", html);

    // Responder al cliente
    return res.status(201).json({
      message: "Pedido creado correctamente",
      order: newOrder,
    });
  } catch (error) {
    console.error("Error en createOrder:", error);
    return res.status(500).json({ message: error.message });
  }
};



export const getMyOrders = async (req, res) => {
  try {
    // 1) Si hay middleware de auth, usa req.user._id, si no, usa query
    const userId = (req.user && req.user._id) || req.query.userId;
    if (!userId) {
      return res.status(400).json({ message: "No se proporcionó usuario." });
    }

    // 2) Buscamos y devolvemos el array directamente
    const orders = await Order.find({ user: userId }).sort({ createdAt: -1 });
    return res.json(orders);
  } catch (error) {
    console.error("Error en getMyOrders:", error);
    return res.status(500).json({ message: error.message });
  }
};


// Función para obtener todos los pedidos (admin)
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "nombre correo")
      .sort({ createdAt: -1 });
    return res.json(orders);
  } catch (error) {
    console.error("Error en getAllOrders:", error);
    return res.status(500).json({ message: error.message });
  }
};


// Función para entregar un pedido
export const deliverOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { codigoRecogida } = req.body;

    // 1) Buscar el pedido
    const order = await Order.findById(id).populate("user").populate("items.product");
    if (!order) {
      return res.status(404).json({ message: "Pedido no encontrado." });
    }

    // 2) Validar código
    if (order.codigoRecogida !== codigoRecogida) {
      return res.status(400).json({ message: "Código de recogida incorrecto." });
    }

    // 3) Sólo pendientes
    if (order.estado !== "Pendiente") {
      return res.status(400).json({ message: `Pedido ya está ${order.estado}.` });
    }

    // 4) Descontar stock de cada producto
    await Promise.all(
      order.items.map(async ({ product, cantidad }) => {
        await Product.findByIdAndUpdate(product._id, {
          $inc: { cantidad: -cantidad }
        });
      })
    );

    // 5) Marcar como completado
    order.estado = "Completado";
    await order.save();

    // 6) Notificar por correo
    const html = `
      <h1>Hola ${order.user.nombre},</h1>
      <p>Tu pedido <strong>${order.codigoRecogida}</strong> ha sido entregado.</p>
      <p>¡Gracias por confiar en costehuilense!</p>
    `;
    await sendEmail(order.user.correo, "Pedido Entregado", html);

    // 7) Responder
    return res.json({ message: "Pedido entregado y stock descontado.", order });
  } catch (error) {
    console.error("Error en deliverOrder:", error);
    return res.status(500).json({ message: "Error interno del servidor." });
  }
};