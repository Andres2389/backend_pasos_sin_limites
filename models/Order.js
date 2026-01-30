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
  valorUnitario: { type: Number, required: true },
  subTotal: { type: Number, required: true },
  imagen: { type: String },
  talla: { type: String }, // <-- NUEVO: talla seleccionada (opcional)
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
      enum: ["PENDING", "DELIVERED", "CANCELLED", "PENDING_PAYMENT","ENTREGADO"],
      default: "PENDING",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
