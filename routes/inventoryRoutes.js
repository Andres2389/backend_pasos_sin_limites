import express from 'express';
import InventoryMovement from '../models/InventoryMovement.js';
import Product from '../models/Product.js';

const router = express.Router();

// Obtener historial de movimientos
router.get('/movements', async (req, res) => {
  try {
    const movements = await InventoryMovement.find().populate('product user').sort({ date: -1 });
    res.json(movements);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener movimientos' });
  }
});

// Registrar movimiento manual (entrada/salida)
router.post('/movements', async (req, res) => {
  try {
    const { product, type, quantity, note } = req.body;
    const prod = await Product.findById(product);
    if (!prod) return res.status(404).json({ message: 'Producto no encontrado' });
    if (type === 'salida' && prod.stock < quantity) {
      return res.status(400).json({ message: 'Stock insuficiente' });
    }
    // Actualizar stock
    prod.stock += type === 'entrada' ? quantity : -quantity;
    await prod.save();
    // Registrar movimiento
    const movement = new InventoryMovement({
      product,
      type,
      quantity,
      // user: req.user?._id,
      note,
    });
    await movement.save();
    res.json(movement);
  } catch (err) {
    res.status(500).json({ message: 'Error al registrar movimiento' });
  }
});

export default router;
