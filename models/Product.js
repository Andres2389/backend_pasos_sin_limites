import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true },
    cantidad: { type: Number, required: true },
    valor: { type: Number, required: true },
    descripcion: { type: String, required: true },
    imagen: { type: String },
    talla: { type: [String], default: [] }, // Array de tallas disponibles

  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema);
