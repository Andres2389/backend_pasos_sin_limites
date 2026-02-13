import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true },

    cantidad: { type: Number, required: true },

    valor: { type: Number, required: true },

    descripcion: { type: String, required: true },

    imagen: { type: String },

    // 🔥 CORREGIDO
    tallas: {
      type: String, // Guardamos como string JSON
      required: true,
      default: "",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema);
