import mongoose from 'mongoose';

const InventoryMovementSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  type: { type: String, enum: ['entrada', 'salida'], required: true },
  quantity: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  note: { type: String },
});

export default mongoose.model('InventoryMovement', InventoryMovementSchema);
