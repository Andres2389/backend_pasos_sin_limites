// models/Order.js
import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  nombre: { type: String, required: true },
  cantidad: { type: Number, required: true },
  valorUnitario: { type: Number, required: true },     // antes "valor"
  subTotal: { type: Number, required: true },           // cantidad * valorUnitario
  imagen: { type: String },
});

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    items: [orderItemSchema],
    total: {                                           // antes "subtotal"
      type: Number,
      required: true,
    },
    codigoRecogida: {
      type: String,
      required: true,
      unique: true,
      minlength: 6,
      maxlength: 6,
    },
    estado: {
      type: String,
      enum: ["Pendiente", "Completado", "Cancelado"],
      default: "Pendiente",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
