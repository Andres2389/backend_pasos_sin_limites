import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true },

    cantidad: { type: Number, required: true }, // stock general si lo usas

    valor: { type: Number, required: true },

    descripcion: { type: String, required: true },

    imagen: { type: String },

    // 🔥 NUEVO CAMPO
    tallas: {
      type: [Number], // array de números
      default: [],
    },
  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema);
