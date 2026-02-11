import express from 'express';
import InventoryMovement from '../models/InventoryMovement.js';
import Product from '../models/Product.js';

const router = express.Router();

// Obtener historial de movimientos
router.get('/movements', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const skip = (page - 1) * limit;

    let filter = {};
    if (search) {
      filter.$or = [
        { note: { $regex: search, $options: "i" } },
        { type: { $regex: search, $options: "i" } }
      ];
    }

    const movements = await InventoryMovement.find(filter)
      .populate('product user')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);
    const total = await InventoryMovement.countDocuments(filter);
    res.json({ movements, total, page, limit });
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
