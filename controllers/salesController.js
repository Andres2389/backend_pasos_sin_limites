// controllers/salesController.js
import Order from '../models/Order.js';
import Sale from '../models/Sale.js';
import Product from '../models/Product.js';
import InventoryMovement from '../models/InventoryMovement.js';
import User from '../models/User.js';

// POST /api/sales/admin
// Registrar venta solo para admin, valida stock y descuenta inventario
export const createAdminSale = async (req, res) => {
  try {
    const { userId, productos } = req.body;
    // Validar usuario admin
    const user = await User.findById(userId);
    if (!user || user.rol !== 'admin') {
      return res.status(403).json({ message: 'Solo el administrador puede registrar ventas.' });
    }
    // Validar productos y stock
    let total = 0;
    let ventaProductos = [];
    for (const item of productos) {
      const prod = await Product.findById(item._id);
      if (!prod) {
        return res.status(404).json({ message: `Producto no encontrado: ${item._id}` });
      }
      if (item.cantidad > prod.cantidad) {
        return res.status(400).json({ message: `Stock insuficiente para ${prod.nombre}` });
      }
      // Descontar stock
      prod.cantidad -= item.cantidad;
      await prod.save();
      // Registrar movimiento inventario
      await InventoryMovement.create({
        product: prod._id,
        type: 'salida',
        quantity: item.cantidad,
        user: user._id,
        note: 'Venta admin',
      });
      // Calcular total
      total += prod.valor * item.cantidad;
      ventaProductos.push({
        product: prod._id,
        quantity: item.cantidad,
        price: prod.valor,
        nombre: prod.nombre,
      });
    }
    // Registrar venta
    // Generar numeroVenta único (timestamp + random)
    const numeroVenta = `${Date.now()}${Math.floor(Math.random()*10000)}`;
    const venta = await Sale.create({
      products: ventaProductos,
      total,
      user: user._id,
      date: new Date(),
      status: 'completed',
      numeroVenta,
    });
    return res.json({ message: 'Venta registrada', venta });
  } catch (error) {
    console.error('Error en createAdminSale:', error);
    return res.status(500).json({ message: 'Error al registrar venta' });
  }
};

// GET /api/sales/daily?userId=xxx
// Ventas diarias por usuario admin
// Esta es la ÚNICA definición de getDailySales
export const getDailySales = async (req, res) => {
  try {
    // Si se pasa userId, mostrar ventas admin del día
    if (req.query.userId) {
      const { userId } = req.query;
      const user = await User.findById(userId);
      if (!user || user.rol !== 'admin') {
        return res.status(403).json({ message: 'Solo el administrador puede ver ventas diarias.' });
      }
      // Ventas del día
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      const ventas = await Sale.find({
        user: user._id,
        date: { $gte: start, $lte: end },
        status: 'completed',
      }).populate('products.product');
      // Formatear respuesta
      const ventasFormateadas = ventas.map(v => ({
        _id: v._id,
        fecha: v.date,
        total: v.total,
        productos: v.products.map(p => ({
          productId: p.product,
          nombre: p.nombre,
          cantidad: p.quantity,
        })),
      }));
      return res.json({ ventas: ventasFormateadas });
    }
    // Si se pasa date, mostrar resumen de pedidos entregados (lógica original)
    const dateStr = req.query.date;
    const now = new Date();
    let date = dateStr ? new Date(dateStr) : new Date(now.getFullYear(), now.getMonth(), now.getDate());
    date.setHours(0, 0, 0, 0);
    const nextDay = new Date(date);
    nextDay.setDate(date.getDate() + 1);
    const orders = await Order.find({
      estado: 'ENTREGADO',
      updatedAt: { $gte: date, $lt: nextDay },
    });
    let totalVendido = 0;
    let totalPedidos = orders.length;
    let totalProductos = 0;
    orders.forEach(order => {
      totalVendido += order.total;
      order.items.forEach(item => {
        totalProductos += item.cantidad;
      });
    });
    return res.json({
      fecha: date.toISOString().slice(0, 10),
      totalVendido,
      totalPedidos,
      totalProductos,
    });
  } catch (error) {
    console.error('Error en getDailySales:', error);
    return res.status(500).json({ message: 'Error al obtener ventas diarias' });
  }
};
