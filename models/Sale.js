import mongoose from 'mongoose';

const SaleSchema = new mongoose.Schema({
  products: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
      quantity: { type: Number, required: true },
      price: { type: Number, required: true },
    },
  ],
  total: { type: Number, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  date: { type: Date, default: Date.now },
  status: { type: String, enum: ['completed', 'cancelled'], default: 'completed' },
  numeroVenta: { type: String, unique: true, required: true },
});

export default mongoose.model('Sale', SaleSchema);
